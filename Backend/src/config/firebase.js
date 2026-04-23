const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseAdmin = null;
let isFirebaseAvailable = false;

try {
  // Chemin spécifique fourni par l'utilisateur
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '../../firebase-service-account.json');

  console.log('🔍 Recherche Firebase à:', serviceAccountPath);
  console.log('📂 Fichier existe:', fs.existsSync(serviceAccountPath));

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseAvailable = true;
    console.log('✅ Firebase initialisé avec succès');
    console.log('   Projet:', serviceAccount.project_id);
    console.log('   Service Account:', serviceAccount.client_email);
  } else {
    console.error('❌ ERREUR: Fichier Firebase introuvable à:', serviceAccountPath);
    console.error('📍 Chemin absolu:', path.resolve(serviceAccountPath));
    console.error('📂 Répertoires actuels:');
    const dir = path.dirname(serviceAccountPath);
    if (fs.existsSync(dir)) {
      console.error('   ', fs.readdirSync(dir));
    } else {
      console.error('   Répertoire inexistant');
    }
    isFirebaseAvailable = false;

    // Fallback dummy object
    firebaseAdmin = {
      messaging: () => ({ sendEach: async () => ({ successCount: 0, failureCount: 0, responses: [] }) }),
      auth: () => ({ createCustomToken: async () => null }),
    };
  }
} catch (error) {
  console.error('❌ ERREUR initialisation Firebase:', error.message);
  console.error('   Stack:', error.stack);
  isFirebaseAvailable = false;
  firebaseAdmin = {
    messaging: () => ({ sendEach: async () => ({ successCount: 0, failureCount: 0, responses: [] }) }),
    auth: () => ({ createCustomToken: async () => null }),
  };
}

module.exports = firebaseAdmin;
module.exports.isAvailable = isFirebaseAvailable;
