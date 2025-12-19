// Backend/scripts/fixPasswords.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Driver = require('../src/models/driver.model');
const User = require('../src/models/user.model');

// Configuration de la connexion à la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketaf';

async function fixDriverPasswords() {
  console.log('Début de la correction des mots de passe...');
  
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à la base de données');

    // Récupérer tous les conducteurs
    const drivers = await Driver.find({});
    console.log(`Nombre de conducteurs à vérifier: ${drivers.length}`);

    let fixedCount = 0;

    for (const driver of drivers) {
      try {
        // Trouver l'utilisateur correspondant
        const user = await User.findById(driver._id);
        
        if (!user) {
          console.log(`Utilisateur non trouvé pour le conducteur ${driver._id}`);
          continue;
        }

        // Vérifier si le mot de passe du conducteur est différent de celui de l'utilisateur
        if (driver.password !== user.password) {
          console.log(`Mise à jour du mot de passe pour le conducteur ${driver._id}`);
          driver.password = user.password; // Utiliser le mot de passe déjà haché de l'utilisateur
          await driver.save();
          fixedCount++;
        }
      } catch (error) {
        console.error(`Erreur lors du traitement du conducteur ${driver._id}:`, error.message);
      }
    }

    console.log(`\nCorrection terminée !`);
    console.log(`Mots de passe corrigés: ${fixedCount} sur ${drivers.length} conducteurs`);

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la correction des mots de passe:', error);
    process.exit(1);
  }
}

// Exécuter le script
fixDriverPasswords();