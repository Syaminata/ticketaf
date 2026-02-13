const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');

/**
 * @swagger
 * /api/otp/request:
 *   post:
 *     summary: Demander un code OTP pour réinitialiser le mot de passe
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Numéro de téléphone de l'utilisateur
 *                 example: "771234567"
 *     responses:
 *       200:
 *         description: Code OTP envoyé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP généré avec succès"
 *                 dev_otp:
 *                   type: string
 *                   description: Code OTP visible uniquement en développement
 *                   example: "123456"
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Le numéro est requis"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 */
router.post('/request', otpController.requestOtp);

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     summary: Vérifier un code OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *               - otp
 *             properties:
 *               numero:
 *                 type: string
 *                 description: Numéro de téléphone de l'utilisateur
 *                 example: "771234567"
 *               otp:
 *                 type: string
 *                 description: Code OTP à vérifier
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Code OTP valide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP valide"
 *                 resetToken:
 *                   type: string
 *                   description: Token pour la réinitialisation du mot de passe
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Code OTP invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Code OTP invalide ou expiré"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 */
router.post('/verify', otpController.verifyOtp);

/**
 * @swagger
 * /api/otp/confirm:
 *   post:
 *     summary: Confirmer la réinitialisation du mot de passe avec OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: Token de réinitialisation obtenu après vérification OTP
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nouveau mot de passe
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mot de passe réinitialisé avec succès"
 *       400:
 *         description: Token invalide ou erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token invalide ou expiré"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 */
router.post('/confirm', otpController.confirmResetPassword);

module.exports = router;
