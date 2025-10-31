const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  message: { type: String, required: true },                                     
  messageId: { type: String },  // ID renvoyé par WhatsApp
  status: { 
    type: String, 
    enum: ['envoyé', 'reçu', 'lu', 'echoué'], 
    default: 'envoyé' 
  },
  sentAt: { type: Date },  // date d'envoi
  updatedAt: { type: Date, default: Date.now }  // date de dernière mise à jour
});

module.exports = mongoose.model('Notification', notificationSchema);
