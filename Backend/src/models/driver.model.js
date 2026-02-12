const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { type } = require('os');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    unique: true, 
    sparse: true, // Permet plusieurs documents avec email null
  },
  password: { type: String, required: true },
  numero:{type: String, required: true, unique: true, match: [/^(77|78|76|70|75|33|71)\d{7}$/, 'Le numéro doit contenir exactement 9 chiffres']},
  address: { type: String, trim: true },
  matricule: { type: String, required: true, unique: true },
  marque: { type: String, required: true },
  capacity: { type: Number, required: true },
  capacity_coffre: { 
    type: String, 
    enum: ['petit', 'moyen', 'grand'], 
    required: true 
  },
  climatisation: { type: Boolean, default: false }, 
  permis: { 
    required: true,
    type: [
      {
        filename: { type: String, required: true }, 
        originalName: { type: String, required: true }, 
        path: { type: String, required: true }, // Chemin vers le fichier
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
  },
  
  photo: { 
    required: true,
    type: [
      {
        filename: { type: String, required: true }, 
        originalName: { type: String, required: true }, 
        path: { type: String, required: true }, // Chemin vers le fichier
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
  },
  isActive: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  pinnedAt: { type: Date },
  pinnedOrder: { type: Number, default: 0 }, 
  tripCount: { type: Number, default: 0 }, 
  role: { type: String, default: 'conducteur' } 
}, { timestamps: true });

// Middleware pour supprimer les voyages associés avant de supprimer un conducteur
driverSchema.pre('remove', async function(next) {
  try {
    // Supprimer tous les voyages associés à ce conducteur
    await this.model('Voyage').deleteMany({ driver: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

// Hash du mot de passe avant sauvegarde
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Driver', driverSchema);
