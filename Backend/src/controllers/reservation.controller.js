const Reservation = require('../models/reservation.model');
const Colis = require('../models/colis.model');
const Voyage = require('../models/voyage.model');
const User = require('../models/user.model');
const Bus = require('../models/bus.model');
const { sendAndSaveNotification } = require('../services/notification.service');


const createReservation = async (req, res) => {
  try {
    const { voyageId, busId, ticket, quantity, description } = req.body;


    if (!ticket || !quantity) {
      return res.status(400).json({ message: 'type de ticket et quantité sont requis' });
    }

    if (!voyageId && !busId) {
      return res.status(400).json({ message: 'Au moins un voyage ou un bus doit être spécifié' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Votre compte est désactivé, veuillez contacter le support.' });
    }

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

    // Mise à jour des places AVANT les notifications (évite une race condition)
    if (ticket === 'place') {
      if (voyageId) await Voyage.findByIdAndUpdate(voyageId, { $inc: { availableSeats: -quantity } });
      if (busId) await Bus.findByIdAndUpdate(busId, { $inc: { availableSeats: -quantity } });
    }

    // NOTIFICATIONS POUR VOYAGE (COVOITURAGE)
    if (ticket === 'place' && voyageId) {
      const voyage = await Voyage.findById(voyageId).populate('driver');

      if (voyage) {
        // Notification chauffeur (uniquement s'il existe)
        if (voyage.driver) {
          await sendAndSaveNotification(
            voyage.driver._id,
            'Nouvelle réservation',
            `**${user.name}** a réservé **${quantity}** place(s) sur **${voyage.from}** → **${voyage.to}**`,
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
          `Votre place pour **${voyage.from}** → **${voyage.to}** est confirmée`,
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
        // Notify client
        await sendAndSaveNotification(
          user._id,
          'Réservation Bus confirmée',
          `Votre place dans le bus **${bus.name}** pour **${bus.from}** → **${bus.to}** est confirmée`,
          {
            type: 'success',
            tripType: 'bus',
            busId: bus._id.toString(),
            vehicleModel: bus.name || '',
            licensePlate: bus.plateNumber || '',
            agencyName: bus.name || ''
          }
        );
        // Notify bus owner so their seat count refreshes automatically
        if (bus.owner) {
          await sendAndSaveNotification(
            bus.owner,
            'Nouvelle réservation',
            `**${user.name}** a réservé **${quantity}** place(s) dans **${bus.name}** (**${bus.from}** → **${bus.to}**)`,
            { type: 'alert', tripType: 'bus', busId: bus._id.toString(), reservationId: reservation._id.toString() }
          );
        }
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
        expediteur: user._id, // Assurer le lien expéditeur
        description,
        status: 'en attente'
      });

      // Une seule notification via colis.controller ou ici
      // On la laisse ici pour confirmation immédiate
      await sendAndSaveNotification(
        user._id,
        'Colis enregistré',
        'Votre demande d\'envoi de colis est en attente de validation',
        { type: 'info', tripType: 'colis', reservationId: reservation._id.toString() }
      );
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

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const {
      status, search, ticket,
      routeFrom, routeTo,
      busRouteFrom, busRouteTo,
      startDate, endDate,
      showPast
    } = req.query;

    let query = {};
    if (!status || status === 'all') {
      query.status = { $ne: 'annulé' };
    }

    // ── Statut ───────────────────────────────────────────────────────────────
    if (status && status !== 'all') query.status = status;

    // ── Type de ticket ───────────────────────────────────────────────────────
    if (ticket && ticket !== 'all') query.ticket = ticket;

    // ── Recherche par nom / numéro utilisateur ───────────────────────────────
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { numero: searchRegex }]
      }).select('_id');
      query.user = { $in: matchedUsers.map(u => u._id) };
    }

    // ── Filtre temporel : futur (réservations) ou passé (historique) ─────────
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // minuit aujourd'hui

    // Les dates manuelles (startDate/endDate) priment sur showPast
    const temporalFilter = startDate || endDate
      ? {
        ...(startDate ? { $gte: new Date(startDate) } : {}),
        ...(endDate ? { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) } : {})
      }
      : showPast === 'true'
        ? { $lt: todayStart }    // historique → date passée
        : { $gte: todayStart };  // réservations → date future ou aujourd'hui

    // ── Voyages correspondants (itinéraire + filtre temporel) ────────────────
    const voyageFilter = {
      date: temporalFilter,
      ...(routeFrom && routeTo ? {
        from: new RegExp(`^${routeFrom}$`, 'i'),
        to: new RegExp(`^${routeTo}$`, 'i')
      } : {})
    };

    // ── Bus correspondants (itinéraire + filtre temporel) ────────────────────
    const busFilter = {
      departureDate: temporalFilter,
      ...(busRouteFrom && busRouteTo ? {
        from: new RegExp(`^${busRouteFrom}$`, 'i'),
        to: new RegExp(`^${busRouteTo}$`, 'i')
      } : {})
    };

    const [matchedVoyages, matchedBuses] = await Promise.all([
      Voyage.find(voyageFilter).select('_id'),
      Bus.find(busFilter).select('_id')
    ]);

    const voyageIds = matchedVoyages.map(v => v._id);
    const busIds = matchedBuses.map(b => b._id);

    // ── Condition $or voyage/bus dans la query principale ────────────────────
    const orConditions = [
      { voyage: { $in: voyageIds } },
      { bus: { $in: busIds } }
    ];

    if (query.user) {
      // search est actif → combiner avec $and pour ne pas écraser
      query = {
        $and: [{ user: query.user }, { $or: orConditions }],
        ...(query.status && typeof query.status === 'string' ? { status: query.status } : query.status ? { status: query.status } : {}),
        ...(query.ticket ? { ticket: query.ticket } : {})
      };
    } else {
      query.$or = orConditions;
    }

    console.log('📋 Query finale:', JSON.stringify(query, null, 2));

    // ── Exécution ────────────────────────────────────────────────────────────
    const [reservations, total] = await Promise.all([
      Reservation.find(query)
        .populate('user', 'name numero email')
        .populate({ path: 'voyage', populate: { path: 'driver', select: 'name numero' } })
        .populate('bus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Reservation.countDocuments(query)
    ]);

    console.log(`📈 Résultats - trouvés: ${reservations.length}, total: ${total}`);

    res.status(200).json({
      reservations,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur getAllReservations:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
};

const getHistorique = async (req, res) => {
  try {
    console.log('🔍 Backend getHistorique appelé - req.query:', req.query);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const now = new Date();

    // 1. Récupérer les voyages passés
    let voyageQuery = { date: { $lt: now } };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      voyageQuery.$or = [
        { from: searchRegex },
        { to: searchRegex },
        { 'driver.name': searchRegex },
        { 'driver.numero': searchRegex }
      ];
    }

    const voyages = await Voyage.find(voyageQuery)
      .populate('driver', '-password')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalVoyages = await Voyage.countDocuments(voyageQuery);

    // 2. Récupérer les réservations passées (date du voyage passée)
    let reservationQuery = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      reservationQuery.$or = [
        { 'user.name': searchRegex },
        { 'user.numero': searchRegex },
        { 'user.email': searchRegex },
        { 'voyage.from': searchRegex },
        { 'voyage.to': searchRegex },
        { 'bus.from': searchRegex },
        { 'bus.to': searchRegex }
      ];
    }

    const reservations = await Reservation.find(reservationQuery)
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        match: { date: { $lt: now } },
        populate: { path: 'driver', select: '-password' }
      })
      .populate({
        path: 'bus',
        match: { departureDate: { $lt: now } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filtrer les réservations qui ont des voyages/bus passés
    const filteredReservations = reservations.filter(res =>
      (res.voyage && res.voyage.date && new Date(res.voyage.date) < now) ||
      (res.bus && res.bus.departureDate && new Date(res.bus.departureDate) < now) ||
      (!res.voyage && !res.bus) // colis sans voyage/bus
    );

    const totalReservations = await Reservation.countDocuments(reservationQuery);

    // 3. Récupérer les colis (réservations de type colis)
    let colisQuery = { ticket: 'colis' };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      colisQuery.$or = [
        { 'user.name': searchRegex },
        { 'user.numero': searchRegex },
        { 'user.email': searchRegex },
        { description: searchRegex }
      ];
    }

    const colis = await Colis.find({})
      .populate({
        path: 'reservation',
        populate: [
          { path: 'user', select: '-password' },
          {
            path: 'voyage',
            match: { date: { $lt: now } },
            populate: { path: 'driver', select: '-password' }
          },
          {
            path: 'bus',
            match: { departureDate: { $lt: now } }
          }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filtrer les colis avec réservations passées
    const filteredColis = colis.filter(c =>
      c.reservation && (
        (c.reservation.voyage && new Date(c.reservation.voyage.date) < now) ||
        (c.reservation.bus && new Date(c.reservation.bus.departureDate) < now) ||
        (!c.reservation.voyage && !c.reservation.bus)
      )
    );

    const totalColis = await Colis.countDocuments(colisQuery);

    console.log('📈 Résultats Historique - voyages:', voyages.length, 'reservations:', filteredReservations.length, 'colis:', filteredColis.length);

    res.status(200).json({
      voyages: voyages,
      reservations: filteredReservations,
      colis: filteredColis,
      pagination: {
        current: page,
        pageSize: limit,
        total: totalVoyages + totalReservations + totalColis,
        totalPages: Math.ceil((totalVoyages + totalReservations + totalColis) / limit)
      },
      counts: {
        voyages: totalVoyages,
        reservations: totalReservations,
        colis: totalColis,
        total: totalVoyages + totalReservations + totalColis
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      message: 'Erreur serveur interne',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
      .populate({ path: 'bus', populate: { path: 'owner' } });

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
    const trajet = from && to ? `**${from}** → **${to}**` : 'votre trajet';

    // Notification utilisateur (in-app + push)
    await sendAndSaveNotification(
      req.user._id,
      'Réservation annulée ✓',
      `Votre réservation ${trajet} a été annulée. **${reservation.quantity}** place(s) libérée(s).`,
      { type: 'info', reservationId: reservation._id.toString(), screen: 'tickets' }
    );

    // Notification chauffeur covoiturage (in-app + push)
    if (reservation.voyage?.driver) {
      const driver = reservation.voyage.driver;
      await sendAndSaveNotification(
        driver._id,
        'Annulation de réservation',
        `**${user?.name || 'Un passager'}** a annulé **${reservation.quantity}** place(s) sur ${trajet}.`,
        { type: 'alert', reservationId: reservation._id.toString(), voyageId: reservation.voyage._id.toString() }
      );
    }

    // Notification entreprise (bus) (in-app + push)
    if (reservation.bus?.owner) {
      const ownerId = reservation.bus.owner._id || reservation.bus.owner;
      await sendAndSaveNotification(
        ownerId,
        'Annulation de réservation',
        `**${user?.name || 'Un passager'}** a annulé **${reservation.quantity}** place(s) sur ${trajet}.`,
        { type: 'alert', reservationId: reservation._id.toString(), busId: reservation.bus._id.toString() }
      );
    }

    res.status(200).json({ message: 'Réservation annulée', reservation });
  } catch (err) {
    console.error('Erreur cancelReservation:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// PATCH /reservations/:id/scan — chauffeur scanne le billet d'un client
const scanTicket = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', '-password')
      .populate({ path: 'voyage', populate: { path: 'driver', select: '-password' } })
      .populate('bus');

    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    const clientId = reservation.user?._id || reservation.user;
    const driverId = req.user._id || req.user.id;
    const from = reservation.voyage?.from || reservation.bus?.from || '';
    const to = reservation.voyage?.to || reservation.bus?.to || '';
    const trajet = from && to ? `${from} → ${to}` : 'votre trajet';
    const passengerName = reservation.user?.name || 'Passager';
    const passengerDisplay = `**${passengerName}**`;
    const reservationId = reservation._id.toString();

    // 0. Vérification de propriété via requête DB directe (fiable même si le populate échoue)
    let isOwner = false;
    if (reservation.voyage) {
      const voyageId = reservation.voyage._id || reservation.voyage;
      const ownedVoyage = await Voyage.findOne({ _id: voyageId, driver: driverId });
      isOwner = !!ownedVoyage;
    }
    if (!isOwner && reservation.bus) {
      const busId = reservation.bus._id || reservation.bus;
      const ownedBus = await Bus.findOne({ _id: busId, owner: driverId });
      isOwner = !!ownedBus;
    }
    if (!isOwner) {
      return res.status(403).json({ message: 'Ticket invalide — ce billet ne correspond pas à vos trajets', reason: 'invalid' });
    }

    // 1. Ticket annulé
    if (reservation.status === 'annulé') {
      await sendAndSaveNotification(
        driverId,
        'Billet annulé ⚠️',
        `Le billet de ${passengerDisplay} (${trajet}) a été annulé.`,
        { type: 'alert', reservationId, screen: 'voyages' }
      );
      return res.status(400).json({ message: 'Billet annulé', reason: 'cancelled' });
    }

    // 2. Billet déjà scanné
    if (reservation.scannedAt) {
      return res.status(400).json({ message: 'Ce billet a déjà été scanné', reason: 'already_scanned' });
    }

    // 3. Voyage déjà passé
    const voyageDate = reservation.voyage?.date || reservation.bus?.departureDate;
    if (voyageDate && new Date(voyageDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
      await sendAndSaveNotification(
        driverId,
        'Voyage déjà passé ⚠️',
        `Ce billet concerne un voyage passé : ${trajet}.`,
        { type: 'alert', reservationId, screen: 'voyages' }
      );
      return res.status(400).json({ message: 'Ce voyage est déjà passé', reason: 'expired' });
    }

    // 4. Billet valide → marquer comme scanné
    await Reservation.findByIdAndUpdate(reservation._id, { scannedAt: new Date() });

    await sendAndSaveNotification(
      clientId,
      'Billet vérifié ✓',
      `Votre billet ${trajet} a été scanné par le chauffeur. Bon voyage !`,
      { type: 'success', reservationId, screen: 'tickets' }
    );

    await sendAndSaveNotification(
      driverId,
      'Billet valide ✓',
      `Billet de ${passengerDisplay} — ${trajet} validé avec succès.`,
      { type: 'success', reservationId, screen: 'voyages' }
    );

    res.status(200).json({ message: 'Billet valide', reason: 'valid' });
  } catch (err) {
    console.error('Erreur scanTicket:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { createReservation, getAllReservations, getHistorique, getReservationById, updateReservation, deleteReservation, cancelReservation, scanTicket };