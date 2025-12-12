const express = require('express');
const router = express.Router();
const voyageController = require('../controllers/voyage.controller');
const { auth, adminAuth, isDriver } = require('../middleware/auth');

/**
 * @swagger
 * /voyages:
 *   post:
 *     summary: Créer un nouveau voyage
 *     tags: [Voyages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driver
 *               - from
 *               - to
 *               - date
 *               - price
 *               - totalSeats
 *             properties:
 *               driver:
 *                 type: string
 *                 description: ID du conducteur
 *               from:
 *                 type: string
 *                 description: Ville de départ
 *               to:
 *                 type: string
 *                 description: Ville d'arrivée
 *               date:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *                 description: Prix du voyage
 *               totalSeats:
 *                 type: number
 *                 default: 4
 *               availableSeats:
 *                 type: number
 *                 default: 4
 *     responses:
 *       201:
 *         description: Voyage créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voyage'
 */
router.post('/', auth, voyageController.createVoyage);

/**
 * @swagger
 * /voyages:
 *   get:
 *     summary: Récupérer tous les voyages futurs
 *     tags: [Voyages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des voyages futurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Voyage'
 */
router.get('/', voyageController.getAllVoyage); // Voyages futurs uniquement

/**
 * @swagger
 * /voyages/all/including-expired:
 *   get:
 *     summary: Récupérer tous les voyages (y compris expirés)
 *     tags: [Voyages]
 *     security:
 *       - bearerAuth: []
 *     description: Récupère tous les voyages, y compris ceux qui sont passés (pour historique)
 *     responses:
 *       200:
 *         description: Liste de tous les voyages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Voyage'
 */
router.get('/all/including-expired', voyageController.getAllVoyageIncludingExpired); // Tous les voyages (pour historique)

/**
 * @swagger
 * /voyages/{id}:
 *   get:
 *     summary: Récupérer un voyage par ID
 *     tags: [Voyages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du voyage
 *     responses:
 *       200:
 *         description: Détails du voyage
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voyage'
 *       404:
 *         description: Voyage non trouvé
 */
router.get('/:id', voyageController.getVoyageById);
router.get('/api/voyages', voyageController.searchVoyages);
/**
 * @swagger
 * /voyages/{id}:
 *   put:
 *     summary: Mettre à jour un voyage
 *     tags: [Voyages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driver:
 *                 type: string
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *               totalSeats:
 *                 type: number
 *               availableSeats:
 *                 type: number
 *     responses:
 *       200:
 *         description: Voyage mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voyage'
 */
router.put('/:id', auth, adminAuth, voyageController.updateVoyage);

/**
 * @swagger
 * /voyages/{id}:
 *   delete:
 *     summary: Supprimer un voyage
 *     tags: [Voyages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Voyage supprimé avec succès
 *       404:
 *         description: Voyage non trouvé
 */
router.delete('/:id', auth, adminAuth, voyageController.deleteVoyage);

/**
 * @swagger
 * /voyages/me:
 *   get:
 *     summary: Récupérer les voyages du conducteur connecté
 *     tags: [Voyages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeExpired
 *         schema:
 *           type: boolean
 *         description: Inclure les voyages expirés
 *     responses:
 *       200:
 *         description: Liste des voyages du conducteur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Voyage'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/me', auth, isDriver, voyageController.getMyVoyages);

// Routes protégées pour les conducteurs
router.post('/', auth, isDriver, voyageController.createVoyage);
router.put('/:id', auth, isDriver, voyageController.updateVoyage);
router.delete('/:id', auth, isDriver, voyageController.deleteVoyage);

// Routes publiques
router.get('/', voyageController.getAllVoyage);
router.get('/all', voyageController.getAllVoyageIncludingExpired);
router.get('/search', voyageController.searchVoyages);
router.get('/:id', voyageController.getVoyageById);

// Routes admin
 router.get('/', adminAuth, voyageController.getAllVoyage);
 router.delete('/:id', adminAuth, voyageController.deleteVoyage);

module.exports = router;
