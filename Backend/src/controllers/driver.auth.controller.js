const User = require('../models/user.model');  
const Driver = require('../models/driver.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');

const loginDriver = async (req, res) => {
  try {
    const { email, numero, password } = req.body;

    // 1. Trouver l'utilisateur d'abord
    const user = await User.findOne({ 
      $or: [
        ...(email ? [{ email }] : []),
        ...(numero ? [{ numero }] : [])
      ],
      role: 'conducteur'
    }).select('+password');

    if (!user) {
      return res.status(404).json({
        message: 'Aucun compte conducteur trouvé avec ces identifiants'
      });
    }

    if (user.pendingDeletion) {
      return res.status(404).json({ message: 'Ce compte n\'existe pas' });
    }

    // 2. Vérifier le mot de passe avec l'utilisateur
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Mot de passe incorrect'
      });
    }

    // 3. Récupérer les infos du conducteur
    const driver = await Driver.findById(user._id) || {};

    // 4. Vérifier si le compte est actif
    const isActive = driver.isActive !== false;

    // 5. Créer le token JWT avec la clé du projet
    const token = jwt.sign(
      {
        id: user._id,
        role: 'conducteur',
        name: user.name
      },
      process.env.JWT_SECRET || 'ticketaf_secret_key_2024_local_dev',
      { expiresIn: '7d' }
    );

    // 🔹 6. Firebase Custom Token
    const uid = user._id.toString();
    let firebaseToken = null;

    if (admin && admin.auth) {
      try {
        firebaseToken = await admin.auth().createCustomToken(uid);
      } catch (firebaseError) {
        console.warn('⚠️ Firebase Auth indisponible:', firebaseError.message);
      }
    }

    // 8. Préparer la réponse
    const response = {
      message: isActive ? 'Connexion réussie' : 'Connexion réussie - Compte en attente de validation',
      token,
      firebaseToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        numero: user.numero,
        role: 'conducteur',
        driver: {
          isActive,
          needsActivation: !isActive,
          matricule: driver.matricule,
          marque: driver.marque,
          capacity: driver.capacity,
        }
      }
    };

    res.json(response);

  } catch (err) {
    console.error('❌ Erreur lors de la connexion driver:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion',
      error: err.message
    });
  }
};

module.exports = { loginDriver };
