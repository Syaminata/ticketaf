const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  target: { type: String, required: true }, // "Tous", "Clients", "Chauffeurs", "Utilisateur X"
  type: { type: String, default: 'ADMIN_MESSAGE' },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin qui a envoyé
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);