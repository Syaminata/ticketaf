/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Colis:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du colis
 *         voyage:
 *           type: string
 *           description: Référence au voyage
 *         expediteur:
 *           type: string
 *           description: Référence à l'utilisateur expéditeur
 *         destinataire:
 *           type: object
 *           properties:
 *             nom:
 *               type: string
 *             telephone:
 *               type: string
 *             adresse:
 *               type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *           description: URL de l'image du colis
 *         status:
 *           type: string
 *           enum: [en attente, envoyé, reçu, annulé]
 *         trackingNumber:
 *           type: string
 *           description: Numéro de suivi unique
 *         createdBy:
 *           type: string
 *           description: ID de l'utilisateur qui a créé le colis
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   responses:
 *     Unauthorized:
 *       description: Non autorisé - Token manquant ou invalide
 *     NotFound:
 *       description: Ressource non trouvée
 *     ServerError:
 *       description: Erreur serveur
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { uploadColisImage } = require('../middleware/upload');
const colisController = require('../controllers/colis.controller');

/**
 * @swagger
 * /colis:
 *   post:
 *     tags:
 *       - Colis
 *     summary: Créer un nouveau colis
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - voyageId
 *               - destinataire[nom]
 *               - destinataire[telephone]
 *             properties:
 *               voyageId:
 *                 type: string
 *               description:
 *                 type: string
 *               'destinataire[nom]':
 *                 type: string
 *               'destinataire[telephone]':
 *                 type: string
 *               'destinataire[adresse]':
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Colis créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', 
  auth, 
  uploadColisImage, 
  colisController.createColis
);

/**
 * @swagger
 * /colis/{id}:
 *   put:
 *     tags:
 *       - Colis
 *     summary: Mettre à jour un colis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du colis à mettre à jour
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [en attente, envoyé, reçu, annulé]
 *               'destinataire[nom]':
 *                 type: string
 *               'destinataire[telephone]':
 *                 type: string
 *               'destinataire[adresse]':
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Colis mis à jour avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id', 
  auth, 
  uploadColisImage, 
  colisController.updateColis
);

/**
 * @swagger
 * /colis:
 *   get:
 *     tags:
 *       - Colis
 *     summary: Récupérer tous les colis (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [en attente, envoyé, reçu, annulé]
 *         description: Filtrer par statut
 *       - in: query
 *         name: voyageId
 *         schema:
 *           type: string
 *         description: Filtrer par ID de voyage
 *       - in: query
 *         name: expediteur
 *         schema:
 *           type: string
 *         description: Filtrer par ID d'expéditeur
 *     responses:
 *       200:
 *         description: Liste des colis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Colis'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', auth, colisController.getAllColis);

/**
 * @swagger
 * /colis/user/me:
 *   get:
 *     tags:
 *       - Colis
 *     summary: Récupérer les colis de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des colis de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Colis'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/user/me', auth, colisController.getUserColis);

/**
 * @swagger
 * /colis/{id}:
 *   get:
 *     tags:
 *       - Colis
 *     summary: Récupérer un colis par son ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du colis
 *     responses:
 *       200:
 *         description: Détails du colis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Colis'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id', auth, colisController.getColisById);

/**
 * @swagger
 * /colis/{id}:
 *   delete:
 *     tags:
 *       - Colis
 *     summary: Supprimer un colis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du colis à supprimer
 *     responses:
 *       200:
 *         description: Colis supprimé avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', auth, colisController.deleteColis);

/**
 * @swagger
 * /colis/track/{trackingNumber}:
 *   get:
 *     tags:
 *       - Colis
 *     summary: Suivre un colis par son numéro de suivi
 *     parameters:
 *       - in: path
 *         name: trackingNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Numéro de suivi du colis
 *     responses:
 *       200:
 *         description: Détails du suivi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Colis'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/track/:trackingNumber', colisController.trackColis);

/**
 * @swagger
 * /colis/stats/colis:
 *   get:
 *     tags:
 *       - Colis
 *     summary: Obtenir des statistiques sur les colis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des colis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Nombre total de colis
 *                 byStatus:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                 byMonth:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats/colis', auth, colisController.getColisStats);

module.exports = router;