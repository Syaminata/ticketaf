const mongoose = require('mongoose');

const messageUserSchema = new mongoose.Schema({
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null }
});

module.exports = mongoose.model('MessageUser', messageUserSchema);
