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
    const { name, email, numero, password, matricule, marque, capacity, capacity_coffre, climatisation, address } = req.body;

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
          capacity_coffre: !capacity_coffre,
          address: !address
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
    console.log('Recherche de doublons pour:', { email, numero });
    
    // Construire la requête de manière dynamique
    const query = { $or: [{ numero: numero }] };
    if (email) {
      query.$or.push({ email: email });
    }
    
    console.log('Requête de recherche:', JSON.stringify(query));
    const existingUser = await User.findOne(query).session(session);
    
    if (existingUser) {
      const numeroExists = existingUser.numero === numero;
      const emailExists = email && existingUser.email === email;
      
      console.log('Utilisateur existant trouvé:', {
        _id: existingUser._id,
        email: existingUser.email,
        numero: existingUser.numero,
        role: existingUser.role,
        numeroExists,
        emailExists
      });
      
      return res.status(400).json({ 
        message: numeroExists ? 'Numéro déjà utilisé' : 'Email déjà utilisé',
        exists: true,
        details: {
          emailExists,
          numeroExists,
          userId: existingUser._id,
          existingNumero: existingUser.numero,
          existingEmail: existingUser.email
        }
      });
    }

    // Vérifier les doublons dans la collection Driver
    const driverQuery = { 
      $or: [
        { numero: numero },
        { matricule: matricule }
      ]
    };
    if (email) {
      driverQuery.$or.push({ email: email });
    }
    
    console.log('Recherche de conducteur existant:', JSON.stringify(driverQuery));
    const existingDriver = await Driver.findOne(driverQuery).session(session);
    
    if (existingDriver) {
      const numeroExists = existingDriver.numero === numero;
      const emailExists = email && existingDriver.email === email;
      const matriculeExists = existingDriver.matricule === matricule;
      
      console.log('Conducteur existant trouvé:', {
        _id: existingDriver._id,
        email: existingDriver.email,
        numero: existingDriver.numero,
        matricule: existingDriver.matricule,
        numeroExists,
        emailExists,
        matriculeExists
      });
      
      return res.status(400).json({ 
        message: numeroExists ? 'Numéro déjà utilisé' : 
                emailExists ? 'Email déjà utilisé' :
                'Matricule déjà utilisé',
        exists: true,
        details: {
          emailExists,
          numeroExists,
          matriculeExists,
          existingNumero: existingDriver.numero,
          existingMatricule: existingDriver.matricule,
          existingEmail: existingDriver.email
        }
      });
    }

    // 4. Créer l'utilisateur
    if (!req.body.address) {
      return res.status(400).json({ 
        message: 'Le champ adresse est obligatoire',
        required: {
          address: true
        }
      });
    }
    
    const user = new User({
      name,
      email: email || undefined, // Soit un email valide, soit undefined
      password: password,
      numero,
      address: req.body.address.trim(),
      role: 'conducteur'
    });
    
    await user.save({ session });

    // 5. Créer le conducteur avec le mot de passe déjà haché
    const driver = new Driver({
      _id: user._id,
      name,
      email: email || undefined, // Même logique que pour l'utilisateur
      numero,
      password: user.password, 
      matricule,
      marque,
      capacity: parseInt(capacity),
      capacity_coffre,
      address: req.body.address.trim(), // Utiliser la même adresse que l'utilisateur
      climatisation: climatisation === 'true' || climatisation === true,
      isActive: false,
      role: 'conducteur',
      permis: [{
        filename: req.files.permis[0].filename,
        originalName: req.files.permis[0].originalname,
        path: req.files.permis[0].path,
        uploadedAt: new Date()
      }],
      photo: [{
        filename: req.files.photo[0].filename,
        originalName: req.files.photo[0].originalname,
        path: req.files.photo[0].path,
        uploadedAt: new Date()
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
    
    // Récupérer tous les conducteurs
    const drivers = await Driver.find()
      .select('-password')
      .lean();
    
    // Pour chaque conducteur, compter le nombre de voyages
    const driversWithTripCount = await Promise.all(drivers.map(async (driver) => {
      const tripCount = await mongoose.model('Voyage').countDocuments({ 
        driver: driver._id,
        status: { $in: ['completed', 'in_progress'] } // Compter uniquement les voyages terminés ou en cours
      });
      
      // Retourner le conducteur avec le nombre de voyages et le statut
      return {
        ...driver,
        tripCount,
        status: driver.isActive ? 'Actif' : 'Inactif',
        isActive: driver.isActive || false
      };
    }));
    
    // Trier les conducteurs par nombre de voyages décroissant
    driversWithTripCount.sort((a, b) => b.tripCount - a.tripCount);
    
    res.status(200).json(driversWithTripCount);
  } catch (err) {
    console.error('Erreur getAllDrivers:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


const updateDriver = async (req, res) => {
  try {
    console.log('Données reçues pour mise à jour:', req.body);
    console.log('Fichiers reçus pour mise à jour:', req.files);
    
    const { name, email, password, numero, matricule, marque, capacity, capacity_coffre, climatisation, address } = req.body;

    // Vérifier que l'adresse est fournie
    if (address !== undefined && (!address || address.trim() === '')) {
      return res.status(400).json({ 
        success: false,
        message: 'Le champ adresse est obligatoire' 
      });
    }

    const updateData = { 
      name, 
      numero, 
      matricule, 
      marque, 
      capacity, 
      capacity_coffre, 
      climatisation: climatisation === 'true' || climatisation === true
    };
    
    // Only add email to updateData if it's provided, not empty, and not the string 'undefined'
    if (email && email.trim() !== '' && email.trim().toLowerCase() !== 'undefined') {
      updateData.email = email.trim();
    }
    
    // Ajouter l'adresse si elle est fournie
    if (address !== undefined) {
      updateData.address = address.trim();
    }
    
    // Gérer l'email optionnel - version corrigée
    if (email !== undefined) {
      if (email && email.trim() !== '' && email.trim().toLowerCase() !== 'undefined') {
        updateData.email = email.trim();
      } else {
        // Ne pas inclure le champ email s'il est vide ou 'undefined'
        delete updateData.email;
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

    // Mettre à jour l'utilisateur associé avec les mêmes informations
    const userUpdate = {};
    if (email !== undefined) {
      userUpdate.email = email && email.trim() !== '' ? email.trim() : undefined;
    }
    
    // Mettre à jour le nom et le numéro aussi pour garder la cohérence
    if (name !== undefined) userUpdate.name = name;
    if (numero !== undefined) userUpdate.numero = numero;
    
    // Ne procéder à la mise à jour que si on a des champs à mettre à jour
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(
        req.params.id,
        userUpdate,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({ message: 'Conducteur et utilisateur associé mis à jour', driver });
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
      .sort({ pinnedOrder: 1 })
      .lean();
    
    // Pour chaque conducteur, compter le nombre de voyages
    const driversWithTripCount = await Promise.all(drivers.map(async (driver) => {
      const tripCount = await mongoose.model('Voyage').countDocuments({ driver: driver._id });
      // Mettre à jour le compteur dans la base de données
      await Driver.findByIdAndUpdate(driver._id, { tripCount });
      
      // Retourner le conducteur avec le nombre de voyages
      return {
        ...driver,
        tripCount
      };
    }));
    
    res.status(200).json(driversWithTripCount);
  } catch (err) {
    console.error('Erreur getPinnedDrivers:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
// 1. Récupérer le profil du conducteur connecté
const getMyProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id).select('-password');
    if (!driver) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    res.status(200).json(driver);
  } catch (err) {
    console.error('Erreur getMyProfile:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// 2. Mettre à jour son propre profil (sans fichiers)
const updateMyProfile = async (req, res) => {
  try {
    const { name, email, numero, matricule, marque, capacity, capacity_coffre, climatisation, address } = req.body;
    
    // Vérifier que l'adresse est fournie
    if (address !== undefined && (!address || address.trim() === '')) {
      return res.status(400).json({ 
        success: false,
        message: 'Le champ adresse est obligatoire' 
      });
    }
    
    console.log('Données reçues pour mise à jour profil:', req.body);
    console.log('Fichiers reçus:', req.files);

    // Vérifier si le numéro existe déjà pour un autre utilisateur
    if (numero) {
      const existingDriver = await Driver.findOne({ 
        numero, 
        _id: { $ne: req.user.id } 
      });
      if (existingDriver) {
        return res.status(400).json({ 
          success: false,
          message: 'Ce numéro est déjà utilisé par un autre conducteur' 
        });
      }
    }
    
    // Vérifier si l'email existe déjà pour un autre utilisateur
    if (email && email.trim() !== '') {
      const existingDriver = await Driver.findOne({ 
        email, 
        _id: { $ne: req.user.id } 
      });
      if (existingDriver) {
        return res.status(400).json({ 
          success: false,
          message: 'Cet email est déjà utilisé par un autre conducteur' 
        });
      }
    }

    // Vérifier si la matricule existe déjà pour un autre conducteur
    if (matricule && matricule.trim() !== '') {
      const existingDriver = await Driver.findOne({ 
        matricule, 
        _id: { $ne: req.user.id } 
      });
      if (existingDriver) {
        return res.status(400).json({ 
          success: false,
          message: 'Cette matricule est déjà utilisée par un autre conducteur' 
        });
      }
    }

    // Construire l'objet de mise à jour
    const updateData = {};
    
    if (name) updateData.name = name.trim();
    if (numero) updateData.numero = numero.trim();
    if (matricule) updateData.matricule = matricule.trim();
    if (marque) updateData.marque = marque.trim();
    if (capacity) updateData.capacity = parseInt(capacity);
    if (capacity_coffre) updateData.capacity_coffre = capacity_coffre;
    if (climatisation !== undefined) {
      updateData.climatisation = climatisation === 'true' || climatisation === true;
    }
    
    // Gérer l'email (peut être vide)
    if (email !== undefined) {
      updateData.email = email.trim() || undefined;
    }

    // Traiter les fichiers uploadés
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

    console.log('Données à mettre à jour:', updateData);

    // Mettre à jour le conducteur
    const driver = await Driver.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({ 
        success: false,
        message: 'Profil non trouvé' 
      });
    }

    // Mettre à jour aussi dans la collection User
    const userUpdateData = { name: updateData.name, numero: updateData.numero };
    if (updateData.email !== undefined) {
      userUpdateData.email = updateData.email;
    }
    await User.findByIdAndUpdate(req.user.id, userUpdateData);

    res.status(200).json({ 
      success: true,
      message: 'Profil mis à jour avec succès', 
      driver 
    });
  } catch (err) {
    console.error('Erreur updateMyProfile:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: err.message 
    });
  }
};

// 3. Changer son mot de passe
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Tous les champs sont requis' 
      });
    }

    if (newPassword.length < 5) {
      return res.status(400).json({ 
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 5 caractères' 
      });
    }

    // Récupérer le conducteur avec le mot de passe
    const driver = await Driver.findById(req.user.id);
    if (!driver) {
      return res.status(404).json({ 
        success: false,
        message: 'Conducteur non trouvé' 
      });
    }

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, driver.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Mot de passe actuel incorrect' 
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe dans Driver et User
    await Driver.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.status(200).json({ 
      success: true,
      message: 'Mot de passe modifié avec succès' 
    });
  } catch (err) {
    console.error('Erreur changePassword:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: err.message 
    });
  }
};

module.exports = { createDriver, getAllDrivers, updateDriver, deleteDriver, cleanFiles, activateDriver, deactivateDriver, unpinDriver, pinDriver, getPinnedDrivers, getMyProfile, updateMyProfile, changePassword };
