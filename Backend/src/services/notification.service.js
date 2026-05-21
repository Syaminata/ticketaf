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
  if (!title && !body) return { success: true, saved: false, info: 'empty title and body' };
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

    // Fusionner les tokens des deux collections pour le même _id
    // (les chauffeurs ont une entrée dans User ET Driver avec le même _id)
    // Fusionner les tokens des deux collections pour le même _id
    const tokenMap = new Map();
    [...users, ...drivers].forEach(u => {
      const id = u._id.toString();
      const userTokens = u.fcmTokens || [];

      if (!tokenMap.has(id)) {
        // Initialiser avec des tokens uniques
        const uniqueTokens = [];
        const seen = new Set();
        for (const t of userTokens) {
          if (t.token && !seen.has(t.token)) {
            uniqueTokens.push(t);
            seen.add(t.token);
          }
        }
        tokenMap.set(id, { _id: u._id, fcmTokens: uniqueTokens });
      } else {
        // Ajouter les nouveaux tokens uniques de la deuxième collection
        const existing = tokenMap.get(id);
        const knownTokens = new Set(existing.fcmTokens.map(t => t.token));
        for (const t of userTokens) {
          if (t.token && !knownTokens.has(t.token)) {
            existing.fcmTokens.push(t);
            knownTokens.add(t.token);
          }
        }
      }
    });
    const uniqueRecipients = [...tokenMap.values()];

    const messages = [];
    uniqueRecipients.forEach(u => {
      if (!u.fcmTokens || u.fcmTokens.length === 0) return;
      const notificationId = notifIdByUser[u._id.toString()] || '';

      // Version "propre" pour l'affichage système (sans les **)
      const cleanTitle = title.replace(/\*\*/g, '');
      const cleanBody = body.replace(/\*\*/g, '');

      const fcmData = stringifyDataValues({
        title, // On garde les ** dans la data pour que l'app puisse les traiter
        body,
        notificationId,
        type: uiType,
        screen: 'notifications',
        ...data,
      });
      u.fcmTokens.forEach(t => {
        const msg = {
          token: t.token,
          data: fcmData,
          android: { priority: 'high' },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                contentAvailable: true,
                alert: { title: cleanTitle, body: cleanBody }
              }
            }
          },
          // Alerte Android pour un affichage système propre
          notification: {
            title: cleanTitle,
            body: cleanBody
          }
        };
        messages.push(msg);
      });
    });

    if (messages.length === 0) {
      return { success: true, saved: saveToDb };
    }

    if (!admin.isAvailable) {
      console.warn(`⚠️ [FCM] Firebase non configuré — ${messages.length} push ignoré(s). Définir FIREBASE_SERVICE_ACCOUNT_JSON dans .env`);
      return { success: true, saved: saveToDb, info: 'Firebase non configuré' };
    }

    if (admin && admin.messaging) {
      const invalidTokens = [];
      const BATCH = 500;
      for (let i = 0; i < messages.length; i += BATCH) {
        const chunk = messages.slice(i, i + BATCH);
        const response = await admin.messaging().sendEach(chunk);
        response.responses.forEach((r, j) => {
          if (!r.success) {
            const code = r.error?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/invalid-argument'
            ) {
              invalidTokens.push(chunk[j].token);
            }
          }
        });
      }
      if (invalidTokens.length > 0) {
        cleanupInvalidTokens(invalidTokens).catch(() => {});
      }

      return { success: true, saved: saveToDb };
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

    const isDriver = user.role === 'conducteur' || user.role === 'entreprise';
    const body = isDriver
      ? `Bonjour, Bienvenu sur Ticketaf ! Planifiez vos voyages et prenez des clients.`
      : `Bonjour, Bienvenu sur Ticketaf ! Réservez votre trajet ou envoyez un colis facilement.`;

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
    const Bus = require('../models/bus.model');
    const Reservation = require('../models/reservation.model');

    const now = new Date();
    // Définir la fin de la journée actuelle (23:59:59) pour couvrir tous les voyages du jour
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    let processedCount = 0;

    // --- 1. TRAITEMENT DES VOYAGES (COVOITURAGE) ---
    const voyagesSoon = await Voyage.find({
      date: { $gte: now, $lte: endOfDay },
      notificationDayJSent: { $ne: true },
      status: { $in: ['OPEN', 'FULL', 'CREATED'] }
    }).populate('driver');

    for (const voyage of voyagesSoon) {
      const reservations = await Reservation.find({ voyage: voyage._id, status: 'confirmé', ticket: 'place' }).populate('user');
      const departureTime = new Date(voyage.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      // Notifier chaque client confirmé
      for (const reservation of reservations) {
        if (reservation.user) {
          await sendAndSaveNotification(
            reservation.user._id,
            'Rappel de voyage : C\'est AUJOURD\'HUI !',
            `Préparez-vous ! Votre voyage **${voyage.from}** → **${voyage.to}** est prévu aujourd'hui à **${departureTime}**. Bonne route !`,
            { type: 'TRIP_REMINDER', voyageId: voyage._id.toString(), screen: 'voyages' }
          );
        }
      }

      // Notifier le chauffeur
      if (voyage.driver) {
        const passengerCount = reservations.filter(r => r.user).length;
        await sendAndSaveNotification(
          voyage.driver._id,
          'Rappel : Vos trajets du jour',
          `Bonjour ! Votre trajet **${voyage.from}** → **${voyage.to}** est prévu aujourd'hui à **${departureTime}**. Vous avez **${passengerCount}** passager(s) confirmé(s).`,
          { type: 'TRIP_REMINDER', voyageId: voyage._id.toString(), screen: 'voyages' }
        );
      }

      voyage.notificationDayJSent = true;
      await voyage.save();
      processedCount++;
    }

    // --- 2. TRAITEMENT DES BUS (ENTREPRISE) ---
    const busesSoon = await Bus.find({
      departureDate: { $gte: now, $lte: endOfDay },
      isActive: true,
      notificationDayJSent: { $ne: true }
    }).populate('owner');

    for (const bus of busesSoon) {
      const reservations = await Reservation.find({ bus: bus._id, status: 'confirmé', ticket: 'place' }).populate('user');
      const departureTime = new Date(bus.departureDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      // Notifier chaque client confirmé
      for (const reservation of reservations) {
        if (reservation.user) {
          await sendAndSaveNotification(
            reservation.user._id,
            'Rappel de voyage : C\'est AUJOURD\'HUI !',
            `Votre bus **${bus.name}** (**${bus.from}** → **${bus.to}**) part aujourd'hui à **${departureTime}**.`,
            { type: 'TRIP_REMINDER', busId: bus._id.toString(), screen: 'tickets' }
          );
        }
      }

      // Notifier l'entreprise/propriétaire
      if (bus.owner) {
        const passengerCount = reservations.filter(r => r.user).length;
        await sendAndSaveNotification(
          bus.owner._id,
          'Rappel : Départ de bus AUJOURD\'HUI',
          `Le bus **${bus.name}** (**${bus.from}** → **${bus.to}**) part aujourd'hui à **${departureTime}** avec **${passengerCount}** passager(s).`,
          { type: 'TRIP_REMINDER', busId: bus._id.toString(), screen: 'buses' }
        );
      }
      bus.notificationDayJSent = true;
      await bus.save();
      processedCount++;
    }

    return { processed: processedCount };
  } catch (error) {
    console.error('Erreur sendDayJNotifications:', error);
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