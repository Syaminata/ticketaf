const Otp = require('../models/otp.model');
const User = require('../models/user.model');
const otpService = require('../services/otp.service');

// === Demande OTP (reset password) ===
const requestOtp = async (req, res) => {
  try {
    const { numero } = req.body;

    if (!numero) {
      return res.status(400).json({ message: 'Le numéro est requis' });
    }

    // Vérifier utilisateur
    const user = await User.findOne({ numero });
    if (!user) {
      // Réponse neutre (sécurité)
      return res.status(200).json({
        message: 'Si ce numéro existe, un code a été généré'
      });
    }

    // Génération OTP (sans envoi SMS pour l’instant)
    const result = await otpService.generateOtp({
      userId: user._id,
      numero: user.numero,
      purpose: 'reset_password'
    });

    return res.status(200).json({
      message: 'OTP généré avec succès',
      // ⚠️ uniquement pour dev/debug
      dev_otp: result.otp
    });

  } catch (error) {
    console.error('Erreur requestOtp:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// === Vérification OTP ===
const verifyOtp = async (req, res) => {
  try {
    const { numero, otp } = req.body;

    if (!numero || !otp) {
      return res.status(400).json({ message: 'Numéro et OTP requis' });
    }

    const result = await otpService.verifyOtp({ numero, otp, purpose: 'reset_password' });

    return res.status(200).json({
      message: 'OTP valide',
      resetToken: result.resetToken
    });

  } catch (error) {
    console.error('Erreur verifyOtp:', error);
    res.status(400).json({ message: error.message });
  }
};

// === Confirmation reset password ===
const confirmResetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
    }

    const result = await otpService.resetPassword({ resetToken, newPassword });

    return res.status(200).json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur confirmResetPassword:', error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
  confirmResetPassword
};
