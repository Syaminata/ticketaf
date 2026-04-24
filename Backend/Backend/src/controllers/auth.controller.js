const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const { sendWelcomeNotification } = require('../services/notification.service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');

// === Inscription ===
const register = async (req, res) => {
  try {
    const { name, email, numero, password, address, role, matricule, marque, capacity, capacity_coffre, climatisation } = req.body;

    if (!name || !numero || !password) {
      return res.status(400).json({ message: 'Le nom, numéro et mot de passe sont requis' });
    }

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
    }

    const existingUserByNumber = await User.findOne({ numero });
    if (existingUserByNumber) {
      return res.status(400).json({ message: 'Numéro déjà utilisé' });
    }

    let user;
    let driver = null;

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
      await user.save();

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
        isActive: false,
        role: 'conducteur'
      });
      await driver.save();

      return res.status(201).json({ message: 'Conducteur créé', user });
    } else {
      user = await User.create({
        name,
        email: email || undefined,
        password,
        numero,
        address,
        role: role || 'client'
      });

      return res.status(201).json({ message: 'Utilisateur créé', user });
    }
  } catch (err) {
    console.error('❌ Erreur inscription:', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'champ';
      const labels = { numero: 'Numéro déjà utilisé', email: 'Email déjà utilisé', matricule: 'Matricule déjà utilisé' };
      return res.status(400).json({ message: labels[field] || 'Valeur déjà utilisée' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, numero, password, role } = req.body;

    const query = {
      $or: [{ email: email || '' }, { numero: numero || '' }],
      role: role
    };

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (user.pendingDeletion) {
      return res.status(404).json({ message: 'Ce compte n\'existe pas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'ticketaf_secret_key_2024_local_dev',
      { expiresIn: '7d' }
    );

    let firebaseToken = null;
    if (admin && admin.auth) {
      try {
        firebaseToken = await admin.auth().createCustomToken(user._id.toString());
      } catch (e) {}
    }

    res.json({ message: 'Connexion réussie', token, firebaseToken, user });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;
    const userId = req.user._id;

    if (!fcmToken) return res.status(400).json({ message: 'FCM token requis' });

    // Nettoyer ce token partout ailleurs d'abord
    await User.updateMany(
      { 'fcmTokens.token': fcmToken },
      { $pull: { fcmTokens: { token: fcmToken } } }
    );
    await Driver.updateMany(
      { 'fcmTokens.token': fcmToken },
      { $pull: { fcmTokens: { token: fcmToken } } }
    );

    // Ajouter au bon utilisateur
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

    // Si c'est un conducteur, mettre à jour aussi la collection Driver
    if (user && user.role === 'conducteur') {
      await Driver.findByIdAndUpdate(
        userId,
        {
          $addToSet: {
            fcmTokens: {
              token: fcmToken,
              platform: platform || 'android',
              lastActive: new Date()
            }
          }
        }
      );
    }

    // Envoyer la notification de bienvenue uniquement si pas encore envoyée
    if (user && !user.welcomeNotificationSent) {
      sendWelcomeNotification(userId, user.name)
        .catch(e => console.warn('⚠️ Notif bienvenue:', e.message));
    }

    res.json({ message: 'Token mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { fcmToken } = req.body;

    // Nettoyer le token FCM actif si fourni
    if (userId && fcmToken) {
      await User.findByIdAndUpdate(userId, { $pull: { fcmTokens: { token: fcmToken } } });
      await Driver.findByIdAndUpdate(userId, { $pull: { fcmTokens: { token: fcmToken } } });
    }

    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { register, login, updateFcmToken, logout };
