const Reservation = require('../models/reservation.model');
const Colis = require('../models/colis.model');
const Voyage = require('../models/voyage.model');
const User = require('../models/user.model');
const Bus = require('../models/bus.model');

// -----------------------------
// CREATE RESERVATION
// -----------------------------
const createReservation = async (req, res) => {
  try {
    const { userId, voyageId, busId, ticket, quantity, description, delivery } = req.body;

    // Validation des champs obligatoires
    if (!userId || !ticket || !quantity) {
      return res.status(400).json({ message: 'Utilisateur, type de ticket et quantité sont requis' });
    }

    if (!voyageId && !busId) {
      return res.status(400).json({ message: 'Au moins un voyage ou un bus doit être spécifié' });
    }

    if (voyageId && busId) {
      return res.status(400).json({ message: 'Uniquement un voyage OU un bus peut être spécifié, pas les deux' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Vérifier voyage si fourni
    if (voyageId) {
      const voyage = await Voyage.findById(voyageId);
      if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
      if (ticket === 'place' && voyage.availableSeats < quantity) {
        return res.status(400).json({ message: `Pas assez de places disponibles. Places restantes: ${voyage.availableSeats}` });
      }
    }

    // Vérifier bus si fourni
    if (busId) {
      const bus = await Bus.findById(busId);
      if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
      if (ticket === 'place' && (bus.availableSeats === undefined || bus.availableSeats === null)) {
        await Bus.findByIdAndUpdate(busId, { availableSeats: bus.capacity });
        bus.availableSeats = bus.capacity;
      }
      if (ticket === 'place' && bus.availableSeats < quantity) {
        return res.status(400).json({ message: `Pas assez de places disponibles. Places restantes: ${bus.availableSeats}` });
      }
    }

    // Créer la réservation
    const reservationData = { user: userId, ticket, quantity };
    if (voyageId) reservationData.voyage = voyageId;
    if (busId) reservationData.bus = busId;

    const reservation = await Reservation.create(reservationData);

    // Créer le colis si ticket === 'colis'
    let colisDoc = null;
    if (ticket === 'colis') {
      if (!description) {
        return res.status(400).json({ message: 'Description est requise pour un colis' });
      }
      colisDoc = await Colis.create({
        reservation: reservation._id,
        description,
        status: 'en attente'
      });
    }

    // Diminuer le nombre de places disponibles si ticket === place
    if (ticket === 'place') {
      if (voyageId) await Voyage.findByIdAndUpdate(voyageId, { $inc: { availableSeats: -quantity } });
      if (busId) await Bus.findByIdAndUpdate(busId, { $inc: { availableSeats: -quantity } });
    }

    // Populate pour retourner les données complètes
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus');

    res.status(201).json({
      message: 'Réservation créée',
      reservation: populatedReservation,
      colis: colisDoc
    });

  } catch (err) {
    console.error('Erreur createReservation:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET ALL RESERVATIONS

const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus')
      .sort({ createdAt: -1 });

    // Récupérer les descriptions de colis associées aux réservations (si existantes)
    const reservationIds = reservations.map(r => r._id);
    const colisList = await Colis.find({ reservation: { $in: reservationIds } })
      .select('reservation description');
    const colisByReservation = new Map(colisList.map(c => [String(c.reservation), c.description]));

    const enriched = reservations.map(r => {
      const obj = r.toObject();
      obj.colisDescription = colisByReservation.get(String(r._id)) || null;
      return obj;
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error('Erreur getAllReservations:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// GET RESERVATION BY ID

const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus');
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    const colis = await Colis.findOne({ reservation: reservation._id }).select('description');
    const obj = reservation.toObject();
    obj.colisDescription = colis ? colis.description : null;

    res.status(200).json(obj);
  } catch (err) {
    console.error('Erreur getReservationById:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// UPDATE RESERVATION

const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus');
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });
    res.status(200).json({ message: 'Réservation mise à jour', reservation });
  } catch (err) {
    console.error('Erreur updateReservation:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// DELETE RESERVATION

const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    // Remettre les places disponibles si ticket === 'place'
    if (reservation.ticket === 'place') {
      if (reservation.voyage) await Voyage.findByIdAndUpdate(reservation.voyage, { $inc: { availableSeats: reservation.quantity } });
      if (reservation.bus) await Bus.findByIdAndUpdate(reservation.bus, { $inc: { availableSeats: reservation.quantity } });
    }

    // Supprimer la réservation
    await Reservation.findByIdAndDelete(req.params.id);

    // Supprimer le colis associé si ticket === 'colis'
    if (reservation.ticket === 'colis') {
      await Colis.deleteOne({ reservation: reservation._id });
    }

    res.status(200).json({ message: 'Réservation supprimée' });
  } catch (err) {
    console.error('Erreur deleteReservation:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = {createReservation,getAllReservations, getReservationById,updateReservation,deleteReservation};

