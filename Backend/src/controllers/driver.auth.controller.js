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

    // 5. Créer le token JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        role: 'conducteur',
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 🔹 6. Créer ou récupérer l'utilisateur Firebase
    const uid = user._id.toString();
    let firebaseUser;
    
    try {
      // Vérifier si l'utilisateur existe déjà
      firebaseUser = await admin.auth().getUser(uid);
      console.log(`✅ Utilisateur Firebase existant (driver): ${uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Créer l'utilisateur s'il n'existe pas
        firebaseUser = await admin.auth().createUser({
          uid: uid,
          email: user.email,
          displayName: user.name,
          // phoneNumber: user.numero ? `+${user.numero}` : undefined, // Décommente si format E.164
        });
        console.log(`✅ Nouvel utilisateur Firebase créé (driver): ${uid}`);
      } else {
        throw error;
      }
    }

    // 🔹 7. Création du Custom Token Firebase
    const firebaseToken = await admin.auth().createCustomToken(uid);

    // 8. Préparer la réponse
    const response = {
      message: isActive ? 'Connexion réussie' : 'Connexion réussie - Compte en attente de validation',
      token,
      firebaseToken, // 🔹 Ajout du token Firebase
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

    // 9. Envoyer la réponse
    res.json(response);

  } catch (err) {
    console.error('❌ Erreur lors de la connexion driver:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { loginDriver };