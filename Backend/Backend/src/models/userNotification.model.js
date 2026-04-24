const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  body: String,
  type: String,
  data: { type: mongoose.Schema.Types.Mixed, default: null },
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
