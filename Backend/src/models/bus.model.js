const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name: { type: String, required: true },
  plateNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  availableSeats: { type: Number, required: true }, 
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureDate: { type: Date, required: true }, 
  price: { type: Number, required: true } ,
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

busSchema.pre('save', function(next) {
  if (this.isNew && this.availableSeats === undefined) {
    this.availableSeats = this.capacity;
  }
  next();
});

module.exports = mongoose.model('Bus', busSchema);
