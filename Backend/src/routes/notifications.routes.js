const express = require('express');
const router = express.Router();
const { sendNotification, cleanupInvalidTokens } = require('../services/notification.service');
const User = require('../models/user.model');
const NotificationLog = require('../models/notifications.model');
const { auth, adminAuth } = require('../middleware/auth');
const UserNotification = require('../models/userNotification.model');


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
        // Dédupliquer les tokens
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
        // Dédupliquer les tokens
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
        // Dédupliquer les tokens
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
          // Dédupliquer les tokens
          tokens = [...new Set(tokens)];
          targetDescription = `Utilisateur ${user.name}`;
        }
        break;
      }

      default:
        return res.status(400).json({ message: 'Cible non valide' });
    }

    if (!tokens.length || !usersCibles.length) {
      return res.status(404).json({ message: 'Aucun destinataire trouvé' });
    }

    // 1 Créer les notifications utilisateur
    const UserNotification = require('../models/userNotification.model');

    const createdNotifications = await Promise.all(
      usersCibles.map(user =>
        UserNotification.create({
          user: user._id,
          title,
          body,
          type: type || 'ADMIN_MESSAGE'
        })
      )
    );

    // 2 Envoyer FCM avec navigation
    try {
      const result = await sendNotification(tokens, title, body, {
        type: type || 'ADMIN_MESSAGE',
        screen: 'notifications',
        notificationId: createdNotifications[0]._id.toString()
      });
      sentCount = result.successCount;
      
      // Nettoyer les tokens invalides
      if (result.invalidTokens && result.invalidTokens.length > 0) {
        await cleanupInvalidTokens(result.invalidTokens);
      }
    } catch (error) {
      failedCount = tokens.length;
      console.error('Erreur envoi notification:', error);
    }

    // 3 Log admin
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
      total: tokens.length,
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

router.get('/my', auth, async (req, res) => {
  const notifs = await UserNotification.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json(notifs);
});

module.exports = router;
