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
    const now = new Date();
    const voyages = await Voyage.find({ date: { $gt: now } })
      .populate({ path: 'driver', select: '-password' })
      .sort({ date: 1 });
    res.status(200).json(voyages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getAllVoyageIncludingExpired = async (req, res) => {
  try {
    console.log('🔍 Backend getAllVoyageIncludingExpired - req.query:', req.query);
    console.log('🔍 Backend getAllVoyageIncludingExpired - req.url:', req.url);
    console.log('🔍 Backend getAllVoyageIncludingExpired - req.method:', req.method);
    
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const from   = req.query.from || '';
    const to     = req.query.to || '';
    const driverId = req.query.driverId || '';

    console.log('📊 Pagination Voyages - page:', page, 'limit:', limit, 'skip:', skip);

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
    
    // Filtrer par ville de départ
    if (from) {
      voyageQuery.from = from;
    }
    
    // Filtrer par ville d'arrivée
    if (to) {
      voyageQuery.to = to;
    }
    
    // Filtrer par chauffeur
    if (driverId) {
      voyageQuery.driver = driverId;
    }

    console.log('🔎 Recherche Voyages avec filter:', voyageQuery);
    
    // Compter le total des voyages pour la pagination
    console.log('🔍 Comptage des voyages...');
    const total = await Voyage.countDocuments(voyageQuery);
    console.log('🔍 Total voyages trouvés:', total);
    
    // Récupérer les voyages avec pagination
    console.log('🔍 Récupération des voyages avec pagination...');
    const voyages = await Voyage.find(voyageQuery)
      .populate('driver', '-password')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📈 Résultats Voyages - voyages.length:', voyages.length, 'total:', total);
    console.log('📈 Premier voyage trouvé:', voyages[0]);
    
    // Retourner les résultats avec pagination
    const response = {
      voyages: voyages,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('📤 Réponse Voyages envoyée:', {
      voyagesCount: voyages.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

    console.log('📤 Structure de la réponse:', {
      hasVoyages: Array.isArray(response.voyages),
      voyagesLength: response.voyages.length,
      hasPagination: !!response.pagination,
      paginationKeys: Object.keys(response.pagination)
    });

    res.status(200).json(response);
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

    if (updates.status === 'STARTED' && voyage.status !== 'STARTED') {
      const reservations = await Reservation.find({ voyage: voyageId, status: 'confirmé' });
      const userIds = reservations.map(r => r.user);
      if (userIds.length > 0) {
        await sendAndSaveNotification(
          userIds,
          'Voyage démarré',
          `Le chauffeur a démarré le voyage ${voyage.from} → ${voyage.to}`,
          { type: 'TRIP_STARTED', voyageId }
        );
      }
    }

    if (updates.currentClient && String(updates.currentClient) !== String(voyage.currentClient)) {
      await sendAndSaveNotification(
        updates.currentClient,
        'Le chauffeur arrive',
        'Le chauffeur se dirige vers votre position',
        { type: 'DRIVER_ON_THE_WAY', voyageId }
      );
    }

    const dateChanged = updates.date && new Date(updates.date).getTime() !== new Date(voyage.date).getTime();
    if (dateChanged) {
      const reservations = await Reservation.find({ voyage: voyageId, status: 'confirmé' });
      const userIds = reservations.map(r => r.user);
      if (userIds.length > 0) {
        await sendAndSaveNotification(
          userIds,
          'Modification de votre voyage',
          `La date de votre voyage ${voyage.from} → ${voyage.to} a été modifiée au ${new Date(updates.date).toLocaleDateString('fr-FR')}`,
          { type: 'TRIP_MODIFIED', voyageId }
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
    const voyage = await Voyage.create({ driver: req.user._id, from, to, date, price, totalSeats: totalSeats || driver.capacity });
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
    const userIds = reservations.map(r => r.user).filter(Boolean);
    if (userIds.length > 0) {
      const changes = [];
      if (updateData.date && new Date(updateData.date).getTime() !== new Date(oldVoyage.date).getTime()) {
        changes.push(`date: ${new Date(updateData.date).toLocaleDateString('fr-FR')}`);
      }
      if (updateData.price !== undefined && updateData.price !== oldVoyage.price) {
        changes.push(`prix: ${updateData.price} FCFA`);
      }
      if (updateData.from && updateData.from !== oldVoyage.from) changes.push(`départ: ${updateData.from}`);
      if (updateData.to && updateData.to !== oldVoyage.to) changes.push(`destination: ${updateData.to}`);
      if (changes.length > 0) {
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
