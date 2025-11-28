const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const bcrypt = require('bcryptjs');


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const drivers = await Driver.find().select('-password');

    
    const formattedDrivers = drivers.map(driver => ({
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      numero: driver.numero,
      role: 'conducteur',
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt
    }));

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
  try {
    const { name, email, password, numero, role } = req.body;
    
    if (!name || !numero || !password) {
      return res.status(400).json({ message: 'Le nom, le numéro et le mot de passe sont requis' });
    }

    if (role === 'conducteur') {
      return res.status(403).json({ message: 'Vous ne pouvez pas créer de conducteur ici' });
    }

    // Vérifie si l'email existe déjà (seulement si email fourni)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    
    const user = await User.create({ name, email: email || undefined, numero, password, role });
    const userSafe = { ...user._doc };
    delete userSafe.password;

    res.status(201).json({ message: 'Utilisateur créé avec succès', user: userSafe });
  } catch (err) {
    console.error('Erreur createUser:', err);

    // Gestion des erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors: messages });
    }

    // Gestion des erreurs de clé unique
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email ou numéro déjà utilisé' });
    }

    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, password, numero, role } = req.body;

    // Construction des champs à mettre à jour
    const updateData = { name, numero, role };
    
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

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
