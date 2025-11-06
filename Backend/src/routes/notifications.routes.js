const express = require('express');
const router = express.Router();
const { createNotification } = require('../controllers/notifications.controller');

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Créer et envoyer une notification
 *     tags: [Notifications]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - recipient
 *             properties:
 *               message:
 *                 type: string
 *                 description: Message de la notification
 *               recipient:
 *                 type: string
 *                 description: Destinataire de la notification
 *               type:
 *                 type: string
 *                 enum: [email, sms, push]
 *     responses:
 *       200:
 *         description: Notification envoyée avec succès
 *       400:
 *         description: Erreur de validation
 */
router.post('/', createNotification);

module.exports = router;