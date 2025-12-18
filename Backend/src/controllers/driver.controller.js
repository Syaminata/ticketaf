const mongoose = require('mongoose');
const Driver = require('../models/driver.model');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Fonction pour nettoyer les fichiers manquants
const cleanMissingFiles = async () => {
  try {
    const drivers = await Driver.find({});
    const uploadsDir = path.join(__dirname, '../../uploads/drivers');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    for (const driver of drivers) {
      if (driver.permis && driver.permis.length > 0) {
        const permisFile = driver.permis[0];
        if (permisFile && permisFile.filename) {
          const permisPath = path.join(uploadsDir, permisFile.filename);
          if (!fs.existsSync(permisPath)) {
            console.log(`Fichier permis manquant pour ${driver.name}: ${permisFile.filename}`);
            await Driver.findByIdAndUpdate(driver._id, { $unset: { permis: 1 } });
          }
        }
      }
      
      if (driver.photo && driver.photo.length > 0) {
        const photoFile = driver.photo[0];
        if (photoFile && photoFile.filename) {
          const photoPath = path.join(uploadsDir, photoFile.filename);
          if (!fs.existsSync(photoPath)) {
            console.log(`Fichier photo manquant pour ${driver.name}: ${photoFile.filename}`);
            await Driver.findByIdAndUpdate(driver._id, { $unset: { photo: 1 } });
          }
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers manquants:', error);
  }
};


const createDriver = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, numero, password, matricule, marque, capacity, capacity_coffre, climatisation } = req.body;

    // 1. Validation des entrées
    if (!name || !numero || !password || !matricule || !marque || !capacity || !capacity_coffre) {
      return res.status(400).json({ 
        message: 'Tous les champs sont obligatoires',
        required: {
          name: !name,
          numero: !numero,
          password: !password,
          matricule: !matricule,
          marque: !marque,
          capacity: !capacity,
          capacity_coffre: !capacity_coffre
        }
      });
    }

    // Vérifier les fichiers uploadés
    if (!req.files?.permis?.[0] || !req.files?.photo?.[0]) {
      return res.status(400).json({ 
        message: 'Les fichiers permis et photo sont requis',
        missing: {
          permis: !req.files?.permis?.[0],
          photo: !req.files?.photo?.[0]
        }
      });
    }

    // 2. Vérifier les doublons
    const existingUser = await User.findOne({ $or: [{ email }, { numero }] }).session(session);
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email ou numéro déjà utilisé',
        exists: true
      });
    }

    const existingDriver = await Driver.findOne({ $or: [{ email }, { numero }, { matricule }] }).session(session);
    if (existingDriver) {
      return res.status(400).json({ 
        message: 'Email, numéro ou matricule déjà utilisé',
        exists: true
      });
    }

    // 4. Créer l'utilisateur
    const user = new User({
      name,
      email: email || undefined,
      password: password,
      numero,
      role: 'conducteur'
    });
    await user.save({ session });

    // 5. Créer le conducteur avec le mot de passe déjà haché
    const driver = new Driver({
      _id: user._id,
      name,
      email: email || undefined,
      numero,
      password: user.password, // Utiliser le mot de passe déjà haché de l'utilisateur
      matricule,
      marque,
      capacity: parseInt(capacity),
      capacity_coffre,
      climatisation: climatisation === 'true' || climatisation === true,
      isActive: false,
      role: 'conducteur',
      permis: [{
        filename: req.files.permis[0].filename,
        path: req.files.permis[0].path
      }],
      photo: [{
        filename: req.files.photo[0].filename,
        path: req.files.photo[0].path
      }]
    });

    await driver.save({ session });
    await session.commitTransaction();
    session.endSession();

    // 6. Réponse
    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        numero: user.numero,
        role: user.role
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Erreur lors de l\'inscription du conducteur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'inscription',
      error: error.message 
    });
  }
};


