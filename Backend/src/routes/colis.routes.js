const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { uploadColisImage } = require('../middleware/upload');
const colisController = require('../controllers/colis.controller');

// Créer un nouveau colis avec upload d'image
router.post('/', 
  auth, 
  uploadColisImage, 
  colisController.createColis
);

// Mettre à jour un colis avec upload d'image optionnel
router.put('/:id', 
  auth, 
  uploadColisImage, 
  colisController.updateColis
);

router.get('/', auth, colisController.getAllColis);
router.get('/user/me', auth, colisController.getUserColis);
router.get('/:id', auth, colisController.getColisById);
router.delete('/:id', auth, colisController.deleteColis);
router.get('/track/:trackingNumber', colisController.trackColis);
router.get('/stats/colis', auth, colisController.getColisStats);

module.exports = router;