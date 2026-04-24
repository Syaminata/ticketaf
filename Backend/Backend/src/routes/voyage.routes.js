const express = require('express');
const router = express.Router();
const voyageController = require('../controllers/voyage.controller');
const { auth, adminAuth, isDriver, isDriverOrAdmin } = require('../middleware/auth');

// ================
// Routes publiques
// ================

router.get('/', voyageController.getAllVoyage);
router.get('/all/including-expired', voyageController.getAllVoyageIncludingExpired);
router.get('/search', voyageController.searchVoyages);

// ========================
// Routes Chauffeur (avant /:id pour éviter conflit de matching)
// ========================

router.get('/me', auth, isDriver, voyageController.getMyVoyages);
router.post('/driver', auth, isDriver, voyageController.createVoyageByDriver);
router.put('/my-voyages/:id', auth, isDriver, voyageController.updateMyVoyage);

// ========================
// Routes Admin (avant /:id pour éviter conflit de matching)
// ========================

router.get('/admin/all', auth, adminAuth, voyageController.getAllVoyageIncludingExpired);
router.delete('/admin/:id', auth, adminAuth, voyageController.deleteVoyage);
router.post('/', auth, adminAuth, voyageController.createVoyage);
router.put('/:id', auth, adminAuth, voyageController.updateVoyage);
router.delete('/:id', auth, isDriverOrAdmin, voyageController.deleteVoyage);

// ========================
// Route publique avec paramètre (en dernier)
// ========================

router.get('/:id', voyageController.getVoyageById);

module.exports = router;
