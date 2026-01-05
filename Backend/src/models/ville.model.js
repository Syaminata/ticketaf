const mongoose = require('mongoose');

const villeSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    set: function(v) {
      return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    }
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

// Middleware pour s'assurer que le nom est enregistré avec la première lettre en majuscule
villeSchema.pre('save', function(next) {
  if (this.isModified('nom')) {
    this.nom = this.nom.charAt(0).toUpperCase() + this.nom.slice(1).toLowerCase();
  }
  next();
});

const Ville = mongoose.model('Ville', villeSchema);

module.exports = Ville;
