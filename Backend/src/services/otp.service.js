const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/otp.model');
const User = require('../models/user.model');

//  Config sécurité
const OTP_LENGTH = 6;            // 6 chiffres
const OTP_EXPIRATION_MIN = 5;    // 5 minutes
const MAX_ATTEMPTS = 3;          // 3 essais
const BLOCK_TIME_MIN = 10;       // 10 min blocage

// === Génération OTP ===
const generateOtp = async ({ userId, numero, purpose }) => {

  // Supprimer anciens OTP actifs
  await Otp.deleteMany({ userId, purpose, used: false });

  // Générer OTP aléatoire sécurisé
  const otp = crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH).toString();

  // Hash OTP
  const otpHash = await bcrypt.hash(otp, 10);

  // Expiration
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MIN * 60 * 1000);

  // Stockage
  await Otp.create({
    userId,
    numero,
    otpHash,
    purpose,
    expiresAt,
    attempts: 0,
    used: false
  });

  return { otp }; // ⚠️ uniquement pour dev/debug
};

// === Vérification OTP ===
const verifyOtp = async ({ numero, otp, purpose }) => {

  const otpRecord = await Otp.findOne({
    numero,
    purpose,
    used: false
  }).sort({ createdAt: -1 });

  if (!otpRecord) throw new Error('OTP invalide ou expiré');

  // Blocage temporaire
  if (otpRecord.blockedUntil && otpRecord.blockedUntil > new Date()) {
    throw new Error('Trop de tentatives. Réessayez plus tard');
  }

  // Expiration
  if (otpRecord.expiresAt < new Date()) {
    otpRecord.used = true;
    await otpRecord.save();
    throw new Error('OTP expiré');
  }

  // Comparaison
  const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

  if (!isValid) {
    otpRecord.attempts += 1;

    // Blocage si trop d'essais
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      otpRecord.blockedUntil = new Date(Date.now() + BLOCK_TIME_MIN * 60 * 1000);
    }

    await otpRecord.save();
    throw new Error('OTP incorrect');
  }

  // Valide
  otpRecord.used = true;
  await otpRecord.save();

  // Générer token sécurisé pour reset
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Stocker token dans OTP record
  otpRecord.resetToken = resetToken;
  await otpRecord.save();

  return { resetToken };
};

// === Reset Password ===
const resetPassword = async ({ resetToken, newPassword }) => {

  const otpRecord = await Otp.findOne({ resetToken, used: true });
  if (!otpRecord) throw new Error('Token invalide');

  const user = await User.findById(otpRecord.userId);
  if (!user) throw new Error('Utilisateur introuvable');

  // Hash nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  // Nettoyage OTP
  await Otp.deleteMany({ userId: user._id, purpose: otpRecord.purpose });

  return true;
};

module.exports = {
  generateOtp,
  verifyOtp,
  resetPassword
};
