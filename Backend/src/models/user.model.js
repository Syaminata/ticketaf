const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { type } = require('os');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    unique: true, 
    sparse: true, // Permet plusieurs documents avec email null
  },
  password: { type: String, required: true, },
  numero:{type: String, required: true, unique: true, match: [/^(77|78|76|70|75|33|71)\d{7}$/, 'Le numéro doit contenir exactement 9 chiffres']},
  role: { 
    type: String, 
    enum: ['client', 'admin', 'conducteur', 'superadmin'], 
    default: 'client' 
  },
}, { timestamps: true });

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


module.exports = mongoose.model('User', userSchema);
