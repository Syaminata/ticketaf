const admin = require('../config/firebase');

async function sendNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map(token => ({
    token,
    notification: { title, body },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    }
  }));

  try {
    await admin.messaging().sendEach(messages);
  } catch (err) {
    console.error('Erreur FCM:', err.message);
  }
}

module.exports = { sendNotification };
