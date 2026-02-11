const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const admin = require('../config/firebase');

// === Inscription ===
const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, numero, password, address, role, matricule, marque, capacity, capacity_coffre, climatisation } = req.body;

    if (!name || !numero || !password) {
      return res.status(400).json({ message: 'Le nom, numéro et mot de passe sont requis' });
    }

    // Vérifie si l'email existe déjà (seulement si email fourni)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
    }

    // Vérifier si le numéro est déjà utilisé
    const existingUserByNumber = await User.findOne({ numero });
    if (existingUserByNumber) {
      return res.status(400).json({ message: 'Numéro déjà utilisé' });
    }

    let user;
    let driver = null;

    if (role === 'conducteur') {
      // Vérifier les champs requis pour un conducteur
      if (!matricule || !marque || !capacity || !capacity_coffre) {
        return res.status(400).json({ 
          message: 'Pour un conducteur, les champs matricule, marque, capacity et capacity_coffre sont requis',
          requiredFields: {
            matricule: !matricule,
            marque: !marque,
            capacity: !capacity,
            capacity_coffre: !capacity_coffre
          }
        });
      }

      // Vérifier si le matricule est déjà utilisé
      const existingDriver = await Driver.findOne({ matricule });
      if (existingDriver) {
        return res.status(400).json({ message: 'Matricule déjà utilisé' });
      }

      // Créer d'abord l'utilisateur
      user = new User({
        name,
        email: email || undefined,
        password,
        numero,
        address,
        role: 'conducteur'
      });
      await user.save({ session });

      // Créer le conducteur associé
      driver = new Driver({
        _id: user._id, // Même ID que l'utilisateur
        name,
        email: email || undefined,
        password,
        numero,
        matricule,
        marque,
        capacity: parseInt(capacity),
        capacity_coffre,
        climatisation: climatisation === 'true' || climatisation === true,
        isActive: false,
        role: 'conducteur'
      });
      await driver.save({ session });

      await session.commitTransaction();
      session.endSession();

      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        numero: user.numero,
        role: user.role,
        driverDetails: {
          matricule: driver.matricule,
          marque: driver.marque,
          capacity: driver.capacity,
          capacity_coffre: driver.capacity_coffre,
          climatisation: driver.climatisation,
          isActive: driver.isActive
        }
      };

      return res.status(201).json({
        message: 'Conducteur créé avec succès',
        user: userResponse
      });
    } else {
      // Création d'un utilisateur normal
      user = await User.create([{
        name,
        email: email || undefined,
        password,
        numero,
        address,
        role: role || 'client'
      }], { session });
      
      await session.commitTransaction();
      session.endSession();
      
      user = user[0];
      
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
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Erreur register:', err);
    
    // Gestion des erreurs de validation
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        message: 'Erreur de validation',
        errors: messages 
      });
    }
    
    // Gestion des erreurs de doublon
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} déjà utilisé`,
        field
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue' 
    });
  }
};

// === Connexion ===
const login = async (req, res) => {
  try {
    const { email, numero, password, role } = req.body;

    if ((!email && !numero) || !password) {
      return res.status(400).json({ message: 'Numéro et mot de passe sont requis' });
    }
    if (!role) {
      return res.status(400).json({ message: 'Le rôle est requis' });
    }

    const query = {
      $or: [{ email: email || '' }, { numero: numero || '' }],
      role: { $eq: role, $ne: 'conducteur' }
    };
    const user = await User.findOne(query);
    if (!user) return res.status(403).json({ message: 'Veuillez choisir le rôle correspondant' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    // 🔹 Création du token JWT classique
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 🔹 Création du Firebase Custom Token
    const firebaseToken = await admin.auth().createCustomToken(user._id.toString());

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      numero: user.numero,
      role: user.role
    };

    // 🔹 On renvoie aussi le Custom Token Firebase
    res.json({
      message: 'Connexion réussie',
      token,           // token classique backend
      firebaseToken,   // token Firebase Custom
      user: userResponse
    });

  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion', error: err.message });
  }
};

// === Mise à jour du FCM Token ===
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id; // Récupéré depuis le middleware d'authentification

    if (!fcmToken) {
      return res.status(400).json({ 
        message: 'Le FCM token est requis' 
      });
    }

    // Mettre à jour le tableau fcmTokens de l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $addToSet: { 
          fcmTokens: { 
            token: fcmToken, 
            platform: req.body.platform || 'web',
            lastActive: new Date()
          } 
        } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      message: 'FCM token mis à jour avec succès',
      fcmTokens: user.fcmTokens
    });

  } catch (err) {
    console.error('Erreur lors de la mise à jour du FCM token:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la mise à jour du FCM token',
      error: err.message 
    });
  }
};

module.exports = { register, login, updateFcmToken };
