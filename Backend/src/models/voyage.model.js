const mongoose = require('mongoose');

const voyageSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  totalSeats: { type: Number, required: true, default: 4 }, // Capacité totale du véhicule
  availableSeats: { type: Number, required: true, default: 4 } // Places disponibles
}, { timestamps: true });

module.exports = mongoose.model('Voyage', voyageSchema);
