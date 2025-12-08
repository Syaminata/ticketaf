const mongoose = require('mongoose');
const Reservation = require('./reservation.model');

const colisSchema = new mongoose.Schema({
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  expediteur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  destinataire: {
    nom: { type: String, required: true },
    telephone: { type: String, required: true }
  },
  description: { type: String, required: false },
  imageUrl: { 
    type: String, 
    required: false,
    default: null
  },
  status: { 
    type: String, 
    enum: ['en attente', 'envoyé', 'reçu', 'annulé'], 
    default: 'en attente' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Colis', colisSchema);
