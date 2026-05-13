const Voyage = require('../models/voyage.model');
const Reservation = require('../models/reservation.model');
const Driver = require('../models/driver.model');
const User = require('../models/user.model');
const { sendAndSaveNotification, cleanupInvalidTokens } = require('../services/notification.service');

const createVoyage = async (req, res) => {
  try {
    const { driverId, from, to, date, price, totalSeats, climatisation, wifi } = req.body;
    if (!driverId || !from || !to || !date || !price) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    const driver = await Driver.findOne({ _id: driverId, isActive: true });
    if (!driver) return res.status(403).json({ message: 'Conducteur inactif' });

    const seats = totalSeats || driver.capacity || 4;
    const voyage = await Voyage.create({
      driver: driver._id,
      from,
      to,
      date,
      price,
      totalSeats: seats,
      availableSeats: seats,
      climatisation: climatisation === true || climatisation === 'true',
      wifi: wifi === true || wifi === 'true'
    });

    const populatedVoyage = await Voyage.findById(voyage._id).populate('driver', '-password');
    res.status(201).json({ message: 'Voyage créé', voyage: populatedVoyage });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getAllVoyage = async (req, res) => {
  try {
    //  Détecter si pagination (web)
    const hasPagination = req.query.page || req.query.limit;

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = hasPagination
      ? Math.min(50, parseInt(req.query.limit) || 10)
      : null;

    const skip = hasPagination ? (page - 1) * limit : 0;

    const search = req.query.search?.trim() || '';
    const from   = req.query.from || '';
    const to     = req.query.to || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    console.log('📊 hasPagination:', hasPagination);
    console.log('📊 page:', page, 'limit:', limit, 'skip:', skip);
    console.log('🔍 Filtres dates - startDate:', startDate, 'endDate:', endDate);

    // 🕒 Date actuelle (avec heure)
    const now = new Date();

    // 🎯 Base query → voyages futurs uniquement
    let voyageQuery = {
      date: { $gte: now }
    };

    // 📅 Filtre par plage de dates
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        // Inclure toute la journée de fin
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDateTime;
      }
      
      // Combiner avec le filtre de date existant
      voyageQuery.date = {
        ...voyageQuery.date,
        ...dateFilter
      };
      
      console.log('📅 Filtre date appliqué:', voyageQuery.date);
    }

    //  Recherche simple
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      voyageQuery.$or = [
        { from: searchRegex },
        { to: searchRegex }
      ];
    }

    //  Filtres précis
    if (from) {
      voyageQuery.from = new RegExp(`^${from}$`, 'i');
    }
    if (to) {
      voyageQuery.to = new RegExp(`^${to}$`, 'i');
    }

    console.log('🔎 Query:', voyageQuery);

    const total = await Voyage.countDocuments(voyageQuery);

    //  Construction dynamique de la requête
    let query = Voyage.find(voyageQuery)
      .populate({ path: 'driver', select: '-password' })
      .sort({ date: 1 }); // du plus proche au plus loin

    //  Pagination uniquement pour le web
    if (hasPagination) {
      query = query.skip(skip).limit(limit);
    }

    const voyages = await query;


    //  MOBILE → liste simple
    if (!hasPagination) {
      return res.status(200).json(voyages);
    }

    //  WEB → pagination complète
    res.status(200).json({
      voyages,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur getAllVoyage:', error);
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

const getVoyageById = async (req, res) => {
  try {
    const voyage = await Voyage.findById(req.params.id)
      .populate({ path: 'driver', select: '-password' });
    
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    
    // Ajouter les réservations associées pour plus de détails
    const reservations = await require('../models/reservation.model').find({ 
      voyage: req.params.id, 
      status: { $ne: 'annulé' } 
    })
      .populate('user', 'name email numero')
      .select('user quantity status createdAt');

    res.status(200).json({
      ...voyage.toObject(),
      driver: voyage.driver,
      reservations: reservations,
      totalReservations: reservations.length,
      availableSeats: voyage.availableSeats,
      totalSeats: voyage.capacity || reservations.reduce((sum, r) => sum + r.quantity, 0) + voyage.availableSeats
    });
  } catch (err) {
    console.error('Erreur getVoyageById:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateVoyage = async (req, res) => {
  try {
    const voyageId = req.params.id;
    const updates = req.body;

    if (updates.climatisation !== undefined) {
      updates.climatisation = updates.climatisation === true || updates.climatisation === 'true';
    }
    if (updates.wifi !== undefined) {
      updates.wifi = updates.wifi === true || updates.wifi === 'true';
    }

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

    // Date/heure modifiée
    const dateChanged = updates.date && new Date(updates.date).getTime() !== new Date(voyage.date).getTime();
    if (dateChanged) {
      const userIds = await getConfirmedUserIds();
      if (userIds.length > 0) {
        const newDate = new Date(updates.date);
        const dateStr = newDate.toLocaleDateString('fr-FR');
        const timeStr = newDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        await sendAndSaveNotification(
          userIds,
          'Horaire de voyage modifié',
          `Votre voyage ${voyage.from} → ${voyage.to} a été reprogrammé au ${dateStr} à ${timeStr}.`,
          { type: 'TRIP_MODIFIED', voyageId: voyageId.toString() }
        );
      }
    }

    // Places disponibles modifiées
    const seatsChanged = updates.availableSeats !== undefined && Number(updates.availableSeats) !== Number(voyage.availableSeats);
    if (seatsChanged) {
      const userIds = await getConfirmedUserIds();
      if (userIds.length > 0) {
        await sendAndSaveNotification(
          userIds,
          'Places disponibles modifiées',
          `Le voyage ${voyage.from} → ${voyage.to} dispose maintenant de ${updates.availableSeats} place(s) disponible(s).`,
          { type: 'info', voyageId: voyageId.toString() }
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
    console.error('Erreur updateVoyage:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
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
    // Notifier le chauffeur si c'est un admin qui supprime
    if (isAdmin) {
      const trajet = `${voyage.from} → ${voyage.to}`;
      sendAndSaveNotification(
        voyage.driver,
        'Voyage annulé',
        `Votre voyage ${trajet} a été annulé par un administrateur.`,
        { type: 'warning', screen: 'trips' }
      ).catch(() => {});
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
    const { from, to, date, price, totalSeats, climatisation, wifi } = req.body;
    const driver = await Driver.findById(req.user._id);
    if (!driver || !driver.isActive) return res.status(403).json({ message: 'Votre compte est désactivé' });
    const seats = totalSeats || driver.capacity;
    console.log(`[VOYAGE_CREATE] Driver ${driver._id} creating voyage with clim=${climatisation}, wifi=${wifi}`);

    const voyage = await Voyage.create({
      driver: driver._id,
      from,
      to,
      date: date,
      price,
      totalSeats: seats,
      availableSeats: seats,
      climatisation: climatisation === true || climatisation === 'true',
      wifi: wifi === true || wifi === 'true'
    });
    res.status(201).json({ message: 'Succès', voyage });
  } catch (err) {
    console.error('[VOYAGE_CREATE_DRIVER] Erreur:', err.message, err.stack);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateMyVoyage = async (req, res) => {
  try {
    const allowedFields = ['from', 'to', 'date', 'price', 'totalSeats', 'climatisation', 'wifi'];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );
    
    if (updateData.climatisation !== undefined) {
      updateData.climatisation = updateData.climatisation === true || updateData.climatisation === 'true';
    }
    if (updateData.wifi !== undefined) {
      updateData.wifi = updateData.wifi === true || updateData.wifi === 'true';
    }

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