const getAllDrivers = async (req, res) => {
  try {
    // Nettoyer les fichiers manquants avant de retourner les données
    await cleanMissingFiles();
    
    const drivers = await Driver.find().select('-password');
    res.status(200).json(drivers);
  } catch (err) {
    console.error('Erreur getAllDrivers:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


const updateDriver = async (req, res) => {
  try {
    console.log('Données reçues pour mise à jour:', req.body);
    console.log('Fichiers reçus pour mise à jour:', req.files);
    
    const { name, email, password, numero, matricule, marque, capacity, capacity_coffre, climatisation } = req.body;

    const updateData = { name, numero, matricule, marque, capacity, capacity_coffre, climatisation: climatisation === 'true' || climatisation === true };
    
    // Gérer l'email optionnel
    if (email !== undefined) {
      if (email && email.trim() !== '') {
        updateData.email = email.trim();
      } else {
        // on supprime le champ email si l'utilisateur l'efface
        updateData.email = undefined;
      }
    }
    
    if (password && password.trim() !== '') {
      updateData.password = password; 
    }

    // Traiter les fichiers uploadés s'ils sont présents
    if (req.files) {
      if (req.files.permis && req.files.permis.length > 0) {
        const permisData = {
          filename: req.files.permis[0].filename,
          originalName: req.files.permis[0].originalname,
          path: req.files.permis[0].path,
          uploadedAt: new Date()
        };
        updateData.permis = [permisData];
      }

      if (req.files.photo && req.files.photo.length > 0) {
        const photoData = {
          filename: req.files.photo[0].filename,
          originalName: req.files.photo[0].originalname,
          path: req.files.photo[0].path,
          uploadedAt: new Date()
        };
        updateData.photo = [photoData];
      }
    }

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!driver) return res.status(404).json({ message: 'Conducteur non trouvé' });

    res.status(200).json({ message: 'Conducteur mis à jour', driver });
  } catch (err) {
    console.error('Erreur updateDriver:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Conducteur non trouvé' });


    res.status(200).json({ message: 'Conducteur supprimé' });
  } catch (err) {
    console.error('Erreur deleteDriver:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Route pour nettoyer les fichiers manquants
const cleanFiles = async (req, res) => {
  try {
    await cleanMissingFiles();
    res.status(200).json({ message: 'Nettoyage des fichiers manquants terminé' });
  } catch (err) {
    console.error('Erreur cleanFiles:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const activateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');
    if (!driver) return res.status(404).json({ message: 'Conducteur non trouvé' });
    res.status(200).json({ message: 'Conducteur activé', driver });
  } catch (err) {
    console.error('Erreur activateDriver:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deactivateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    if (!driver) return res.status(404).json({ message: 'Conducteur non trouvé' });
    res.status(200).json({ message: 'Conducteur désactivé', driver });
  } catch (err) {
    console.error('Erreur deactivateDriver:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
// Épingler un chauffeur
const pinDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { pinnedOrder } = req.body; // Optionnel : définir l'ordre

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Chauffeur non trouvé' });
    }

    driver.isPinned = true;
    driver.pinnedAt = new Date();
    if (pinnedOrder !== undefined) {
      driver.pinnedOrder = pinnedOrder;
    }

    await driver.save();

    res.status(200).json({ 
      message: 'Chauffeur épinglé avec succès', 
      driver: { 
        _id: driver._id, 
        name: driver.name, 
        isPinned: driver.isPinned,
        pinnedOrder: driver.pinnedOrder 
      } 
    });
  } catch (err) {
    console.error('Erreur pinDriver:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Désépingler un chauffeur
const unpinDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Chauffeur non trouvé' });
    }

    driver.isPinned = false;
    driver.pinnedAt = null;
    driver.pinnedOrder = 0;

    await driver.save();

    res.status(200).json({ 
      message: 'Chauffeur désépinglé avec succès', 
      driver: { 
        _id: driver._id, 
        name: driver.name, 
        isPinned: driver.isPinned 
      } 
    });
  } catch (err) {
    console.error('Erreur unpinDriver:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Obtenir tous les chauffeurs épinglés
const getPinnedDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ isPinned: true })
      .select('-password')
      .sort({ pinnedOrder: 1 });
    
    res.status(200).json(drivers);
  } catch (err) {
    console.error('Erreur getPinnedDrivers:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { createDriver, getAllDrivers, updateDriver, deleteDriver, cleanFiles, activateDriver, deactivateDriver, unpinDriver, pinDriver, getPinnedDrivers };
