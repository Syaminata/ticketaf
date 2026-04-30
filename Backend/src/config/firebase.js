const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseAdmin = null;
let isFirebaseAvailable = false;

try {
  let serviceAccount = null;

  // Priority 1: JSON string in env var (recommended for AWS/cloud deployments)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('🔥 Firebase: credentials chargés depuis FIREBASE_SERVICE_ACCOUNT_JSON');
    } catch (parseErr) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON invalide (JSON malformé):', parseErr.message);
    }
  }

  // Priority 2: file path from env var or default location
  if (!serviceAccount) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      || path.join(__dirname, '../../firebase-service-account.json');

    console.log('🔍 Recherche Firebase à:', serviceAccountPath);
    console.log('📂 Fichier existe:', fs.existsSync(serviceAccountPath));

    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else {
      console.error('❌ ERREUR: Fichier Firebase introuvable à:', serviceAccountPath);
      console.error('📍 Chemin absolu:', path.resolve(serviceAccountPath));
      console.error('💡 Sur AWS: définir la variable FIREBASE_SERVICE_ACCOUNT_JSON avec le contenu JSON du service account');
    }
  }

  if (serviceAccount) {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseAvailable = true;
    console.log('✅ Firebase initialisé avec succès');
    console.log('   Projet:', serviceAccount.project_id);
    console.log('   Service Account:', serviceAccount.client_email);
  } else {
    isFirebaseAvailable = false;
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