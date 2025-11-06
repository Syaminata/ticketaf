const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Récupérer les statistiques générales
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques générales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                 totalDrivers:
 *                   type: number
 *                 totalVoyages:
 *                   type: number
 *                 totalReservations:
 *                   type: number
 */
router.get('/', auth, adminAuth, statsController.getStats);

/**
 * @swagger
 * /stats/revenue:
 *   get:
 *     summary: Récupérer les statistiques de revenus
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques de revenus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                 monthlyRevenue:
 *                   type: array
 */
router.get('/revenue', auth, adminAuth, statsController.getRevenue);

module.exports = router;
