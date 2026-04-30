const admin = require('../config/firebase');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const UserNotification = require('../models/userNotification.model');
const { emitToUser } = require('../socket');

/**
 * Convertit toutes les valeurs d'un objet en strings (requis par FCM)
 */
function stringifyDataValues(data = {}) {
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = '';
    } else if (typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

async function cleanupInvalidTokens(invalidTokens) {
  if (!invalidTokens || invalidTokens.length === 0) return;

  try {
    await User.updateMany(
      { 'fcmTokens.token': { $in: invalidTokens } },
      { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
    );
    await Driver.updateMany(
      { 'fcmTokens.token': { $in: invalidTokens } },
      { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
    );
    console.log(`🧹 ${invalidTokens.length} tokens invalides nettoyés`);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des tokens:', error);
  }
}

/**
 * ENVOIE et SAUVEGARDE une notification (Push + In-App + Socket)
 * options.saveToDb = false → push only, no DB save, no Socket.IO
 */
async function sendAndSaveNotification(userIds, title, body, data = {}, options = {}) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const saveToDb = options.saveToDb !== false;
  try {
    const uiType = (data.uiType || data.type || 'info').toLowerCase();

    let notifIdByUser = {};

    if (saveToDb) {
      // 1. Sauvegarde en DB pour chaque utilisateur
      const savedNotifs = await Promise.all(
        ids.map(uid => UserNotification.create({
          user: uid,
          title,
          body,
          type: uiType,
          data: data,
          read: false
        }))
      );

      // 2. Émission en temps réel via Socket.IO
      savedNotifs.forEach(notif => {
        emitToUser(notif.user, 'notification', {
          _id: notif._id,
          title: notif.title,
          body: notif.body,
          type: notif.type,
          data: notif.data,
          createdAt: notif.createdAt
        });
      });

      savedNotifs.forEach(n => {
        notifIdByUser[n.user.toString()] = n._id.toString();
      });
    }

    // 3. Récupération des tokens FCM par utilisateur
    const [users, drivers] = await Promise.all([
      User.find({ _id: { $in: ids } }),
      Driver.find({ _id: { $in: ids } })
    ]);

    // Deduplicate by _id: chauffeurs exist in both users + drivers collections
    const uniqueRecipients = [...new Map([...users, ...drivers].map(u => [u._id.toString(), u])).values()];

    const messages = [];
    uniqueRecipients.forEach(u => {
      if (!u.fcmTokens || u.fcmTokens.length === 0) return;
      const notificationId = notifIdByUser[u._id.toString()] || '';
      const fcmData = stringifyDataValues({
        ...data,
        title,
        body,
        notificationId,
        type: uiType,
        screen: 'notifications',
      });
      u.fcmTokens.forEach(t => {
        messages.push({
          token: t.token,
          notification: { title, body },
          data: fcmData,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'tiketaf_channel',
            },
          },
          apns: {
            payload: {
              aps: { sound: 'default', badge: 1, contentAvailable: true, alert: { title, body } }
            }
          }
        });
      });
    });

    if (messages.length === 0) {
      return { success: true, saved: saveToDb };
    }

    if (admin && admin.messaging) {
      const response = await admin.messaging().sendEach(messages);

      // Nettoyer les tokens invalides (désinstallation, expiration)
      const invalidTokens = [];
      response.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/invalid-argument'
          ) {
            invalidTokens.push(messages[i].token);
          }
        }
      });
      if (invalidTokens.length > 0) {
        cleanupInvalidTokens(invalidTokens).catch(() => {});
      }

      return { success: true, saved: saveToDb, response };
    }

    return { success: true, saved: saveToDb, info: 'Firebase admin non initialisé' };
  } catch (error) {
    console.error('Notification Service Error:', error);
    return { success: false, error };
  }
}

async function sendNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0, invalidTokens: [] };
  if (!admin || !admin.messaging) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  const fcmData = stringifyDataValues({ ...data, title, body, type: data.type || 'ADMIN_MESSAGE', screen: 'notifications' });

  const messages = tokens.map(token => ({
    token,
    data: fcmData,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } } },
  }));

  try {
    const response = await admin.messaging().sendEach(messages);
    return { successCount: response.successCount, failureCount: response.failureCount };
  } catch (err) {
    console.error('❌ Erreur FCM:', err.message);
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }
}

async function sendWelcomeNotification(userId, userName) {
  try {
    // Atomic check-and-set prevents duplicate notifications on concurrent calls
    const user = await User.findOneAndUpdate(
      { _id: userId, welcomeNotificationSent: { $ne: true } },
      { $set: { welcomeNotificationSent: true, firstLoginDate: new Date() } },
      { new: false }
    );

    if (!user) return { success: true, alreadySent: true };

    const isDriver = user.role === 'conducteur';
    const firstName = userName ? userName.split(' ')[0] : '';
    const body = isDriver
      ? `Bonjour ${firstName}, bienvenu sur Ticketaf ! Planifiez vos voyages et prenez des clients.`
      : `Bonjour ${firstName}, bienvenu sur Ticketaf ! Réservez votre trajet ou envoyez un colis facilement.`;

    await sendAndSaveNotification(
      userId,
      'Bienvenue sur Ticketaf! 🎉',
      body,
      { type: 'info', screen: 'home' }
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendDayJNotifications() {
  try {
    const Voyage = require('../models/voyage.model');
    const Reservation = require('../models/reservation.model');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const voyagesForToday = await Voyage.find({
      date: { $gte: today, $lt: tomorrow },
      notificationDayJSent: false,
      status: { $in: ['OPEN', 'FULL'] }
    }).populate('driver');

    for (const voyage of voyagesForToday) {
      const reservations = await Reservation.find({ voyage: voyage._id, status: 'confirmé', ticket: 'place' }).populate('user');
      const departureTime = new Date(voyage.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      for (const reservation of reservations) {
        if (reservation.user) {
          await sendAndSaveNotification(
            reservation.user._id,
            'Votre voyage est aujourd\'hui',
            `${voyage.from} → ${voyage.to} à ${departureTime}`,
            { type: 'TRIP_DAY_J', voyageId: voyage._id.toString(), screen: 'voyages' }
          );
        }
      }
      voyage.notificationDayJSent = true;
      await voyage.save();
    }
    return { processed: voyagesForToday.length };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  sendNotification,
  sendAndSaveNotification,
  cleanupInvalidTokens,
  sendDayJNotifications,
  sendWelcomeNotification
};