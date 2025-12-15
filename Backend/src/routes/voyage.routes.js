const express = require('express');
const router = express.Router();
const voyageController = require('../controllers/voyage.controller');
const { auth, adminAuth } = require('../middleware/auth');
const { isDriver } = require('../middleware/auth');

// ================
// Routes publiques
// ================

/**
 * @swagger
 * /voyages:
 *   get:
 *     summary: Récupérer tous les voyages futurs
 *     tags: [Voyages]
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
router.get('/', voyageController.getAllVoyage);

/**
 * @swagger
 * /voyages/all/including-expired:
 *   get:
 *     summary: Récupérer tous les voyages (y compris expirés)
 *     tags: [Voyages]
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
router.get('/all/including-expired', voyageController.getAllVoyageIncludingExpired);

/**
 * @swagger
 * /voyages/search:
 *   get:
 *     summary: Rechercher des voyages
 *     tags: [Voyages]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Ville de départ
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Ville d'arrivée
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date du voyage (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Liste des voyages correspondants aux critères
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Voyage'
 */
router.get('/search', voyageController.searchVoyages);

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

/**
 * @swagger
 * /voyages/driver:
 *   post:
 *     summary: Créer un voyage depuis le compte conducteur
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
 *               - from
 *               - to
 *               - date
 *               - price
 *               - totalSeats
 *             properties:
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
 *     responses:
 *       201:
 *         description: Voyage créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voyage'
 */
router.post('/driver', auth, isDriver, voyageController.createVoyageByDriver);

/**
 * @swagger
 * /voyages/{id}:
 *   get:
 *     summary: Récupérer un voyage par son ID
 *     tags: [Voyages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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

// ========================
// Routes pour conducteurs
// ========================

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
 *               - from
 *               - to
 *               - date
 *               - price
 *               - totalSeats
 *             properties:
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
router.post('/', auth, adminAuth, voyageController.createVoyage);

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
 *             $ref: '#/components/schemas/Voyage'
 *     responses:
 *       200:
 *         description: Voyage mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Voyage'
 */
router.put('/:id', auth, isDriver, voyageController.updateVoyage);

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
router.delete('/:id', auth, isDriver, voyageController.deleteVoyage);

// =================
// Routes admin
// =================

/**
 * @swagger
 * /voyages/admin/all:
 *   get:
 *     summary: [ADMIN] Récupérer tous les voyages (y compris expirés)
 *     tags: [Admin - Voyages]
 *     security:
 *       - bearerAuth: []
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
router.get('/admin/all', auth, adminAuth, voyageController.getAllVoyageIncludingExpired);

/**
 * @swagger
 * /voyages/admin/{id}:
 *   delete:
 *     summary: [ADMIN] Supprimer un voyage
 *     tags: [Admin - Voyages]
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
router.delete('/admin/:id', auth, adminAuth, voyageController.deleteVoyage);

module.exports = router;
