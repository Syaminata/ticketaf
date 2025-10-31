const express = require('express');
const router = express.Router();
const axios = require('axios');
const Notification = require('../models/notifications.model');
const User = require('../models/user.model');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

router.post('/send', async (req, res) => {
  try {
    const { userId, message } = req.body;

    // Vérifier que l'utilisateur existe et est un client
    const user = await User.findById(userId);
    if (!user || user.role !== 'client') {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    // Créer la notification en base
    const notification = await Notification.create({
      userId: user._id,
      message,
      status: 'envoyé',
    });

    // Appel API WhatsApp
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: user.numero,
        type: 'text',
        text: { body: message }
      },
      {
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }
      }
    );

    // Mise à jour notification
    notification.messageId = response.data.messages[0].id;
    notification.status = 'envoyé';
    notification.sentAt = new Date();
    await notification.save();

    res.json({ message: 'Notification envoyée avec succès', notification });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: 'Erreur lors de l’envoi', error: error.message });
  }
});

module.exports = router;
