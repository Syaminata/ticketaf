const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


const getAllUsers = async (req, res) => {
  try {
    // Récupérer d'abord les IDs des chauffeurs
    const driverIds = (await Driver.find({}, '_id')).map(d => d._id);
    
    // Récupérer les utilisateurs qui ne sont pas des chauffeurs
    const users = await User.find({ 
      _id: { $nin: driverIds } 
    }).select('-password');

    // Formater les chauffeurs
    const drivers = await Driver.find().select('-password');
    const formattedDrivers = drivers.map(driver => ({
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      numero: driver.numero,
      role: 'conducteur',
      isDriver: true,
      driverDetails: driver
    }));

    // Combiner les utilisateurs normaux et les chauffeurs formatés
    const allUsers = [...users, ...formattedDrivers];
    
    res.status(200).json(allUsers);
  } catch (err) {
    console.error('Erreur getAllUsers:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


const getUserById = async (req, res) => {
  try {
    let user = await User.findById(req.params.id).select('-password');
    if (!user) {
      user = await Driver.findById(req.params.id).select('-password');
      if (user) user.role = 'conducteur';
    }
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.status(200).json(user);
  } catch (err) {
    console.error('Erreur getUserById:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


const createUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, password, numero, role, matricule, marque, capacity, capacity_coffre, climatisation } = req.body;
    
    if (!name || !numero || !password) {
      return res.status(400).json({ message: 'Le nom, le numéro et le mot de passe sont requis' });
    }

    // Vérifie si l'email existe déjà (seulement si email fourni)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Vérifier si le numéro est déjà utilisé
    const existingUserByNumber = await User.findOne({ numero });
    if (existingUserByNumber) return res.status(400).json({ message: 'Numéro déjà utilisé' });

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
      if (existingDriver) return res.status(400).json({ message: 'Matricule déjà utilisé' });

      // Créer d'abord l'utilisateur
      user = new User({
        name,
        email: email || undefined,
        password,
        numero,
        role: 'conducteur',
        address: req.body.address
      });
      await user.save({ session });

      // Créer le conducteur associé
      driver = new Driver({
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
    } else {
      // Créer un utilisateur normal
      user = await User.create([{
        name,
        email: email || undefined,
        password,
        numero,
        address: req.body.address,
        role: role || 'client'
      }], { session });
      user = user[0];
    }

    await session.commitTransaction();
    session.endSession();

    const userSafe = user.toObject();
    delete userSafe.password;

    const response = { 
      message: role === 'conducteur' ? 'Conducteur créé avec succès' : 'Utilisateur créé avec succès',
      user: userSafe
    };

    if (driver) {
      const driverSafe = driver.toObject();
      delete driverSafe.password;
      response.driver = driverSafe;
    }

    res.status(201).json(response);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Erreur createUser:', err);

    // Gestion des erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors: messages });
    }

    // Gestion des erreurs de clé unique
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        message: field === 'email' ? 'Email déjà utilisé' : 
                field === 'numero' ? 'Numéro déjà utilisé' :
                field === 'matricule' ? 'Matricule déjà utilisé' :
                'Duplication détectée',
        field: field
      });
    }

    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, password, numero, role, address } = req.body;

    // Construction des champs à mettre à jour
    const updateData = { name, numero, role };
    
    // Ajouter l'adresse si elle est fournie
    if (address !== undefined) {
      updateData.address = address;
    }
    
    // Gérer l'email optionnel
    if (email !== undefined) {
      updateData.email = email || undefined;
    }

    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    // Recherche et mise à jour de l'utilisateur
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, context: 'query' } // important pour que les validateurs Mongoose fonctionnent
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ message: 'Utilisateur mis à jour', user });
  } catch (err) {
    console.error('Erreur updateUser:', err);

    // Gestion des erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors: messages });
    }

    // Gestion des erreurs de clé unique (doublons)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Numéro déjà utilisé' });
    }

    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};



const deleteUser = async (req, res) => {
  try {
    let user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      user = await Driver.findByIdAndDelete(req.params.id);
    }
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.status(200).json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error('Erreur deleteUser:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, numero, address } = req.body;
    const userId = req.user.id; // L'ID de l'utilisateur connecté
    const isDriver = req.user.role === 'conducteur';

    // Construction des champs à mettre à jour
    const updateData = { name, numero };
    
    // Ajouter l'adresse si elle est fournie
    if (address !== undefined) {
      updateData.address = address;
    }
    
    // Gérer l'email optionnel
    if (email !== undefined) {
      updateData.email = email || undefined;
    }

    // Vérifier si l'utilisateur existe
    const Model = isDriver ? Driver : User;
    const user = await Model.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await Model.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    res.status(200).json({ 
      success: true,
      message: 'Profil mis à jour avec succès', 
      user: updatedUser 
    });
  } catch (err) {
    console.error('Erreur updateProfile:', err);

    // Gestion des erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors: messages });
    }

    // Gestion des erreurs de clé unique (doublons)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Numéro déjà utilisé' });
    }

    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // L'ID de l'utilisateur connecté
    const isDriver = req.user.role === 'conducteur';

    // Vérifier que les champs requis sont présents
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe actuel et le nouveau mot de passe sont requis' 
      });
    }

    // Vérifier si l'utilisateur existe
    const Model = isDriver ? Driver : User;
    const user = await Model.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Mot de passe actuel incorrect' 
      });
    }
    
    // Mettre à jour le mot de passe (le middleware pre('save') s'occupera du hachage)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Mot de passe mis à jour avec succès' 
    });
  } catch (err) {
    console.error('Erreur changePassword:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors du changement de mot de passe',
      error: err.message 
    });
  }
};

module.exports = { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  updateProfile,
  changePassword
};
