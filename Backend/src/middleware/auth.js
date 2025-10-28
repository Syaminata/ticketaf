const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token d\'accès requis' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_change_in_production';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token invalide' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Erreur auth middleware:', err.message);
    // Ne pas logger les erreurs JWT normales (tokens expirés/invalides)
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Middleware pour vérifier les rôles admin et superadmin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle admin ou superadmin requis.' });
  }
  next();
};

// Middleware pour vérifier le rôle superadmin uniquement
const superAdminAuth = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle superadmin requis.' });
  }
  next();
};

module.exports = { auth, adminAuth, superAdminAuth };
