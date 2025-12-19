const Driver = require('../models/driver.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const loginDriver = async (req, res) => {
  try {
    const { email, numero, password } = req.body;

    // Vérification des champs obligatoires
    if ((!email && !numero) || !password) {
      return res.status(400).json({ 
        message: 'Email/numéro et mot de passe sont requis',
        required: {
          emailOrNumber: !email && !numero,
          password: !password
        }
      });
    }

    // Construction de la requête
    const query = {};
    if (email) query.email = email;
    if (numero) query.numero = numero;

    // 1. D'abord chercher dans la collection Driver
    const driver = await Driver.findOne(query);
    if (!driver) {
      return res.status(404).json({ 
        message: 'Aucun compte conducteur trouvé avec ces identifiants' 
      });
    }

    // 2. Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Mot de passe incorrect' 
      });
    }

    // 3. Vérifier le statut du compte
    if (!driver.isActive) {
      return res.status(403).json({ 
        message: 'Votre compte est en attente de validation par un administrateur',
        isActive: false
      });
    }

    // 4. Création du token JWT
    const token = jwt.sign(
      { 
        id: driver._id, 
        role: 'conducteur',
        name: driver.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Réponse réussie
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        numero: driver.numero,
        role: 'conducteur',
        driver: {
          isActive: driver.isActive,
          matricule: driver.matricule,
          marque: driver.marque,
          capacity: driver.capacity
        }
      }
    });

  } catch (err) {
    console.error('Erreur lors de la connexion du conducteur:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion',
      error: err.message 
    });
  }
};

module.exports = { loginDriver };