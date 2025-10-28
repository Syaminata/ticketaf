const Driver = require('../models/driver.model');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');

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
  try {
    console.log('Données reçues:', req.body);
    console.log('Fichiers reçus:', req.files);
    
    const { name, email, password, numero, matricule, marque, capacity, capacity_coffre, climatisation } = req.body;
    
    // Validation des champs requis (email maintenant optionnel)
    if (!name || !password || !numero || !matricule || !marque || !capacity || !capacity_coffre) {
      console.log('Champs manquants:', { name: !name, email: !email, password: !password, numero: !numero, matricule: !matricule, marque: !marque, capacity: !capacity, capacity_coffre: !capacity_coffre });
      return res.status(400).json({ 
        message: 'Le nom, mot de passe, numéro, matricule, marque, capacité et capacité coffre sont requis',
        missing: {
          name: !name,
          password: !password,
          numero: !numero,
          matricule: !matricule,
          marque: !marque,
          capacity: !capacity,
          capacity_coffre: !capacity_coffre
        }
      });
    }

    // Validation des fichiers uploadés
    if (!req.files || !req.files.permis || !req.files.photo) {
      return res.status(400).json({ 
        message: 'Les fichiers permis et photo sont requis',
        missing: {
          permis: !req.files?.permis,
          photo: !req.files?.photo
        }
      });
    }

    // Validation du type de capacity
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ message: 'La capacité doit être un nombre positif' });
    }
    
    // Vérifier les doublons (email seulement si fourni)
    const orConditions = [{ numero }, { matricule }];
    if (email) {
      orConditions.push({ email });
    }
    
    const existingDriver = await Driver.findOne({ $or: orConditions });
    if (existingDriver) {
      console.log('Conducteur existant trouvé:', existingDriver);
      return res.status(400).json({ message: 'Email, numéro ou matricule déjà utilisé' });
    }

    // Vérifier l'email dans les utilisateurs (seulement si email fourni)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Utilisateur existant trouvé:', existingUser);
        return res.status(400).json({ message: 'Email déjà utilisé dans utilisateurs' });
      }
    }

    // Préparer les données des fichiers
    const permisData = {
      filename: req.files.permis[0].filename,
      originalName: req.files.permis[0].originalname,
      path: req.files.permis[0].path,
      uploadedAt: new Date()
    };

    const photoData = {
      filename: req.files.photo[0].filename,
      originalName: req.files.photo[0].originalname,
      path: req.files.photo[0].path,
      uploadedAt: new Date()
    };

    console.log('Création du conducteur...');
    const driver = await Driver.create({
      name, 
      email: email || null, 
      password, 
      numero, 
      matricule, 
      marque, 
      capacity: parseInt(capacity),
      capacity_coffre,
      climatisation: climatisation === 'true' || climatisation === true,
      permis: [permisData],
      photo: [photoData]
    });

    console.log('Conducteur créé:', driver._id);
    const driverSafe = { ...driver._doc };
    delete driverSafe.password;

    res.status(201).json({ message: 'Conducteur créé avec succès', driver: driverSafe });
  } catch (err) {
    console.error('Erreur createDriver:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
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
      updateData.email = email || null;
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

module.exports = { createDriver, getAllDrivers, updateDriver, deleteDriver, cleanFiles, activateDriver, deactivateDriver };
