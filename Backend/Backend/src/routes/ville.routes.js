const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const villeController = require('../controllers/ville.controller');

// Validation des données
const validateVille = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de la ville doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
    .withMessage('Le nom de la ville ne doit contenir que des lettres, des espaces et des tirets'),
];

/**
 * @swagger
 * /villes:
 *   get:
 *     summary: Liste toutes les villes
 *     tags: [Villes]
 *     security: []
 *     responses:
 *       200:
 *         description: Liste de toutes les villes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ville'
 */
// Routes publiques
router.get('/', villeController.getAllVilles);

/**
 * @swagger
 * /villes/{id}:
 *   get:
 *     summary: Détails d'une ville
 *     tags: [Villes]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ville
 *     responses:
 *       200:
 *         description: Détails de la ville
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ville'
 *       404:
 *         description: Ville non trouvée
 */
router.get('/:id', villeController.getVilleById);

/**
 * @swagger
 * /villes:
 *   post:
 *     summary: Créer une ville
 *     tags: [Villes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nom de la ville (lettres, espaces et tirets uniquement)
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: '^[a-zA-ZÀ-ÿ\s-]+$'
 *     responses:
 *       201:
 *         description: Ville créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ville'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé - Admin requis
 */
// Routes protégées (admin uniquement)
router.post('/',
  auth,
  adminAuth,
  validateVille,
  villeController.createVille
);

/**
 * @swagger
 * /villes/{id}:
 *   put:
 *     summary: Modifier une ville
 *     tags: [Villes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ville
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nouveau nom de la ville
 *                 minLength: 2
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Ville modifiée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ville'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé - Admin requis
 *       404:
 *         description: Ville non trouvée
 */
router.put('/:id',
  auth,
  adminAuth,
  validateVille,
  villeController.updateVille
);

/**
 * @swagger
 * /villes/{id}:
 *   delete:
 *     summary: Supprimer une ville
 *     tags: [Villes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la ville
 *     responses:
 *       200:
 *         description: Ville supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé - Admin requis
 *       404:
 *         description: Ville non trouvée
 */
router.delete('/:id',
  auth,
  adminAuth,
  villeController.deleteVille
);


module.exports = router;
