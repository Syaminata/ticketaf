const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// === Inscription ===
const register = async (req, res) => {
  try {
    const { name, email, numero, password, role } = req.body;

    if (!name || !numero || !password) {
      return res.status(400).json({ message: 'Le nom, numéro et mot de passe sont requis' });
    }

    // Vérifie si l'email existe déjà (seulement si email fourni)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }
    }

    // Création directe, le mot de passe sera hashé automatiquement dans le modèle
    const user = await User.create({ name, email: email || undefined, numero, password, role });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: { id: user._id, name: user.name, email: user.email, numero: user.numero, role: user.role }
    });
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// === Connexion ===
const login = async (req, res) => {
  try {
    const { email, numero, password, role } = req.body;

    if ((!email && !numero) || !password || !role) {
      return res.status(400).json({ message: 'Email ou numéro, mot de passe et rôle requis' });
    }

    // Rechercher l'utilisateur par email ou numéro
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ numero });
    }
    
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    // Vérifie que le rôle choisi correspond au rôle réel
    console.log("Role choisi:", role, "Role réel:", user.role);
    if (user.role !== role) {
      return res.status(403).json({ message: `Accès refusé. Vous n'êtes pas enregistré en tant que ${role}` });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: { id: user._id, name: user.name, email: user.email, numero: user.numero, role: user.role }
    });

  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


module.exports = { register, login };
