const admin = require('../config/firebase');

async function sendNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  // Vérifier si Firebase est correctement initialisé
  if (!admin || !admin.messaging) {
    console.log('⚠️ Firebase messaging non disponible - notification ignorée');
    return;
  }

  const messages = tokens.map(token => ({
    token,
    notification: { title, body },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    }
  }));

  try {
    const response = await admin.messaging().sendEach(messages);
    
    // Log des résultats pour debugging
    if (response.failureCount > 0) {
      console.log(`⚠️ ${response.failureCount}/${response.successCount + response.failureCount} notifications ont échoué`);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`❌ Token ${tokens[idx]}: ${resp.error?.message || 'Erreur inconnue'}`);
        }
      });
    } else {
      console.log(`✅ ${response.successCount} notifications envoyées avec succès`);
    }
  } catch (err) {
    console.error('❌ Erreur FCM:', err.message);
  }
}

module.exports = { sendNotification };
