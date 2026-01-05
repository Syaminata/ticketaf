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
    const { email, numero, password } = req.body;
    // Vérification des champs obligatoires
    if ((!email && !numero) || !password) {
      return res.status(400).json({ 
        message: 'Email/numéro et mot de passe sont requis' 
      });
    }
    // Construction de la requête
    const query = {
      $or: [
        { email: email || '' },
        { numero: numero || '' }
      ],
      role: { $ne: 'conducteur' } // Exclure les conducteurs
    };
    // Recherche de l'utilisateur
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ 
        message: 'Aucun compte trouvé avec ces identifiants' 
      });
    }
    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }
    // Création du token JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Réponse réussie
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      numero: user.numero,
      role: user.role
    };
    res.json({
      message: 'Connexion réussie',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion',
      error: err.message 
    });
  }
};




module.exports = { register, login };
