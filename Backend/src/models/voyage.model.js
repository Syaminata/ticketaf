const mongoose = require('mongoose');
const Reservation = require('./reservation.model');
const Colis = require('./colis.model');

const voyageSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  totalSeats: { type: Number, required: true, default: 5 }, 
  availableSeats: { type: Number, required: true, default: 5 } 
}, { timestamps: true });

voyageSchema.pre('findOneAndDelete', async function (next) {
  try {
    const voyage = await this.model.findOne(this.getQuery());
    if (!voyage) return next();

    // Supprimer les réservations liées à ce voyage
    await Reservation.deleteMany({ voyage: voyage._id });

    // Supprimer les colis liés à ce voyage
    await Colis.deleteMany({ voyage: voyage._id });

    next();
  } catch (err) {
    next(err);
  }
});
module.exports = mongoose.model('Voyage', voyageSchema);
