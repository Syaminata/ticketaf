const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, statsController.getStats);
router.get('/revenue', auth, adminAuth, statsController.getRevenue);

module.exports = router;
