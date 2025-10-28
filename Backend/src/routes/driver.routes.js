const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadDriverFiles } = require('../middleware/upload');

// Routes protégées
router.post('/', auth, adminAuth, uploadDriverFiles, driverController.createDriver);
router.get('/', auth, adminAuth, driverController.getAllDrivers);
router.put('/:id', auth, adminAuth, uploadDriverFiles, driverController.updateDriver);
router.delete('/:id', auth, adminAuth, driverController.deleteDriver);
router.post('/clean-files', auth, adminAuth, driverController.cleanFiles);
router.put('/:id/activate', auth, adminAuth, driverController.activateDriver);
router.put('/:id/deactivate', auth, adminAuth, driverController.deactivateDriver);

module.exports = router;
