const express = require('express');
const router = express.Router();
const { sendNotification, sendAndSaveNotification, cleanupInvalidTokens, sendDayJNotifications } = require('../services/notification.service');
const User = require('../models/user.model');
const NotificationLog = require('../models/notifications.model');
const { auth, adminAuth } = require('../middleware/auth');
const UserNotification = require('../models/userNotification.model');

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Envoyer une notification FCM
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *               - title
 *               - body
 *             properties:
 *               target:
 *                 type: string
 *                 enum: [all, clients, drivers, specific]
 *                 description: Cible des destinataires
 *               userId:
 *                 type: string
 *                 description: ID de l'utilisateur cible (requis si target=specific)
 *               title:
 *                 type: string
 *                 description: Titre de la notification
 *               body:
 *                 type: string
 *                 description: Contenu de la notification
 *               type:
 *                 type: string
 *                 description: Type de notification (optionnel, défaut ADMIN_MESSAGE)
 *                 default: ADMIN_MESSAGE
 *     responses:
 *       200:
 *         description: Notification envoyée avec succès
 */
router.post('/send', auth, adminAuth, async (req, res) => {
  try {
    const { target, userId, title, body, type } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Titre et message requis' });
    }

    let tokens = [];
    let usersCibles = [];
    let targetDescription = 'Tous';
    let sentCount = 0;
    let failedCount = 0;

    switch (target) {
      case 'all': {
        const allUsers = await User.find({ 'fcmTokens.0': { $exists: true } });
        allUsers.forEach(user => {
          usersCibles.push(user);
          user.fcmTokens.forEach(t => tokens.push(t.token));
        });
        tokens = [...new Set(tokens)];
        break;
      }

      case 'clients': {
        const clients = await User.find({
          role: 'client',
          'fcmTokens.0': { $exists: true }
        });
        clients.forEach(user => {
          usersCibles.push(user);
          user.fcmTokens.forEach(t => tokens.push(t.token));
        });
        tokens = [...new Set(tokens)];
        targetDescription = 'Clients';
        break;
      }

      case 'drivers': {
        const drivers = await User.find({
          role: 'conducteur',
          'fcmTokens.0': { $exists: true }
        });
        drivers.forEach(user => {
          usersCibles.push(user);
          user.fcmTokens.forEach(t => tokens.push(t.token));
        });
        tokens = [...new Set(tokens)];
        targetDescription = 'Chauffeurs';
        break;
      }

      case 'specific': {
        if (!userId) {
          return res.status(400).json({ message: 'ID utilisateur requis' });
        }
        const user = await User.findById(userId);
        if (user && user.fcmTokens.length > 0) {
          usersCibles.push(user);
          user.fcmTokens.forEach(t => tokens.push(t.token));
          tokens = [...new Set(tokens)];
          targetDescription = `Utilisateur ${user.name}`;
        }
        break;
      }

      default:
        return res.status(400).json({ message: 'Cible non valide' });
    }

    if (!usersCibles.length) {
      return res.status(404).json({ message: 'Aucun destinataire trouvé' });
    }

    // Utilise sendAndSaveNotification pour :
    // - créer un UserNotification par utilisateur avec son propre _id
    // - émettre via Socket.IO
    // - envoyer le push FCM avec les données correctement stringify et le bon notificationId
    try {
      const userIds = usersCibles.map(u => u._id);
      const result = await sendAndSaveNotification(
        userIds,
        title,
        body,
        { type: type || 'ADMIN_MESSAGE', screen: 'notifications' }
      );
      sentCount = result.saved ? userIds.length : 0;
    } catch (error) {
      failedCount = usersCibles.length;
      console.error('Erreur envoi notification admin:', error);
    }

    const log = await NotificationLog.create({
      title,
      body,
      target: targetDescription,
      type: type || 'ADMIN_MESSAGE',
      sentCount,
      failedCount,
      sentBy: req.user._id
    });

    res.json({
      message: 'Notification envoyée avec succès',
      sent: sentCount,
      failed: failedCount,
      total: usersCibles.length,
      logId: log._id
    });

  } catch (error) {
    console.error('Erreur notification send:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/history', auth, adminAuth, async (req, res) => {
  try {
    const logs = await NotificationLog.find()
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ logs });
  } catch (error) {
    console.error('Erreur notification history:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const stats = await NotificationLog.aggregate([
      {
        $group: {
          _id: null,
          totalSent: { $sum: '$sentCount' },
          totalFailed: { $sum: '$failedCount' },
          totalNotifications: { $sum: 1 }
        }
      }
    ]);

    const recentLogs = await NotificationLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title target sentCount failedCount createdAt');

    res.json({
      stats: stats[0] || { totalSent: 0, totalFailed: 0, totalNotifications: 0 },
      recent: recentLogs
    });
  } catch (error) {
    console.error('Erreur notification stats:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /notifications/my:
 *   get:
 *     summary: Récupérer TOUTES les notifications de l'utilisateur (historique complet)
 *     tags: [Notifications]
 */
router.get('/my', auth, async (req, res) => {
  try {
    // Suppression de la limite des 24h pour permettre à l'utilisateur de retrouver TOUT son historique
    const notifs = await UserNotification.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/my/unread', auth, async (req, res) => {
  try {
    const notifs = await UserNotification.find({
      user: req.user._id,
      read: false
    }).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/my/unread-count', auth, async (req, res) => {
  try {
    const count = await UserNotification.countDocuments({
      user: req.user._id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de notification invalide' });
    }

    const notif = await UserNotification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notif) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID de notification invalide' });
    }

    const notif = await UserNotification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notif) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    if (!notif.read) {
      notif.read = true;
      notif.readAt = new Date();
      await notif.save();
    }

    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/dayj/send', auth, adminAuth, async (req, res) => {
  try {
    const result = await sendDayJNotifications();
    res.json({
      message: 'Notifications du jour J traitées avec succès',
      processed: result.processed
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du traitement des notifications du jour J',
      error: error.message
    });
  }
});

module.exports = router;
