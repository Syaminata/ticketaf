const admin = require('../config/firebase');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');

async function cleanupInvalidTokens(invalidTokens) {
  if (!invalidTokens || invalidTokens.length === 0) return;

  try {
    // Nettoyer chez les utilisateurs
    await User.updateMany(
      { 'fcmTokens.token': { $in: invalidTokens } },
      { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
    );

    // Nettoyer chez les chauffeurs
    await Driver.updateMany(
      { 'fcmTokens.token': { $in: invalidTokens } },
      { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
    );

    console.log(`🧹 ${invalidTokens.length} tokens invalides nettoyés de la base de données`);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des tokens invalides:', error);
  }
}

async function sendNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  if (!admin || !admin.messaging) {
    console.log('⚠️ Firebase messaging non disponible - notification ignorée');
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const messages = tokens.map(token => ({
    token,

    notification: {
      title,
      body,
    },

    android: {
      notification: {
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      }
    },

    data: {
      type: data.type || 'ADMIN_MESSAGE',
      screen: 'notifications',
      notificationId: data.notificationId || '',
    }
  }));


  try {
    const response = await admin.messaging().sendEach(messages);
    
    // Collecter les tokens invalides
    const invalidTokens = [];
    
    // Log des résultats pour debugging
    if (response.failureCount > 0) {
      console.log(`⚠️ ${response.failureCount}/${response.successCount + response.failureCount} notifications ont échoué`);
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`❌ Token ${tokens[idx]}: ${resp.error?.message || 'Erreur inconnue'}`);
          
          // Ajouter à la liste des tokens invalides si l'erreur est "Requested entity was not found"
          if (resp.error?.message === 'Requested entity was not found.' || 
              resp.error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        }
      });
    } else {
      console.log(`✅ ${response.successCount} notifications envoyées avec succès`);
    }
    
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens
    };
  } catch (err) {
    console.error('❌ Erreur FCM:', err.message);
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }
}

module.exports = { sendNotification, cleanupInvalidTokens };
