const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const villeController = require('../controllers/ville.controller');

// Validation des données
const validateVille = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de la ville doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
    .withMessage('Le nom de la ville ne doit contenir que des lettres, des espaces et des tirets'),
];

// Routes publiques
router.get('/', villeController.getAllVilles);
router.get('/:id', villeController.getVilleById);

// Routes protégées (admin uniquement)
router.post('/', 
  auth, 
  admin,
  validateVille,
  villeController.createVille
);

router.put('/:id', 
  auth, 
  admin,
  validateVille,
  villeController.updateVille
);

router.delete('/:id', 
  auth, 
  admin,
  villeController.deleteVille
);

router.patch('/:id/toggle-status', 
  auth, 
  admin,
  villeController.toggleVilleStatus
);

module.exports = router;
