const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  targetAudience: {
    type: String,
    enum: ['all', 'client', 'conducteur'],
    default: 'all',
  },
}, { timestamps: true });

module.exports = mongoose.model('Faq', faqSchema);
