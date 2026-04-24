const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({

  // Lien vers l'utilisateur
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Numéro de téléphone concerné
  numero: {
    type: String,
    required: true
  },

  // OTP hashé 
  otpHash: {
    type: String,
    required: true
  },

  // Objectif de l'OTP
  purpose: {
    type: String,
    enum: ['reset_password', 'login', 'verify_phone'],
    default: 'reset_password'
  },

  resetToken: {
    type: String,
    default: null
  },

  // Date d'expiration
  expiresAt: {
    type: Date,
    required: true
  },

  // Nombre de tentatives
  attempts: {
    type: Number,
    default: 0
  },

  // OTP déjà utilisé ?
  used: {
    type: Boolean,
    default: false
  },

  // Blocage temporaire
  blockedUntil: {
    type: Date,
    default: null
  }

}, { timestamps: true });

// Index pour suppression automatique après expiration (TTL)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);