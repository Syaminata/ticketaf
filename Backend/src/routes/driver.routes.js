const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { auth, adminAuth } = require('../middleware/auth');
const { uploadDriverFiles } = require('../middleware/upload');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * /drivers/pinned:
 *   get:
 *     summary: Récupérer tous les chauffeurs épinglés
 *     tags: [Drivers]
 *     responses:
 *       200:
 *         description: Liste des chauffeurs épinglés
 */
router.get('/pinned', driverController.getPinnedDrivers);
/**
 * @swagger
 * /drivers/register:
 *   post:
 *     summary: Inscription publique d'un conducteur
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - numero
 *               - password
 *               - matricule
 *               - marque
 *               - capacity
 *               - capacity_coffre
 *               - permis
 *               - photo
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               numero:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               matricule:
 *                 type: string
 *               marque:
 *                 type: string
 *               capacity:
 *                 type: number
 *               capacity_coffre:
 *                 type: string
 *                 enum: [petit, moyen, grand]
 *               climatisation:
 *                 type: boolean
 *               permis:
 *                 type: string
 *                 format: binary
 *                 description: Fichier du permis de conduire
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Photo du conducteur
 *     responses:
 *       201:
 *         description: Conducteur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Erreur de validation
 */
router.post('/register', uploadDriverFiles, driverController.createDriver);


/**
 * @swagger
 * /drivers:
 *   get:
 *     summary: Récupérer tous les conducteurs
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conducteurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Driver'
 */
router.get('/', auth, adminAuth, driverController.getAllDrivers);

/**
 * @swagger
 * /drivers/{id}:
 *   put:
 *     summary: Mettre à jour un conducteur
 *     tags: [Drivers]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               numero:
 *                 type: string
 *               password:
 *                 type: string
 *               matricule:
 *                 type: string
 *               marque:
 *                 type: string
 *               capacity:
 *                 type: number
 *               capacity_coffre:
 *                 type: string
 *                 enum: [petit, moyen, grand]
 *               climatisation:
 *                 type: boolean
 *               permis:
 *                 type: string
 *                 format: binary
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Conducteur mis à jour
 */
router.put('/:id', auth, adminAuth, uploadDriverFiles, driverController.updateDriver);
/**
 * @swagger
 * /drivers/{id}/pin:
 *   patch:
 *     summary: Épingler un chauffeur (recommandation)
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pinnedOrder:
 *                 type: number
 *                 description: Ordre d'affichage (optionnel)
 *     responses:
 *       200:
 *         description: Chauffeur épinglé avec succès
 */
router.patch('/:id/pin', auth, adminAuth, driverController.pinDriver);

/**
 * @swagger
 * /drivers/{id}/unpin:
 *   patch:
 *     summary: Désépingler un chauffeur
 *     tags: [Drivers]
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
 *         description: Chauffeur désépinglé avec succès
 */
router.patch('/:id/unpin', auth, adminAuth, driverController.unpinDriver);
/**
 * @swagger
 * /drivers/{id}:
 *   delete:
 *     summary: Supprimer un conducteur
 *     tags: [Drivers]
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
 *         description: Conducteur supprimé avec succès
 */
router.delete('/:id', auth, adminAuth, driverController.deleteDriver);

/**
 * @swagger
 * /drivers/clean-files:
 *   post:
 *     summary: Nettoyer les fichiers orphelins des conducteurs
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fichiers nettoyés avec succès
 */
router.post('/clean-files', auth, adminAuth, driverController.cleanFiles);

/**
 * @swagger
 * /drivers/{id}/activate:
 *   put:
 *     summary: Activer un conducteur
 *     tags: [Drivers]
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
 *         description: Conducteur activé
 */
router.put('/:id/activate', auth, adminAuth, driverController.activateDriver);

/**
 * @swagger
 * /drivers/{id}/deactivate:
 *   put:
 *     summary: Désactiver un conducteur
 *     tags: [Drivers]
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
 *         description: Conducteur désactivé
 */
router.put('/:id/deactivate', auth, adminAuth, driverController.deactivateDriver);
module.exports = router;
