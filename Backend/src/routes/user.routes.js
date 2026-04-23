const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, updateProfile, changePassword } = require('../controllers/user.controller');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const { sendAndSaveNotification } = require('../services/notification.service');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     description: Accessible uniquement aux admins et superadmins. Retourne tous les utilisateurs hors conducteurs.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/', auth, adminAuth, getAllUsers);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               email:
 *                 type: string
 *                 format: email
 *               numero:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               address:
 *                 type: string
 *                 description: Adresse de l'utilisateur (optionnel)
 *               role:
 *                 type: string
 *                 enum: [client, admin, conducteur, superadmin]
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Erreur de validation
 */
router.post('/', auth, adminAuth, createUser);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil de l'utilisateur connecté
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 */
router.get('/me', auth, (req, res) => {
  res.status(200).json(req.user);
});
/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Mettre à jour le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nouveau nom de l'utilisateur
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Nouvel email (optionnel)
 *               numero:
 *                 type: string
 *                 description: Nouveau numéro de téléphone
 *               address:
 *                 type: string
 *                 description: Nouvelle adresse (optionnel)
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Données de requête invalides
 *       401:
 *         description: Non authentifié
 */
router.put('/profile', auth, updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Changer le mot de passe de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Mot de passe actuel de l'utilisateur
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Mot de passe mis à jour avec succès
 *       400:
 *         description: Données de requête invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.put('/change-password', auth, changePassword);
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', auth, getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               role:
 *                 type: string
 *                 enum: [client, admin, conducteur, superadmin]
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id', auth, adminAuth, updateUser);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Supprimer le compte de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé avec succès
 *       401:
 *         description: Non authentifié
 */
// Demande de suppression avec délai de 24h
router.delete('/me', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const deletionScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      userId,
      { pendingDeletion: true, deletionScheduledAt },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Notifier l'utilisateur en push uniquement (pas de notif in-app)
    await sendAndSaveNotification(
      userId,
      'Compte supprimé',
      'Votre compte a été supprimé. La suppression définitive sera effective dans 24h. Pour demander une restauration, contactez notre assistance.',
      { type: 'alert', action: 'pending_deletion' },
      { saveToDb: false }
    );

    // Notifier les admins
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, pendingDeletion: false });
    for (const admin of admins) {
      await sendAndSaveNotification(
        admin._id,
        'Suppression de compte',
        `${user.name} (${user.numero}) a supprimé son compte. Suppression définitive dans 24h.`,
        { type: 'alert', action: 'user_deletion_request', userId: userId.toString() }
      );
    }

    res.status(200).json({
      message: 'Suppression planifiée dans 24h',
      deletionScheduledAt,
    });
  } catch (err) {
    console.error('Erreur deleteMe:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Annuler sa propre demande de suppression
router.post('/me/cancel-deletion', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { pendingDeletion: false, deletionScheduledAt: null },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    await sendAndSaveNotification(
      req.user._id,
      'Suppression annulée',
      'Votre demande de suppression de compte a été annulée. Votre compte est toujours actif.',
      { type: 'success' }
    );

    // Notifier les admins de l'annulation
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, pendingDeletion: false });
    for (const admin of admins) {
      await sendAndSaveNotification(
        admin._id,
        'Annulation de suppression de compte',
        `${user.name} (${user.numero}) a annulé sa demande de suppression de compte.`,
        { type: 'info', action: 'deletion_cancelled', userId: user._id.toString() }
      );
    }

    res.status(200).json({ message: 'Suppression annulée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Admin : restaurer le compte d'un utilisateur en attente de suppression
router.post('/:id/restore-deletion', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { pendingDeletion: false, deletionScheduledAt: null },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    await sendAndSaveNotification(
      user._id,
      'Compte restauré',
      'Un administrateur a annulé la suppression de votre compte. Votre compte est toujours actif.',
      { type: 'success' }
    );

    res.status(200).json({ message: 'Compte restauré', user });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete('/:id', auth, adminAuth, deleteUser);

// Admin : effacer toutes les réservations et colis d'un utilisateur (nettoyage données de test)
router.delete('/:id/clear-data', auth, adminAuth, async (req, res) => {
  try {
    const Reservation = require('../models/reservation.model');
    const Colis = require('../models/colis.model');
    const [reservations, colis] = await Promise.all([
      Reservation.deleteMany({ user: req.params.id }),
      Colis.deleteMany({ expediteur: req.params.id }),
    ]);
    res.status(200).json({
      message: 'Données effacées',
      deletedReservations: reservations.deletedCount,
      deletedColis: colis.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
