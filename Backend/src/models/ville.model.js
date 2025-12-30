const mongoose = require('mongoose');

const villeSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour des recherches plus rapides
villeSchema.index({ nom: 1 }, { unique: true });

// Middleware pour s'assurer que le nom est en majuscules
villeSchema.pre('save', function(next) {
  this.nom = this.nom
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  next();
});

const Ville = mongoose.model('Ville', villeSchema);

module.exports = Ville;
