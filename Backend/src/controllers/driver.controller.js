const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const { sendWelcomeNotification } = require('../services/notification.service');


// ====================== REGISTER ======================
const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name, email, numero, password, address, role,
      matricule, marque, capacity, capacity_coffre,
      climatisation, wifi
    } = req.body;

    // 🔹 Validation
    if (!name || !numero || !password) {
      return res.status(400).json({ message: 'Nom, numéro et mot de passe requis' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
    }

    const existingNumero = await User.findOne({ numero });
    if (existingNumero) {
      return res.status(400).json({ message: 'Numéro déjà utilisé' });
    }

    let user, driver;

    // ================= CONDUCTEUR =================
    if (role === 'conducteur') {

      if (!matricule || !marque || !capacity || !capacity_coffre) {
        return res.status(400).json({ message: 'Champs conducteur manquants' });
      }

      const existingDriver = await Driver.findOne({ matricule });
      if (existingDriver) {
        return res.status(400).json({ message: 'Matricule déjà utilisé' });
      }

      user = new User({
        name,
        email: email || undefined,
        password,
        numero,
        address,
        role: 'conducteur'
      });

      await user.save({ session });

      driver = new Driver({
        _id: user._id,
        name,
        email: email || undefined,
        password,
        numero,
        matricule,
        marque,
        capacity: parseInt(capacity),
        capacity_coffre,
        address,
        climatisation: climatisation === 'true' || climatisation === true,
        wifi: wifi === 'true' || wifi === true,
        isActive: false,
        role: 'conducteur'
      });

      await driver.save({ session });
    }

    // ================= CLIENT =================
    else {
      user = await User.create([{
        name,
        email: email || undefined,
        password,
        numero,
        address,
        role: role || 'client'
      }], { session });

      user = user[0];
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        numero: user.numero,
        role: user.role
      }
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error('❌ Register error:', err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} déjà utilisé` });
    }

    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// ====================== LOGIN ======================
const login = async (req, res) => {
  try {
    const { email, numero, password, role } = req.body;

    if ((!email && !numero) || !password || !role) {
      return res.status(400).json({ message: 'Identifiants incomplets' });
    }

    const user = await User.findOne({
      $or: [{ email: email || '' }, { numero: numero || '' }],
      role
    });

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    // 🔹 JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // 🔹 Firebase
    let firebaseToken = null;
    const uid = user._id.toString();

    try {
      await admin.auth().getUser(uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid,
          email: user.email,
          displayName: user.name
        });
      }
    }

    firebaseToken = await admin.auth().createCustomToken(uid);

    res.json({
      message: 'Connexion réussie',
      token,
      firebaseToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        numero: user.numero,
        role: user.role
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// ====================== UPDATE FCM ======================
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;
    const userId = req.user._id;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token requis' });
    }

    //  Nettoyer partout
    await User.updateMany(
      { 'fcmTokens.token': fcmToken },
      { $pull: { fcmTokens: { token: fcmToken } } }
    );

    await Driver.updateMany(
      { 'fcmTokens.token': fcmToken },
      { $pull: { fcmTokens: { token: fcmToken } } }
    );

    //  Ajouter
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          fcmTokens: {
            token: fcmToken,
            platform: platform || 'android',
            lastActive: new Date()
          }
        }
      },
      { new: true }
    );

    //  Sync Driver
    if (user?.role === 'conducteur') {
      await Driver.findByIdAndUpdate(userId, {
        $addToSet: {
          fcmTokens: {
            token: fcmToken,
            platform: platform || 'android',
            lastActive: new Date()
          }
        }
      });
    }

    // 🔹 Notification bienvenue
    if (user && !user.welcomeNotificationSent) {
      sendWelcomeNotification(userId, user.name)
        .catch(e => console.warn('Notif erreur:', e.message));
    }

    res.json({ message: 'Token mis à jour' });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// ====================== LOGOUT ======================
const logout = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fcmToken } = req.body;

    if (fcmToken) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token: fcmToken } }
      });

      await Driver.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token: fcmToken } }
      });
    }

    res.json({ message: 'Déconnexion réussie' });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


module.exports = {
  register,
  login,
  updateFcmToken,
  logout
};