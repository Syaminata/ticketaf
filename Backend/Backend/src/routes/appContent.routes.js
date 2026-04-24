const express = require('express');
const router = express.Router();
const { getContent, updateContent, getAllContents } = require('../controllers/appContent.controller');
const { auth, adminAuth } = require('../middleware/auth');

/**
 * @swagger
 * /app-content:
 *   get:
 *     summary: Récupérer tous les contenus de l'application
 *     tags: [App Content]
 *     security: []
 *     responses:
 *       200:
 *         description: Liste des contenus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 */
router.get('/', getAllContents);

/**
 * @swagger
 * /app-content/{key}:
 *   get:
 *     summary: Récupérer un contenu par clé
 *     tags: [App Content]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [privacy_policy, terms_conditions, about_app, contact_info]
 *         description: Clé du contenu (privacy_policy, terms_conditions, about_app, contact_info)
 *     responses:
 *       200:
 *         description: Contenu trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *       400:
 *         description: Clé invalide
 *       500:
 *         description: Erreur serveur
 */
router.get('/:key', getContent);

/**
 * @swagger
 * /app-content/{key}:
 *   put:
 *     summary: Mettre à jour un contenu (Admin seulement)
 *     tags: [App Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [privacy_policy, terms_conditions, about_app, contact_info]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contenu mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin requis)
 */
router.put('/:key', adminAuth, updateContent);

module.exports = router;
