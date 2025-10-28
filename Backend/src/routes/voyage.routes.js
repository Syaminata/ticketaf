const express = require('express');
const router = express.Router();
const voyageController = require('../controllers/voyage.controller');
const { auth, adminAuth } = require('../middleware/auth');

// Routes CRUD pour les voyages
router.post('/', auth, adminAuth, voyageController.createVoyage);
router.get('/', auth, adminAuth, voyageController.getAllVoyage); // Voyages futurs uniquement
router.get('/all/including-expired', auth, adminAuth, voyageController.getAllVoyageIncludingExpired); // Tous les voyages (pour historique)
router.get('/:id', auth, adminAuth, voyageController.getVoyageById);
router.put('/:id', auth, adminAuth, voyageController.updateVoyage);
router.delete('/:id', auth, adminAuth, voyageController.deleteVoyage);

module.exports = router;
