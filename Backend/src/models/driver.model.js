const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { type } = require('os');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    unique: true, 
    sparse: true, // Permet plusieurs documents avec email null
    default: null 
  },
  password: { type: String, required: true },
  numero:{type: String, required: true, unique: true, match: [/^(77|78|76|70|75|33|71)\d{7}$/, 'Le numéro doit contenir exactement 9 chiffres']},
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

  role: { type: String, default: 'conducteur' } 
}, { timestamps: true });

// Hash du mot de passe avant sauvegarde
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Driver', driverSchema);
