const express = require('express');
const router = express.Router();
const { auth, colisManagementAuth } = require('../middleware/auth');
const { uploadColisImage } = require('../middleware/upload');
const colisController = require('../controllers/colis.controller');

/**
 * @swagger
 * /colis:
 *   post:
 *     tags:
 *       - Colis
 *     summary: Créer un nouveau colis
 *     description: Si voyageId absent, destination + villeDepart + dateEnvoi sont requis.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - destinataire[nom]
 *               - destinataire[telephone]
 *             properties:
 *               voyageId:
 *                 type: string
 *                 description: ID du voyage (optionnel si destination + villeDepart + dateEnvoi fournis)
 *               destination:
 *                 type: string
 *                 description: Ville de destination (optionnel si voyageId fourni)
 *               villeDepart:
 *                 type: string
 *                 description: Ville de départ (optionnel si voyageId fourni)
 *               dateEnvoi:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'envoi prévue (optionnel si voyageId fourni)
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Colis'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé - Token manquant ou invalide
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
 *                 enum: [en attente, enregistré, envoyé, reçu, annulé]
 *               destination:
 *                 type: string
 *                 description: Ville de destination
 *               villeDepart:
 *                 type: string
 *                 description: Ville de départ
 *               dateEnvoi:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'envoi prévue
 *               prix:
 *                 type: number
 *                 description: Prix du colis
 *               voyageId:
 *                 type: string
 *                 description: ID du voyage associé
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Colis'
 *       404:
 *         description: Ressource non trouvée
 *       401:
 *         description: Non autorisé - Token manquant ou invalide
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
 *           enum: [en attente, enregistré, envoyé, reçu, annulé]
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
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filtrer par destination
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
 *         description: Non autorisé - Token manquant ou invalide
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
 *         description: Non autorisé - Token manquant ou invalide
 */
router.get('/user/me', auth, colisController.getUserColis);

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
 *         description: Ressource non trouvée
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
 *         description: Non autorisé - Token manquant ou invalide
 */
router.get('/stats/colis', auth, colisController.getColisStats);

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
 *         description: Ressource non trouvée
 *       401:
 *         description: Non autorisé - Token manquant ou invalide
 */
router.get('/:id', auth, colisController.getColisById);

/**
 * @swagger
 * /colis/{id}/prix:
 *   put:
 *     tags:
 *       - Colis
 *     summary: Fixer le prix d'un colis (gestionnaire colis)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du colis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prix
 *             properties:
 *               prix:
 *                 type: number
 *                 minimum: 0
 *                 description: Prix à fixer pour le colis
 *     responses:
 *       200:
 *         description: Prix mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 colis:
 *                   $ref: '#/components/schemas/Colis'
 *       400:
 *         description: Données invalides
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Ressource non trouvée
 */
router.put('/:id/prix', auth, colisManagementAuth, colisController.updateColisPrix);

/**
 * @swagger
 * /colis/{id}/valider:
 *   put:
 *     tags:
 *       - Colis
 *     summary: Valider et expédier un colis (expéditeur uniquement)
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
 *         description: Colis validé et expédié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 colis:
 *                   $ref: '#/components/schemas/Colis'
 *       400:
 *         description: Prix non défini ou statut incorrect
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Ressource non trouvée
 */
router.put('/:id/valider', auth, colisController.validateColis);

/**
 * @swagger
 * /colis/{id}/annuler:
 *   put:
 *     tags:
 *       - Colis
 *     summary: Annuler un colis (expéditeur uniquement, statut 'en attente' seulement)
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
 *         description: Colis annulé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 colis:
 *                   $ref: '#/components/schemas/Colis'
 *       400:
 *         description: Annulation impossible (statut incorrect)
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Ressource non trouvée
 */
router.put('/:id/annuler', auth, colisController.cancelColis);

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
 *         description: Ressource non trouvée
 *       401:
 *         description: Non autorisé - Token manquant ou invalide
 */
router.delete('/:id', auth, colisController.deleteColis);

module.exports = router;
