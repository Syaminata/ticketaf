const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');

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
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur (optionnel si numero fourni)
 *               numero:
 *                 type: string
 *                 description: Numéro de téléphone (optionnel si email fourni)
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [client, admin, conducteur, superadmin]
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Mot de passe incorrect
 *       403:
 *         description: Accès refusé - Rôle incorrect
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/login', login);

module.exports = router;

