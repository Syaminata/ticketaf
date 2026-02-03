const admin = require('firebase-admin');
const path = require('path');

let firebaseAdmin = null;

try {
  const fs = require('fs');
  
  const possiblePaths = [
    '/home/ubuntu/ticketaf/Backend/firebase-service-account.json',  // Production
    path.join(__dirname, '../firebase-service-account.json'),       // Local
  ];
  
  let serviceAccountPath = null;
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      serviceAccountPath = possiblePath;
      console.log('📁 Fichier Firebase trouvé:', serviceAccountPath);
      break;
    }
  }
  
  if (serviceAccountPath) {
    // Initialiser Firebase avec le fichier de service
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
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
