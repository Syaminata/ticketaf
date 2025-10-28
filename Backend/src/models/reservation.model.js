const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  voyage: { type: mongoose.Schema.Types.ObjectId, ref: 'Voyage' },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticket: { type: String, enum: ['place', 'colis'], default: 'place' },
  quantity: { type: Number, default: 1 }
}, { timestamps: true });

reservationSchema.pre('validate', function(next) {
  if (!this.voyage && !this.bus) {
    return next(new Error('Au moins un voyage ou un bus doit être spécifié'));
  }
  if (this.voyage && this.bus) {
    return next(new Error('Uniquement un voyage OU un bus peut être spécifié, pas les deux'));
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
