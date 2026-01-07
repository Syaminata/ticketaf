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
 * /stats/top-reservations-clients:
 *   get:
 *     summary: Récupérer les 5 clients avec le plus de réservations de voyage
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des meilleurs clients voyageurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   reservationCount:
 *                     type: number
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 */
router.get('/top-reservations-clients', auth, adminAuth, statsController.getTopReservationsClients);

/**
 * @swagger
 * /stats/top-colis-destinations:
 *   get:
 *     summary: Récupérer les 5 destinations les plus populaires pour les colis
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des destinations les plus populaires pour les colis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   destination:
 *                     type: string
 *                     description: Nom de la destination
 *                   colisCount:
 *                     type: number
 *                     description: Nombre de colis à destination de cette ville
 */
router.get('/top-colis-destinations', auth, adminAuth, statsController.getTopColisDestinations);

/**
 * @swagger
 * /stats/top-clients:
 *   get:
 *     summary: Récupérer les 5 clients avec le plus de colis envoyés
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des meilleurs clients expéditeurs de colis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   totalColis:
 *                     type: number
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 */
router.get('/top-clients', auth, adminAuth, statsController.getTopClients);

module.exports = router;
