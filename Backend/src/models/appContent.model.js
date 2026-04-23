const mongoose = require('mongoose');

const appContentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['privacy_policy', 'terms_conditions', 'about_app', 'contact_info']
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('AppContent', appContentSchema);
