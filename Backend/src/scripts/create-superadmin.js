const mongoose = require('mongoose');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

// Script pour créer un superadmin par défaut
const createSuperAdmin = async () => {
  try {
    console.log('🚀 Création du super administrateur...');
    
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketaf');
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si un superadmin existe déjà
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('ℹ️  Un super administrateur existe déjà:', existingSuperAdmin.name);
      return;
    }

    // Créer le superadmin
    const superAdmin = await User.create({
      name: 'Super Administrateur',
      email: 'superadmin@ticketaf.com',
      numero: '771234567',
      password: 'superadmin123',
      role: 'superadmin'
    });

    console.log('✅ Super administrateur créé avec succès !');
    console.log('📧 Email:', superAdmin.email);
    console.log('📱 Numéro:', superAdmin.numero);
    console.log('🔑 Mot de passe: superadmin123');
    console.log('👤 Rôle: superadmin');

  } catch (error) {
    console.error('❌ Erreur lors de la création du super administrateur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de la base de données');
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin;
