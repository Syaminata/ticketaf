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

/**
 * @swagger
 * /stats/top-drivers:
 *   get:
 *     summary: Récupérer les meilleurs chauffeurs par nombre de voyages
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des meilleurs chauffeurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   totalVoyages:
 *                     type: number
 *                   status:
 *                     type: string
 */
router.get('/top-drivers', auth, adminAuth, statsController.getTopDrivers);

/**
 * @swagger
 * /stats/top-clients:
 *   get:
 *     summary: Récupérer les meilleurs clients par nombre de colis envoyés
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des meilleurs clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   totalColis:
 *                     type: number
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 */
router.get('/top-clients', auth, adminAuth, statsController.getTopClients);

module.exports = router;
