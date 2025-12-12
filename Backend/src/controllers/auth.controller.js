const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// === Inscription ===
const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, numero, password, role, matricule, marque, capacity, capacity_coffre, climatisation } = req.body;

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

    if ((!email && !numero) || !password || !role) {
      return res.status(400).json({ 
        message: 'Email ou numéro, mot de passe et rôle requis',
        requiredFields: {
          emailOrNumber: !email && !numero,
          password: !password,
          role: !role
        }
      });
    }

    // Rechercher l'utilisateur par email ou numéro
    let user;
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        // Si non trouvé dans User, vérifier dans Driver
        user = await Driver.findOne({ email });
      }
    } else {
      user = await User.findOne({ numero });
      if (!user) {
        // Si non trouvé dans User, vérifier dans Driver
        user = await Driver.findOne({ numero });
      }
    }
    
    if (!user) {
      return res.status(404).json({ 
        message: 'Aucun compte trouvé avec ces identifiants',
        code: 'USER_NOT_FOUND'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Vérifie que le rôle choisi correspond au rôle réel
    if (user.role !== role) {
      return res.status(403).json({ 
        message: `Accès refusé. Vous n'êtes pas enregistré en tant que ${role}`,
        code: 'INVALID_ROLE',
        currentRole: user.role
      });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        isDriver: user instanceof mongoose.model('Driver')
      }, 
      process.env.JWT_SECRET || 'votre_secret_jwt', 
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      numero: user.numero,
      role: user.role
    };

    // Ajouter les détails spécifiques aux conducteurs si c'est un conducteur
    if (user instanceof mongoose.model('Driver')) {
      userResponse.driverDetails = {
        matricule: user.matricule,
        marque: user.marque,
        capacity: user.capacity,
        capacity_coffre: user.capacity_coffre,
        climatisation: user.climatisation,
        isActive: user.isActive
      };
    }

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: userResponse
    });

  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


module.exports = { register, login };
