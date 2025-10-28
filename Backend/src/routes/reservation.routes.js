const express = require("express");
const router = express.Router();
const Reservation = require("../models/reservation.model");
const { auth, adminAuth } = require('../middleware/auth');
const reservationController = require('../controllers/reservation.controller');

// Stats des réservations des 7 derniers jours
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

// Routes CRUD de base
router.post('/', auth, adminAuth, reservationController.createReservation);
router.get('/', auth, adminAuth, reservationController.getAllReservations);
router.get('/:id', auth, adminAuth, reservationController.getReservationById);
router.put('/:id', auth, adminAuth, reservationController.updateReservation);
router.delete('/:id', auth, adminAuth, reservationController.deleteReservation);

module.exports = router;
