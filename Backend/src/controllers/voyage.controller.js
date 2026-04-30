const Voyage = require('../models/voyage.model');
const Reservation = require('../models/reservation.model');
const Driver = require('../models/driver.model');
const User = require('../models/user.model');
const { sendAndSaveNotification, cleanupInvalidTokens } = require('../services/notification.service');

const createVoyage = async (req, res) => {
  try {
    const { driverId, from, to, date, price, totalSeats } = req.body;
    if (!driverId || !from || !to || !date || !price) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    const driver = await Driver.findOne({ _id: driverId, isActive: true });
    if (!driver) return res.status(403).json({ message: 'Conducteur inactif' });

    const seats = totalSeats || driver.capacity || 4;
    const voyage = await Voyage.create({
      driver: driver._id, from, to, date, price, totalSeats: seats, availableSeats: seats
    });

    const populatedVoyage = await Voyage.findById(voyage._id).populate('driver', '-password');
    res.status(201).json({ message: 'Voyage créé', voyage: populatedVoyage });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getAllVoyage = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const from    = req.query.from || '';
    const to      = req.query.to || '';

    console.log('📊 Pagination Voyages - page:', page, 'limit:', limit, 'skip:', skip);
    console.log('🔍 Filtres reçus - search:', search, 'from:', from, 'to:', to);

    // Construire la requête de base
    let voyageQuery = {};
    
    // Ajouter la recherche si fournie
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      voyageQuery.$or = [
        { from: searchRegex },
        { to: searchRegex },
        { 'driver.name': searchRegex },
        { 'driver.numero': searchRegex }
      ];
    }
    
    // Filtrer par itinéraire si spécifié
    if (from) {
      voyageQuery.from = new RegExp(`^${from}$`, 'i');
    }
    if (to) {
      voyageQuery.to = new RegExp(`^${to}$`, 'i');
    }

    console.log('🔎 Recherche Voyages avec filter:', voyageQuery);
    
    // Compter le total des voyages pour la pagination
    const total = await Voyage.countDocuments(voyageQuery);
    
    // Récupérer les voyages avec pagination
    const voyages = await Voyage.find(voyageQuery)
      .populate({ path: 'driver', select: '-password' })
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    console.log('📈 Résultats Voyages - voyages.length:', voyages.length, 'total:', total);

    res.status(200).json({
      voyages: voyages,
      pagination: {
        current: page,
        pageSize: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des voyages:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
};

const getAllVoyageIncludingExpired = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    console.log('📊 Pagination Voyages Including Expired - page:', page, 'limit:', limit, 'skip:', skip);

    // Construire la requête de base
    let voyageQuery = {};
    
    // Ajouter la recherche si fournie
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      voyageQuery.$or = [
        { from: searchRegex },
        { to: searchRegex },
        { 'driver.name': searchRegex },
        { 'driver.numero': searchRegex }
      ];
    }
    
    console.log('🔎 Recherche Voyages Including Expired avec filter:', voyageQuery);
    
    // Compter le total des voyages pour la pagination
    const total = await Voyage.countDocuments(voyageQuery);
    
    // Récupérer les voyages avec pagination
    const voyages = await Voyage.find(voyageQuery)
      .populate('driver', '-password')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    console.log('📈 Résultats Voyages Including Expired - voyages.length:', voyages.length, 'total:', total);

    res.status(200).json({
      voyages: voyages,
      pagination: {
        current: page,
        pageSize: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Erreur getAllVoyageIncludingExpired:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateVoyage = async (req, res) => {
  try {
    const voyageId = req.params.id;
    const updates = req.body;
    const voyage = await Voyage.findById(voyageId);
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });

    // Récupérer une seule fois les réservations confirmées (utilisé par plusieurs blocs)
    const getConfirmedUserIds = async () => {
      const reservations = await Reservation.find({ voyage: voyageId, status: 'confirmé' });
      return reservations.map(r => r.user);
    };

    // Voyage démarré
    if (updates.status === 'STARTED' && voyage.status !== 'STARTED') {
      const userIds = await getConfirmedUserIds();
      if (userIds.length > 0) {
        await sendAndSaveNotification(
          userIds,
          'Voyage démarré',
          `Le chauffeur a démarré le voyage ${voyage.from} → ${voyage.to}`,
          { type: 'TRIP_STARTED', voyageId: voyageId.toString() }
        );
      }
    }

    // Chauffeur en route vers un client
    if (updates.currentClient && String(updates.currentClient) !== String(voyage.currentClient)) {
      await sendAndSaveNotification(
        updates.currentClient,
        'Le chauffeur arrive',
        'Le chauffeur se dirige vers votre position',
        { type: 'DRIVER_ON_THE_WAY', voyageId: voyageId.toString() }
      );
    }

    // Date modifiée
    const dateChanged = updates.date && new Date(updates.date).getTime() !== new Date(voyage.date).getTime();
    if (dateChanged) {
      const userIds = await getConfirmedUserIds();
      if (userIds.length > 0) {
        await sendAndSaveNotification(
          userIds,
          'Date de voyage modifiée',
          `La date de votre voyage ${voyage.from} → ${voyage.to} a changé : ${new Date(updates.date).toLocaleDateString('fr-FR')}`,
          { type: 'TRIP_MODIFIED', voyageId: voyageId.toString() }
        );
      }
    }

    // Prix modifié — le prix verrouillé (lockedPrice) des réservations existantes n'est PAS modifié
    const priceChanged = updates.price !== undefined && Number(updates.price) !== Number(voyage.price);
    if (priceChanged) {
      const userIds = await getConfirmedUserIds();
      if (userIds.length > 0) {
        await sendAndSaveNotification(
          userIds,
          'Prix du voyage modifié',
          `Le prix du trajet ${voyage.from} → ${voyage.to} est maintenant de ${updates.price} FCFA. Votre réservation conserve le prix initial de ${voyage.price} FCFA.`,
          { type: 'info', voyageId: voyageId.toString() }
        );
      }
    }

    // Trajet modifié (départ ou destination)
    const fromChanged = updates.from && updates.from !== voyage.from;
    const toChanged = updates.to && updates.to !== voyage.to;
    if ((fromChanged || toChanged) && !dateChanged) {
      const userIds = await getConfirmedUserIds();
      if (userIds.length > 0) {
        const newFrom = updates.from || voyage.from;
        const newTo = updates.to || voyage.to;
        await sendAndSaveNotification(
          userIds,
          'Trajet modifié',
          `Votre voyage a été modifié : ${newFrom} → ${newTo}`,
          { type: 'TRIP_MODIFIED', voyageId: voyageId.toString() }
        );
      }
    }

    const updatedVoyage = await Voyage.findByIdAndUpdate(voyageId, updates, { new: true })
      .populate('driver', '-password');
    res.status(200).json({ message: 'Trajet mis à jour', voyage: updatedVoyage });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getVoyageById = async (req, res) => {
  try {
    const voyage = await Voyage.findById(req.params.id).populate('driver', '-password');
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    res.status(200).json(voyage);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deleteVoyage = async (req, res) => {
  try {
    const voyage = await Voyage.findById(req.params.id);
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = req.user.role === 'conducteur' && String(voyage.driver) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    await Voyage.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Voyage supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const searchVoyages = async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const now = new Date();
    const query = {};
    if (from) query.from = { $regex: from, $options: 'i' };
    if (to) query.to = { $regex: to, $options: 'i' };
    if (date) {
      const d = new Date(date);
      // Only show the requested date if it's today or in the future
      const start = d > now ? d : now;
      query.date = { $gte: start, $lt: new Date(d.getTime() + 86400000) };
    } else {
      query.date = { $gt: now };
    }
    const voyages = await Voyage.find(query).populate('driver', '-password');
    res.json(voyages);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getMyVoyages = async (req, res) => {
  try {
    const voyages = await Voyage.find({ driver: req.user._id }).populate('driver', '-password').sort({ date: -1 });
    res.status(200).json(voyages);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const createVoyageByDriver = async (req, res) => {
  try {
    const { from, to, date, price, totalSeats } = req.body;
    const driver = await Driver.findById(req.user._id);
    if (!driver || !driver.isActive) return res.status(403).json({ message: 'Inactif' });
    const seats = totalSeats || driver.capacity;
    const voyage = await Voyage.create({ driver: req.user._id, from, to, date, price, totalSeats: seats, availableSeats: seats });
    res.status(201).json({ message: 'Succès', voyage });
  } catch (err) {
    res.status(500).json({ message: 'Erreur' });
  }
};

const updateMyVoyage = async (req, res) => {
  try {
    const allowedFields = ['from', 'to', 'date', 'price', 'totalSeats'];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    const oldVoyage = await Voyage.findOne({ _id: req.params.id, driver: req.user._id });
    if (!oldVoyage) return res.status(404).json({ message: 'Voyage non trouvé ou non autorisé' });

    const voyage = await Voyage.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Notifier les passagers confirmés des changements
    const reservations = await Reservation.find({ voyage: voyage._id, status: 'confirmé' });
    const priceChanged = updateData.price !== undefined && Number(updateData.price) !== Number(oldVoyage.price);

    if (reservations.length > 0) {
      const changes = [];
      if (updateData.date && new Date(updateData.date).getTime() !== new Date(oldVoyage.date).getTime()) {
        changes.push(`date: ${new Date(updateData.date).toLocaleDateString('fr-FR')}`);
      }
      if (updateData.from && updateData.from !== oldVoyage.from) changes.push(`départ: ${updateData.from}`);
      if (updateData.to && updateData.to !== oldVoyage.to) changes.push(`destination: ${updateData.to}`);

      // Prix changé → chaque client est notifié avec son prix verrouillé personnel
      if (priceChanged) {
        for (const reservation of reservations) {
          if (!reservation.user) continue;
          const locked = reservation.lockedPrice || oldVoyage.price;
          await sendAndSaveNotification(
            reservation.user,
            'Prix du voyage modifié',
            `Le nouveau prix du trajet ${oldVoyage.from} → ${oldVoyage.to} est ${updateData.price} FCFA. Votre réservation garde le prix que vous avez payé : ${locked} FCFA.`,
            { type: 'info', voyageId: voyage._id.toString(), screen: 'voyages' }
          );
        }
      }

      // Autres changements (date, trajet) → notification groupée
      if (changes.length > 0) {
        const userIds = reservations.map(r => r.user).filter(Boolean);
        await sendAndSaveNotification(
          userIds,
          'Voyage modifié',
          `Votre voyage ${oldVoyage.from} → ${oldVoyage.to} a été modifié: ${changes.join(', ')}`,
          { type: 'TRIP_MODIFIED', voyageId: voyage._id.toString(), screen: 'voyages' }
        );
      }
    }

    res.status(200).json({ message: 'Succès', voyage });
  } catch (err) {
    res.status(500).json({ message: 'Erreur' });
  }
};

module.exports = { createVoyage, getAllVoyage, getAllVoyageIncludingExpired, getVoyageById, updateVoyage, deleteVoyage, searchVoyages, getMyVoyages, createVoyageByDriver, updateMyVoyage };