const admin = require('firebase-admin');
const path = require('path');

let firebaseAdmin = null;

try {
  // Vérifier si le fichier de service Firebase existe
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
  const fs = require('fs');
  
  if (fs.existsSync(serviceAccountPath)) {
    // Initialiser Firebase avec le fichier de service
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(require('../firebase-service-account.json')),
    });
    console.log('✅ Firebase initialisé avec succès');
  } else {
    // Initialiser Firebase sans authentification (mode développement)
    firebaseAdmin = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ticketaf-dev'
    });
    console.log('⚠️ Firebase initialisé en mode développement (sans fichier de service)');
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Firebase:', error.message);
  // Initialiser Firebase sans configuration pour éviter de crasher l'application
  firebaseAdmin = admin.initializeApp({
    projectId: 'ticketaf-dev'
  });
  console.log('🔄 Firebase initialisé en mode fallback');
}

module.exports = firebaseAdmin;
