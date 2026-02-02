const express = require('express');
const router = express.Router();
const { sendNotification } = require('../services/notification.service');
const User = require('../models/user.model');
const NotificationLog = require('../models/notifications.model');
const { auth, adminAuth } = require('../middleware/auth');

// Envoyer une notification admin
router.post('/send', adminAuth, async (req, res) => {
  try {
    const { target, userId, title, body, type } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ message: 'Titre et message requis' });
    }

    let tokens = [];
    let targetDescription = 'Tous';
    let sentCount = 0;
    let failedCount = 0;

    // Déterminer les destinataires
    switch (target) {
      case 'all':
        const allUsers = await User.find({'fcmTokens.0': {$exists: true}});
        allUsers.forEach(user => {
          user.fcmTokens.forEach(fcmToken => {
            tokens.push(fcmToken.token);
          });
        });
        break;
        
      case 'clients':
        const clients = await User.find({role: 'client', 'fcmTokens.0': {$exists: true}});
        clients.forEach(user => {
          user.fcmTokens.forEach(fcmToken => {
            tokens.push(fcmToken.token);
          });
        });
        targetDescription = 'Clients';
        break;
        
      case 'drivers':
        const drivers = await User.find({role: 'conducteur', 'fcmTokens.0': {$exists: true}});
        drivers.forEach(user => {
          user.fcmTokens.forEach(fcmToken => {
            tokens.push(fcmToken.token);
          });
        });
        targetDescription = 'Chauffeurs';
        break;
        
      case 'specific':
        if (!userId) {
          return res.status(400).json({ message: 'ID utilisateur requis pour une notification spécifique' });
        }
        const specificUser = await User.findById(userId);
        if (specificUser && specificUser.fcmTokens) {
          specificUser.fcmTokens.forEach(fcmToken => {
            tokens.push(fcmToken.token);
          });
          targetDescription = `Utilisateur ${specificUser.name}`;
        }
        break;
        
      default:
        return res.status(400).json({ message: 'Cible non valide' });
    }

    if (tokens.length === 0) {
      return res.status(404).json({ message: 'Aucun token FCM trouvé pour cette cible' });
    }

    // Envoyer la notification
    try {
      await sendNotification(tokens, title, body, {
        type: type || 'ADMIN_MESSAGE',
        target: targetDescription
      });
      sentCount = tokens.length;
    } catch (error) {
      failedCount = tokens.length;
      console.error('Erreur envoi notification:', error);
    }

    // Logger la notification
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
      message: 'Notification traitée',
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

// Historique des notifications
router.get('/history', adminAuth, async (req, res) => {
  try {
    const logs = await NotificationLog.find()
      .populate('sentBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ logs });
  } catch (error) {
    console.error('Erreur notification history:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Statistiques des notifications
router.get('/stats', adminAuth, async (req, res) => {
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

module.exports = router;
