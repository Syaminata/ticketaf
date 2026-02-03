const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  title: String,
  body: String,

  // qui reçoit
  target: String,

  // type visuel
  type: { type: String, default: 'info' },

  //  navigation mobile
  targetPage: { type: String, default: 'notifications' },
  targetId: { type: String },

  sentCount: Number,
  failedCount: Number,
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: Date,
});


module.exports = mongoose.model('NotificationLog', notificationLogSchema);