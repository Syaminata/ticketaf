const Notification = require('../models/notifications.model');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const createNotification = async (req, res) => {
  try {
    const { userId, message } = req.body;

    // Validation des entrées
    if (!userId || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId et message sont requis' 
      });
    }

    // Envoyer le message WhatsApp
    const response = await sendWhatsAppMessage('221774862972', message);
    const messageId = response?.messages?.[0]?.id || null;

    // Enregistrer la notification
    const notification = await Notification.create({
      userId,
      message,
      messageId,
      status: messageId ? 'envoyé' : 'échoué',
      sentAt: messageId ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Notification créée et envoyée sur WhatsApp',
      data: notification,
    });
  } catch (error) {
    console.error('Erreur création notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la notification',
      error: error.message 
    });
  }
};

module.exports = { createNotification };