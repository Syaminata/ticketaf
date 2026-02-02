const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  senderRole: { 
    type: String, 
    enum: ['admin'], 
    default: 'admin' 
  },
  target: {
    type: {
      type: String,
      enum: ['all', 'role', 'user'],
      required: true
    },
    value: { 
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
