const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  body: String,
  type: String,
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
