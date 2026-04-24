const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'ticketaf_secret_key_2024_local_dev';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token d\'accès requis' });

    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user = await User.findById(decoded.id).select('-password');
    if (!user) {
      user = await Driver.findById(decoded.id).select('-password');
      if (user) {
        user = user.toObject();
        user.role = 'conducteur';
      }
    }
    
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });
    req.user = user;
    next();
  } catch (err) {
    console.error('Erreur auth middleware:', err.message);
    res.status(401).json({ message: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token d\'accès requis' });

    const decoded = jwt.verify(token, JWT_SECRET);

    let user = await User.findById(decoded.id).select('-password');
    if (!user) {
      user = await Driver.findById(decoded.id).select('-password');
      if (user) {
        user = user.toObject();
        user.role = 'conducteur';
      }
    }

    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });

    const allowedRoles = ['admin', 'superadmin'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Erreur adminAuth middleware:', err.message);
    res.status(401).json({ message: 'Token invalide' });
  }
};

const colisManagementAuth = (req, res, next) => {
  const allowed = ['admin', 'superadmin', 'gestionnaireColis', 'entreprise'];
  if (req.user && allowed.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Accès refusé' });
};

const isDriver = (req, res, next) => {
  if (req.user && req.user.role === 'conducteur') return next();
  return res.status(403).json({ message: 'Accès réservé aux conducteurs' });
};

const isDriverOrAdmin = (req, res, next) => {
  if (req.user && ['conducteur', 'admin', 'superadmin'].includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Accès refusé' });
};

module.exports = { auth, adminAuth, colisManagementAuth, isDriver, isDriverOrAdmin };
