const express = require("express");
const router = express.Router();
const Reservation = require("../models/reservation.model");
const { auth, adminAuth } = require('../middleware/auth');
const reservationController = require('../controllers/reservation.controller');

/**
 * @swagger
 * /reservations/chart:
 *   get:
 *     summary: Statistiques des réservations des 7 derniers jours
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     description: Retourne les statistiques des réservations par jour pour les 7 derniers jours
 *     responses:
 *       200:
 *         description: Données pour le graphique
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   day:
 *                     type: string
 *                     example: "Lun"
 *                   value:
 *                     type: number
 *                     example: 5
 *       500:
 *         description: Erreur serveur
 */
router.get("/chart", auth, adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);
    lastWeek.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);

    const reservations = await Reservation.aggregate([
      { $match: { createdAt: { $gte: lastWeek, $lte: today } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const chartData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(lastWeek);
      date.setDate(lastWeek.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const found = reservations.find(r => r._id === formattedDate);
      chartData.push({ day: dayName, value: found ? found.count : 0 });
    }

    res.json(chartData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Créer une nouvelle réservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               voyage:
 *                 type: string
 *                 description: ID du voyage (optionnel si bus est fourni)
 *               bus:
 *                 type: string
 *                 description: ID du bus (optionnel si voyage est fourni)
 *               user:
 *                 type: string
 *                 description: ID de l'utilisateur
 *               ticket:
 *                 type: string
 *                 enum: [place, colis]
 *                 default: place
 *               quantity:
 *                 type: number
 *                 default: 1
 *     responses:
 *       201:
 *         description: Réservation créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Erreur de validation
 */
router.post('/', auth, reservationController.createReservation);

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Récupérer toutes les réservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des réservations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 */
router.get('/', auth, adminAuth, reservationController.getAllReservations);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Récupérer une réservation par ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la réservation
 *     responses:
 *       200:
 *         description: Détails de la réservation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       404:
 *         description: Réservation non trouvée
 */
router.get('/:id', auth, reservationController.getReservationById);

/**
 * @swagger
 * /reservations/{id}:
 *   put:
 *     summary: Mettre à jour une réservation
 *     tags: [Reservations]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voyage:
 *                 type: string
 *               bus:
 *                 type: string
 *               user:
 *                 type: string
 *               ticket:
 *                 type: string
 *                 enum: [place, colis]
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Réservation mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 */
router.put('/:id', auth, reservationController.updateReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Supprimer une réservation
 *     tags: [Reservations]
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
 *         description: Réservation supprimée avec succès
 *       404:
 *         description: Réservation non trouvée
 */
router.delete('/:id', auth, reservationController.deleteReservation);

module.exports = router;
