const mongoose = require('mongoose');

const voyageSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  totalSeats: { type: Number, required: true, default: 5 }, 
  availableSeats: { type: Number, required: true, default: 5 } 
}, { timestamps: true });

module.exports = mongoose.model('Voyage', voyageSchema);
