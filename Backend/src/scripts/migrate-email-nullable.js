const mongoose = require('mongoose');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');

// Script de migration pour rendre l'email nullable
const migrateEmailNullable = async () => {
  try {
    console.log('🚀 Début de la migration pour rendre l\'email nullable...');
    
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketaf');
    console.log('✅ Connexion à la base de données établie');

    // Supprimer l'index unique sur l'email pour les utilisateurs
    try {
      await User.collection.dropIndex('email_1');
      console.log('✅ Index unique sur email supprimé pour les utilisateurs');
    } catch (error) {
      console.log('ℹ️  Index unique sur email n\'existait pas pour les utilisateurs');
    }

    // Supprimer l'index unique sur l'email pour les conducteurs
    try {
      await Driver.collection.dropIndex('email_1');
      console.log('✅ Index unique sur email supprimé pour les conducteurs');
    } catch (error) {
      console.log('ℹ️  Index unique sur email n\'existait pas pour les conducteurs');
    }

    // Créer un index sparse sur l'email pour les utilisateurs
    await User.collection.createIndex({ email: 1 }, { sparse: true, unique: true });
    console.log('✅ Index sparse créé pour l\'email des utilisateurs');

    // Créer un index sparse sur l'email pour les conducteurs
    await Driver.collection.createIndex({ email: 1 }, { sparse: true, unique: true });
    console.log('✅ Index sparse créé pour l\'email des conducteurs');

    // Mettre à jour les utilisateurs existants qui ont un email vide
    const usersUpdated = await User.updateMany(
      { email: { $in: ['', null, undefined] } },
      { $set: { email: null } }
    );
    console.log(`✅ ${usersUpdated.modifiedCount} utilisateurs mis à jour`);

    // Mettre à jour les conducteurs existants qui ont un email vide
    const driversUpdated = await Driver.updateMany(
      { email: { $in: ['', null, undefined] } },
      { $set: { email: null } }
    );
    console.log(`✅ ${driversUpdated.modifiedCount} conducteurs mis à jour`);

    console.log('🎉 Migration terminée avec succès !');
    console.log('📝 L\'email est maintenant optionnel pour les utilisateurs et conducteurs');
    console.log('📝 La connexion peut se faire par email ou numéro de téléphone');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de la base de données');
  }
};

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateEmailNullable();
}

module.exports = migrateEmailNullable;
