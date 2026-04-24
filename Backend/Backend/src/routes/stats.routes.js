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
 *                 utilisateurs:
 *                   type: number
 *                   description: Nombre total d'utilisateurs
 *                 conducteurs:
 *                   type: number
 *                   description: Nombre total de conducteurs
 *                 reservations:
 *                   type: number
 *                   description: Nombre total de réservations
 *                 bus:
 *                   type: number
 *                   description: Nombre total de bus
 *                 voyages:
 *                   type: number
 *                   description: Nombre total de voyages
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
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *         description: Période d'analyse des revenus
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
 *                   description: Revenu total sur la période
 *                 reservationsCount:
 *                   type: number
 *                   description: Nombre de réservations sur la période
 *                 averageRevenue:
 *                   type: number
 *                   description: Revenu moyen par réservation
 *                 dailyRevenue:
 *                   type: array
 *                   description: Revenus journaliers
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       revenue:
 *                         type: number
 *                 routeRevenue:
 *                   type: array
 *                   description: Revenus par route
 *                   items:
 *                     type: object
 *                     properties:
 *                       route:
 *                         type: string
 *                       revenue:
 *                         type: number
 *                 period:
 *                   type: string
 *                   description: Période analysée
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
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                     description: Numéro de téléphone du conducteur
 *                   isActive:
 *                     type: boolean
 *                   tripCount:
 *                     type: number
 *                     description: Nombre de voyages effectués
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
 *                   numero:
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
 *                     description: Numéro de téléphone du client
 *                   totalColis:
 *                     type: number
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 */
router.get('/top-clients', auth, adminAuth, statsController.getTopClients);

/**
 * @swagger
 * /stats/user-reservations/{userId}:
 *   get:
 *     summary: Récupérer le nombre de réservations d'un utilisateur
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Nombre de réservations de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   description: Nombre de réservations
 */
router.get('/user-reservations/:userId', auth, statsController.getUserReservationsCount);

module.exports = router;
