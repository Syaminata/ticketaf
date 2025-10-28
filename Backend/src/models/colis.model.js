const mongoose = require('mongoose');
const Reservation = require('./reservation.model');

const colisSchema = new mongoose.Schema({
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['en attente', 'confirmé', 'annulé'], 
    default: 'en attente' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Colis', colisSchema);
