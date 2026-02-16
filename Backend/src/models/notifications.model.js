const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  title: String,
  body: String,
  target: String,
  type: { type: String, default: 'info' },
  targetPage: { type: String, default: 'notifications' },
  targetId: { type: String },
  sentCount: Number,
  failedCount: Number,
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }); 


module.exports = mongoose.model('NotificationLog', notificationLogSchema);