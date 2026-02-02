const express = require('express');
const router = express.Router();
const { register, login, updateFcmToken } = require('../controllers/auth.controller');
const { loginDriver } = require('../controllers/driver.auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - numero
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom de l'utilisateur
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur (optionnel)
 *               numero:
 *                 type: string
 *                 pattern: '^(77|78|76|70|75|33|71)\d{7}$'
 *                 description: Numéro de téléphone (9 chiffres)
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe
 *               role:
 *                 type: string
 *                 enum: [client, admin, conducteur, superadmin]
 *                 default: client
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion des utilisateurs (clients et admins)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               numero:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Authentification échouée
 */
router.post('/login', login);
/**
 * @swagger
 * /api/auth/login/driver:
 *   post:
 *     summary: Connexion des conducteurs
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               numero:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Authentification échouée
 *       403:
 *         description: Compte désactivé
 */
router.post('/login/driver', loginDriver);

/**
 * @swagger
 * /auth/fcm-token:
 *   put:
 *     summary: Mettre à jour le FCM token de l'utilisateur
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: Le FCM token à mettre à jour
 *               platform:
 *                 type: string
 *                 enum: [android, ios, web]
 *                 default: web
 *                 description: La plateforme du token
 *     responses:
 *       200:
 *         description: FCM token mis à jour avec succès
 *       400:
 *         description: FCM token requis
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/fcm-token', authenticateToken, updateFcmToken);

module.exports = router;

