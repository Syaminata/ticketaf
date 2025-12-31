const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');

// Classe d'erreur personnalisée pour les accès refusés
class ForbiddenError extends Error {
  constructor(message = 'Accès refusé') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
    this.code = 'FORBIDDEN';
  }
}

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token d\'accès requis' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_change_in_production';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Vérifier d'abord dans la table User
    let user = await User.findById(decoded.id).select('-password');
    
    // Si non trouvé, vérifier dans la table Driver
    if (!user) {
      user = await Driver.findById(decoded.id).select('-password');
      if (user) {
        user = user.toObject();
        user.role = 'conducteur'; // Ajouter le rôle conducteur
      }
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Erreur auth middleware:', err.message);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Middleware pour les administrateurs et gestionnaires de colis
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'gestionnaireColis') {
    return res.status(403).json({ message: 'Accès refusé. Rôle admin, superadmin ou gestionnaire de colis requis.' });
  }
  next();
};

// Le middleware superAdminAuth reste inchangé
const superAdminAuth = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle superadmin requis.' });
  }
  next();
};

// Vérifie si l'utilisateur est un conducteur
const isDriver = (req, res, next) => {
  if (req.user && req.user.role === 'conducteur') {
    return next();
  }
  return res.status(403).json({ 
    message: 'Accès réservé aux conducteurs',
    code: 'FORBIDDEN'
  });
};

// Vérifie si l'utilisateur est un client
const isClient = (req, res, next) => {
  if (req.user && req.user.role === 'client') {
    return next();
  }
  return res.status(403).json({ 
    message: 'Accès réservé aux clients',
    code: 'FORBIDDEN'
  });
};

// Vérifie si l'utilisateur est un conducteur ou un administrateur
const isDriverOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'conducteur' || req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  return res.status(403).json({ 
    message: 'Accès réservé aux conducteurs et administrateurs',
    code: 'FORBIDDEN'
  });
};

// Vérifie si l'utilisateur a un des rôles spécifiés
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ 
      message: `Accès refusé. Rôles autorisés: ${roles.join(', ')}`,
      code: 'FORBIDDEN'
    });
  };
};

// Middleware spécifique pour la gestion des colis (admin et gestionnaire de colis)
const colisManagementAuth = (req, res, next) => {
  if (['admin', 'superadmin', 'gestionnaireColis'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ 
    message: 'Accès refusé. Rôle admin, superadmin ou gestionnaire de colis requis.',
    code: 'FORBIDDEN'
  });
};

module.exports = { 
  auth, 
  adminAuth, 
  superAdminAuth, 
  isDriver, 
  isClient, 
  isDriverOrAdmin, 
  hasRole, 
  ForbiddenError,
  colisManagementAuth
};