const Reservation = require('../models/reservation.model');
const Colis = require('../models/colis.model');
const Voyage = require('../models/voyage.model');
const User = require('../models/user.model');
const Bus = require('../models/bus.model');
const { sendAndSaveNotification } = require('../services/notification.service');


const createReservation = async (req, res) => {
  try {
    const { voyageId, busId, ticket, quantity, description } = req.body;


    if ( !ticket || !quantity) {
      return res.status(400).json({ message: 'type de ticket et quantité sont requis' });
    }

    if (!voyageId && !busId) {
      return res.status(400).json({ message: 'Au moins un voyage ou un bus doit être spécifié' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (voyageId) {
      const voyage = await Voyage.findById(voyageId);
      if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
      if (ticket === 'place' && voyage.availableSeats < quantity) {
        return res.status(400).json({ message: `Pas assez de places disponibles. Places restantes: ${voyage.availableSeats}` });
      }
    }

    if (busId) {
      const bus = await Bus.findById(busId);
      if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });

      if (bus.isActive === false) {
        return res.status(400).json({ message: 'Ce bus n\'est pas disponible pour le moment' });
      }

      if (ticket === 'place' && bus.availableSeats < quantity) {
        return res.status(400).json({ message: `Pas assez de places disponibles. Places restantes: ${bus.availableSeats}` });
      }
    }

    // Verrouiller le prix au moment de la réservation
    let lockedPrice = 0;
    if (voyageId) {
      const v = await Voyage.findById(voyageId);
      if (v) lockedPrice = (v.price ?? 0) * quantity;
    }
    if (busId) {
      const b = await Bus.findById(busId);
      if (b) lockedPrice = (b.price ?? 0) * quantity;
    }

    const reservationData = { user: userId, ticket, quantity, lockedPrice };
    if (voyageId) reservationData.voyage = voyageId;
    if (busId) reservationData.bus = busId;

    const reservation = await Reservation.create(reservationData);

    // NOTIFICATIONS POUR VOYAGE (COVOITURAGE)
    if (ticket === 'place' && voyageId) {
      const voyage = await Voyage.findById(voyageId).populate('driver');

      if (voyage) {
        // Notification chauffeur (uniquement s'il existe)
        if (voyage.driver) {
          await sendAndSaveNotification(
            voyage.driver._id,
            'Nouvelle réservation',
            `${user.name} a réservé ${quantity} place(s) sur ${voyage.from} → ${voyage.to}`,
            {
              type: 'alert',
              tripType: 'covoiturage',
              voyageId: voyage._id.toString(),
              reservationId: reservation._id.toString()
            }
          );
        }

        // Notification client (toujours envoyée, avec infos chauffeur)
        await sendAndSaveNotification(
          user._id,
          'Réservation confirmée',
          `Votre place pour ${voyage.from} → ${voyage.to} est confirmée`,
          {
            type: 'success',
            tripType: 'covoiturage',
            voyageId: voyage._id.toString(),
            reservationId: reservation._id.toString(),
            driverName: voyage.driver?.name || '',
            driverPhone: voyage.driver?.numero || '',
            driverMatricule: voyage.driver?.matricule || '',
            driverMarque: voyage.driver?.marque || ''
          }
        );
      }
    }

    // NOTIFICATIONS POUR BUS
    if (ticket === 'place' && busId) {
      const bus = await Bus.findById(busId);
      if (bus) {
        await sendAndSaveNotification(
          user._id,
          'Réservation Bus confirmée',
          `Votre place dans le bus ${bus.name} pour ${bus.from} → ${bus.to} est confirmée`,
          {
            type: 'success',
            tripType: 'bus',
            busId: bus._id.toString(),
            vehicleModel: bus.name || '',
            licensePlate: bus.plateNumber || '',
            agencyName: bus.name || ''
          }
        );
      }
    }

    // NOTIFICATIONS POUR COLIS
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

      await sendAndSaveNotification(
        user._id,
        'Colis enregistré',
        'Votre demande d\'envoi de colis est en attente de validation',
        { type: 'info' }
      );
    }

    // Mise à jour des places
    if (ticket === 'place') {
      if (voyageId) await Voyage.findByIdAndUpdate(voyageId, { $inc: { availableSeats: -quantity } });
      if (busId) await Bus.findByIdAndUpdate(busId, { $inc: { availableSeats: -quantity } });
    }

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

const getAllReservations = async (req, res) => {
  try {
    console.log('🔍 Backend getAllReservations - req.query:', req.query);
    
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const status = req.query.status || '';
    const voyageId = req.query.voyageId || '';
    const busId = req.query.busId || '';

    console.log('📊 Pagination Reservations - page:', page, 'limit:', limit, 'skip:', skip);
    console.log('🔍 Filtres reçus - status:', status, 'voyageId:', voyageId, 'busId:', busId);

    // Construire la requête de base
    let reservationQuery = {};
    
    // Ajouter la recherche si fournie
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      reservationQuery.$or = [
        { 'user.name': searchRegex },
        { 'user.numero': searchRegex },
        { 'user.email': searchRegex },
        { 'voyage.from': searchRegex },
        { 'voyage.to': searchRegex },
        { 'voyage.driver.name': searchRegex },
        { 'voyage.driver.numero': searchRegex }
      ];
    }
    
    // Filtrer par statut si spécifié
    if (status && status !== 'all') {
      reservationQuery.status = status;
      console.log('🎯 Filtre status appliqué:', status);
    }
    
    // Filtrer par voyage si spécifié
    if (voyageId) {
      reservationQuery.voyage = voyageId;
      console.log('🎯 Filtre voyageId appliqué:', voyageId);
    }
    
    // Filtrer par bus si spécifié
    if (busId) {
      reservationQuery.bus = busId;
      console.log('🎯 Filtre busId appliqué:', busId);
    }

    console.log('🔎 Recherche Reservations avec filter:', reservationQuery);
    
    // Compter le total des réservations pour la pagination
    const total = await Reservation.countDocuments(reservationQuery);
    
    // Récupérer les réservations avec pagination
    const reservations = await Reservation.find(reservationQuery)
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📈 Résultats Reservations - reservations.length:', reservations.length, 'total:', total);
    
    // Retourner les résultats avec pagination
    const response = {
      reservations: reservations,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('📤 Réponse Reservations envoyée:', {
      reservationsCount: reservations.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

    res.status(200).json(response);
  } catch (err) {
    console.error('Erreur getAllReservations:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

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
    res.status(200).json(reservation);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateReservation = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Action réservée aux administrateurs' });
    }
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });
    Object.assign(reservation, req.body);
    await reservation.save();
    res.status(200).json({ message: 'Réservation mise à jour', reservation });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    if (reservation.ticket === 'place') {
      if (reservation.voyage) await Voyage.findByIdAndUpdate(reservation.voyage, { $inc: { availableSeats: reservation.quantity } });
      if (reservation.bus) await Bus.findByIdAndUpdate(reservation.bus, { $inc: { availableSeats: reservation.quantity } });
    }

    await Reservation.findByIdAndDelete(req.params.id);
    if (reservation.ticket === 'colis') await Colis.deleteOne({ reservation: reservation._id });

    res.status(200).json({ message: 'Réservation supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /reservations/:id/cancel — utilisateur annule son propre ticket
const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate({ path: 'voyage', populate: { path: 'driver' } })
      .populate('bus');

    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    // Vérification propriétaire (compatible Mongoose ObjectId et plain object)
    const reservationUserId = reservation.user?._id?.toString() ?? reservation.user?.toString();
    const requestUserId = req.user?._id?.toString() ?? req.user?.id?.toString();
    if (reservationUserId !== requestUserId) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    if (reservation.status === 'annulé') {
      return res.status(400).json({ message: 'Cette réservation est déjà annulée' });
    }

    // Changer le statut
    reservation.status = 'annulé';
    await reservation.save();

    // Restituer les places
    if (reservation.ticket === 'place') {
      if (reservation.voyage) await Voyage.findByIdAndUpdate(reservation.voyage._id, { $inc: { availableSeats: reservation.quantity } });
      if (reservation.bus) await Bus.findByIdAndUpdate(reservation.bus._id, { $inc: { availableSeats: reservation.quantity } });
    }

    const user = await User.findById(req.user._id);

    const from = reservation.voyage?.from || reservation.bus?.from || '';
    const to = reservation.voyage?.to || reservation.bus?.to || '';
    const trajet = from && to ? `${from} → ${to}` : 'votre trajet';

    // Notification utilisateur (in-app + push)
    await sendAndSaveNotification(
      req.user._id,
      'Réservation annulée ✓',
      `Votre réservation ${trajet} a été annulée. ${reservation.quantity} place(s) libérée(s).`,
      { type: 'info', reservationId: reservation._id.toString(), screen: 'tickets' }
    );

    // Notification chauffeur covoiturage (in-app + push)
    if (reservation.voyage?.driver) {
      const driver = reservation.voyage.driver;
      await sendAndSaveNotification(
        driver._id,
        'Annulation de réservation',
        `${user?.name || 'Un passager'} a annulé ${reservation.quantity} place(s) sur ${trajet}.`,
        { type: 'alert', reservationId: reservation._id.toString(), voyageId: reservation.voyage._id.toString() }
      );
    }

    res.status(200).json({ message: 'Réservation annulée', reservation });
  } catch (err) {
    console.error('Erreur cancelReservation:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { createReservation, getAllReservations, getReservationById, updateReservation, deleteReservation, cancelReservation };
