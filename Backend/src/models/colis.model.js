const mongoose = require('mongoose');
const Reservation = require('./reservation.model');

const colisSchema = new mongoose.Schema({
  // Rendre voyage optionnel au lieu de requis
  voyage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Voyage', 
    required: false 
  },
  reservation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reservation',
    required: false 
  },
  expediteur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  destination: {
    type: String,
    required: function() {
      // Required si voyage n'est pas défini
      return !this.voyage;
    }
  },
  dateEnvoi: {
    type: Date,
    required: function() {
      // Required si voyage n'est pas défini
      return !this.voyage;
    }
  },
  villeDepart: {
    type: String,
    required: function() {
      // Required si voyage n'est pas défini
      return !this.voyage;
    }
  },
  destinataire: {
    nom: { type: String, required: true },
    telephone: { type: String, required: true },
    adresse: { type: String, required: false }
  },
  description: { type: String, required: false },
  imageUrl: { 
    type: String, 
    required: false,
    default: null
  },
  status: { 
    type: String, 
    enum: ['en attente', 'enregistré','envoyé', 'reçu', 'annulé'], 
    default: 'en attente' 
  },
  prix: {
    type: Number,
    default: null,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Colis', colisSchema);