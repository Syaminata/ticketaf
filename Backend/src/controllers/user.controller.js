const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { sendAndSaveNotification } = require('../services/notification.service');


const getAllUsers = async (req, res) => {
  try {
    console.log('🔍 Backend getAllUsers - req.query:', req.query);
    
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const role   = req.query.role || '';

    console.log('📊 Pagination - page:', page, 'limit:', limit, 'skip:', skip);

    // Filtre de recherche textuelle
    const searchFilter = search ? {
      $or: [
        { name:   { $regex: search, $options: 'i' } },
        { numero: { $regex: search, $options: 'i' } },
        { email:  { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Ajouter le filtre rôle si précisé
    if (role && role !== 'all') {
      searchFilter.role = role;
    }

    // Une seule collection User suffit pour tous les rôles
    console.log('🔎 Recherche avec filter:', searchFilter);
    
    const [users, total] = await Promise.all([
      User.find(searchFilter).select('-password').sort({ name: 1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(searchFilter),
    ]);

    console.log('📈 Résultats - users.length:', users.length, 'total:', total);

    // Pour les conducteurs, enrichir avec les données Driver
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        if (user.role === 'conducteur') {
          const driver = await Driver.findById(user._id).select('-password').lean();
          return {
            ...user,
            isDriver:      true,
            tripCount:     driver?.tripCount || 0,
            driverDetails: driver || null,
          };
        }
        return user;
      })
    );

    const response = {
      users: enrichedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    console.log('📤 Réponse envoyée:', {
      usersCount: enrichedUsers.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

    res.json(response);

  } catch (err) {
    console.error('Erreur getAllUsers:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


const getUserById = async (req, res) => {
  try {
    // Récupérer les données User
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si c'est un conducteur, récupérer aussi ses données spécifiques
    if (user.role === 'conducteur') {
      const driver = await Driver.findById(req.params.id).select('-password');

      if (driver) {
        // Combiner les données User et Driver
        const combinedData = {
          ...user.toObject(),
          marque: driver.marque,
          matricule: driver.matricule,
          climatisation: driver.climatisation,
          wifi: driver.wifi,
          capacity: driver.capacity,
          capacity_coffre: driver.capacity_coffre,
          photo: driver.photo,
          rating: driver.rating,
          isActive: driver.isActive,
        };

        return res.status(200).json(combinedData);
      }
    }

    // Si ce n'est pas un conducteur, ou si les données driver n'existent pas
    res.status(200).json(user);

  } catch (err) {
    console.error('Erreur getUserById:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


const createUser = async (req, res) => {

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
      await user.save();

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
        address: req.body.address,
        climatisation: climatisation === 'true' || climatisation === true,
        isActive: false,
        role: 'conducteur'
      });
      await driver.save();
    } else {
      // Créer un utilisateur normal
      user = await User.create({
        name,
        email: email || undefined,
        password,
        numero,
        address: req.body.address,
        role: role || 'client'
      });
    }


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

    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    // Si l'utilisateur n'est pas trouvé, vérifier s'il s'agit d'un conducteur
    if (!user) {
      // Si ce n'est pas un utilisateur normal, vérifier si c'est un conducteur
      const driver = await Driver.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true, context: 'query' }
      ).select('-password');

      if (!driver) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      return res.status(200).json({
        message: 'Conducteur mis à jour',
        user: {
          ...driver.toObject(),
          role: 'conducteur',
          isDriver: true
        }
      });
    }

    // Si l'utilisateur est un conducteur, mettre à jour également la collection Driver
    if (user.role === 'conducteur') {
      const driverUpdate = { name, numero };
      if (email !== undefined) {
        driverUpdate.email = email || undefined;
      }
      if (address !== undefined) {
        driverUpdate.address = address;
      }

      await Driver.findByIdAndUpdate(
        req.params.id,
        driverUpdate,
        { runValidators: true }
      );
    }

    res.status(200).json({
      message: 'Utilisateur mis à jour',
      user: {
        ...user.toObject(),
        isDriver: user.role === 'conducteur'
      }
    });
  } catch (err) {
    console.error('Erreur updateUser:', err);

    // Gestion des erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Erreur de validation', errors: messages });
    }

    // Gestion des erreurs de clé unique (doublons)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Numéro ou email déjà utilisé' });
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

    // Détecter ce qui a changé avant la mise à jour
    const nameChanged = name && name !== user.name;
    const numeroChanged = numero && numero !== user.numero;

    // Mettre à jour l'utilisateur
    const updatedUser = await Model.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    // Envoyer les notifications selon ce qui a changé (non bloquant)
    if (nameChanged || numeroChanged) {
      const notifications = [];
      if (nameChanged) {
        notifications.push(
          sendAndSaveNotification(
            userId,
            'Nom mis à jour',
            `Votre nom a été modifié en "${name}" avec succès.`,
            { type: 'info', screen: 'profile' }
          )
        );
      }
      if (numeroChanged) {
        notifications.push(
          sendAndSaveNotification(
            userId,
            'Numéro modifié',
            `Votre numéro de téléphone a été modifié en "${numero}" avec succès.`,
            { type: 'info', screen: 'profile' }
          )
        );
      }
      Promise.all(notifications).catch(e => console.warn('⚠️ Notif updateProfile:', e.message));
    }

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

    // Pour un conducteur : synchroniser le hash dans User (loginDriver lit User.password)
    if (isDriver) {
      await User.findByIdAndUpdate(userId, { password: user.password });
    }

    // Notification de sécurité (non bloquant)
    sendAndSaveNotification(
      userId,
      'Mot de passe modifié',
      'Votre mot de passe a été changé avec succès. Si vous n\'êtes pas à l\'origine de cette action, contactez le support immédiatement.',
      { type: 'info', screen: 'profile' }
    ).catch(e => console.warn('⚠️ Notif changePassword:', e.message));

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
