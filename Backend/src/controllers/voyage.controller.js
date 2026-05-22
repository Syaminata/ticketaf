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
      totalSeats: voyage.totalSeats,
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

    // Détection de tous les changements
    const dateChanged = updates.date && new Date(updates.date).getTime() !== new Date(voyage.date).getTime();
    const priceChanged = updates.price !== undefined && Number(updates.price) !== Number(voyage.price);
    const fromChanged = updates.from && updates.from !== voyage.from;
    const toChanged = updates.to && updates.to !== voyage.to;
    const totalSeatsChanged = updates.totalSeats !== undefined && Number(updates.totalSeats) !== Number(voyage.totalSeats);
    const availSeatsChanged = updates.availableSeats !== undefined && Number(updates.availableSeats) !== Number(voyage.availableSeats);
    const wifiChanged = updates.wifi !== undefined && updates.wifi !== voyage.wifi;
    const climChanged = updates.climatisation !== undefined && updates.climatisation !== voyage.climatisation;

    // Notifications clients — une seule notification consolidée (sauf date et prix : messages spéciaux)
    if (dateChanged) {
      const oldD = new Date(voyage.date);
      const newD = new Date(updates.date);

      const oldDateStr = oldD.toLocaleDateString('fr-FR');
      const oldTimeStr = oldD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const newDateStr = newD.toLocaleDateString('fr-FR');
      const newTimeStr = newD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      const userIds = await getConfirmedUserIds();
      if (userIds.length > 0) {
        await sendAndSaveNotification(
          userIds,
          'Horaire de voyage modifié',
          `Votre voyage ${voyage.from} → ${voyage.to} initialement prévu le ${oldDateStr} à ${oldTimeStr} a été modifié. Il aura désormais lieu le ${newDateStr} à ${newTimeStr}. Veuillez nous excuser pour ce changement.`,
          { type: 'TRIP_MODIFIED', voyageId: voyageId.toString() }
        );
      }
    }

    const clientChanges = [];
    if (fromChanged || toChanged) clientChanges.push(`trajet : ${updates.from || voyage.from} → ${updates.to || voyage.to}`);
    if (wifiChanged) clientChanges.push(`WiFi : ${updates.wifi ? 'disponible' : 'indisponible'}`);
    if (climChanged) clientChanges.push(`climatisation : ${updates.climatisation ? 'disponible' : 'indisponible'}`);

    if (clientChanges.length > 0) {
      const userIds = await getConfirmedUserIds();
      if (userIds.length > 0) {
        await sendAndSaveNotification(
          userIds,
          'Voyage modifié',
          `Votre voyage ${voyage.from} → ${voyage.to} a été modifié : ${clientChanges.join(', ')}.`,
          { type: 'TRIP_MODIFIED', voyageId: voyageId.toString() }
        );
      }
    }

    // Prix modifié — notification séparée (lockedPrice préservé)
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

    const updatedVoyage = await Voyage.findByIdAndUpdate(voyageId, updates, { new: true })
      .populate('driver', '-password');

    // Notifier le chauffeur de la confirmation de modification
    const driverChanges = [];
    if (dateChanged) {
      const newD = new Date(updates.date);
      const dateStr = newD.toLocaleDateString('fr-FR');
      const timeStr = newD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      driverChanges.push(`nouvelle date le ${dateStr} à ${timeStr}`);
    }
    if (priceChanged) driverChanges.push(`nouveau prix : ${updates.price} FCFA`);
    if (fromChanged || toChanged) driverChanges.push(`nouveau trajet : ${updatedVoyage.from} → ${updatedVoyage.to}`);
    if (totalSeatsChanged || availSeatsChanged) driverChanges.push(`places mises à jour`);

    const finalMsg = driverChanges.length > 0
      ? `Votre voyage ${voyage.from} → ${voyage.to} a été mis à jour : ${driverChanges.join(', ')}.`
      : `Votre voyage ${voyage.from} → ${voyage.to} a été mis à jour avec succès.`;

    await sendAndSaveNotification(
      voyage.driver,
      'Modification confirmée ✓',
      finalMsg,
      { type: 'info', voyageId: voyageId.toString(), screen: 'voyages' }
    ).catch(err => console.error('Erreur notification chauffeur:', err));

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
    const isOwner = String(voyage.driver) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const trajet = `${voyage.from} → ${voyage.to}`;
    const dateStr = new Date(voyage.date).toLocaleDateString('fr-FR');

    // Récupérer les clients ayant une réservation confirmée
    const reservations = await Reservation.find({ voyage: voyage._id, status: 'confirmé' });
    const clientIds = reservations.map(r => r.user).filter(Boolean);

    if (isAdmin) {
      // Notifier le chauffeur
      sendAndSaveNotification(
        voyage.driver,
        'Voyage annulé',
        `Votre voyage ${trajet} du ${dateStr} a été annulé par un administrateur.`,
        { type: 'warning', screen: 'trips' }
      ).catch(() => {});
    }

    if (isOwner) {
      // Confirmation de suppression au chauffeur lui-même
      sendAndSaveNotification(
        voyage.driver,
        'Voyage supprimé',
        `Votre voyage ${trajet} du ${dateStr} a été supprimé.`,
        { type: 'info', screen: 'trips' }
      ).catch(() => {});
    }

    // Notifier les clients dans tous les cas (admin ou chauffeur qui supprime)
    if (clientIds.length > 0) {
      const msgClient = isAdmin
        ? `Le voyage ${trajet} du ${dateStr} a été annulé par l'administrateur.`
        : `Le chauffeur a annulé le voyage ${trajet} du ${dateStr}.`;
      sendAndSaveNotification(
        clientIds,
        'Voyage annulé',
        msgClient,
        { type: 'warning', screen: 'tickets' }
      ).catch(() => {});
    }

    await Voyage.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Voyage supprimé' });
  } catch (err) {
    console.error('[VOYAGE_DELETE] Erreur:', err.message);
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
    if (!driver || !driver.isActive) return res.status(403).json({ message: 'Votre compte est désactivé.' });
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
    const allowedFields = ['from', 'to', 'date', 'price', 'totalSeats', 'availableSeats', 'climatisation', 'wifi'];
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

    // Notifier les passagers confirmés des changements (uniquement les champs réellement changés)
    const reservations = await Reservation.find({ voyage: voyage._id, status: 'confirmé' });
    const priceChanged = updateData.price !== undefined && Number(updateData.price) !== Number(oldVoyage.price);
    const dateChanged = updateData.date && new Date(updateData.date).getTime() !== new Date(oldVoyage.date).getTime();
    const fromChanged = updateData.from && updateData.from !== oldVoyage.from;
    const toChanged = updateData.to && updateData.to !== oldVoyage.to;
    const totalSeatsChanged = updateData.totalSeats !== undefined && Number(updateData.totalSeats) !== Number(oldVoyage.totalSeats);
    const availSeatsChanged = updateData.availableSeats !== undefined && Number(updateData.availableSeats) !== Number(oldVoyage.availableSeats);
    const wifiChanged = updateData.wifi !== undefined && updateData.wifi !== oldVoyage.wifi;
    const climChanged = updateData.climatisation !== undefined && updateData.climatisation !== oldVoyage.climatisation;

    if (reservations.length > 0) {
      const passengerChanges = [];

      // Notification spécifique pour le changement de DATE/HEURE
      if (dateChanged) {
        const oldD = new Date(oldVoyage.date);
        const newD = new Date(updateData.date);

        const oldDateStr = oldD.toLocaleDateString('fr-FR');
        const oldTimeStr = oldD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const newDateStr = newD.toLocaleDateString('fr-FR');
        const newTimeStr = newD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const userIds = reservations.map(r => r.user).filter(Boolean);
        if (userIds.length > 0) {
          await sendAndSaveNotification(
            userIds,
            'Horaire de voyage modifié',
            `Votre voyage ${oldVoyage.from} → ${oldVoyage.to} initialement prévu le ${oldDateStr} à ${oldTimeStr} a été modifié. Il aura désormais lieu le ${newDateStr} à ${newTimeStr}.`,
            { type: 'TRIP_MODIFIED', voyageId: voyage._id.toString(), screen: 'voyages' }
          );
        }
      }

      if (fromChanged) passengerChanges.push(`départ : ${updateData.from}`);
      if (toChanged) passengerChanges.push(`destination : ${updateData.to}`);

      if (totalSeatsChanged || availSeatsChanged) {
        const total = updateData.totalSeats !== undefined ? updateData.totalSeats : voyage.totalSeats;
        const avail = updateData.availableSeats !== undefined ? updateData.availableSeats : voyage.availableSeats;
        const s = avail > 1 ? 's' : '';
        passengerChanges.push(`places : ${total} totales, ${avail} disponible${s}`);
      }

      if (wifiChanged) passengerChanges.push(`WiFi : ${updateData.wifi ? 'disponible' : 'indisponible'}`);
      if (climChanged) passengerChanges.push(`climatisation : ${updateData.climatisation ? 'disponible' : 'indisponible'}`);

      if (passengerChanges.length > 0) {
        const userIds = reservations.map(r => r.user).filter(Boolean);
        if (userIds.length > 0) {
          await sendAndSaveNotification(
            userIds,
            'Voyage modifié',
            `Votre voyage ${oldVoyage.from} → ${oldVoyage.to} a été modifié : ${passengerChanges.join(', ')}.`,
            { type: 'TRIP_MODIFIED', voyageId: voyage._id.toString(), screen: 'voyages' }
          );
        }
      }

      // Prix changé → chaque client est notifié avec son prix verrouillé personnel
      if (priceChanged) {
        for (const reservation of reservations) {
          if (!reservation.user) continue;
          const locked = reservation.lockedPrice || oldVoyage.price;
          await sendAndSaveNotification(
            reservation.user,
            'Prix du voyage modifié',
            `Le nouveau prix du trajet ${oldVoyage.from} → ${oldVoyage.to} est ${updateData.price} FCFA. Votre réservation garde le prix initial de ${locked} FCFA.`,
            { type: 'info', voyageId: voyage._id.toString(), screen: 'voyages' }
          );
        }
      }
    }

    // Notifier le chauffeur lui-même de sa modification
    const driverSummary = [];
    if (dateChanged) {
      const newD = new Date(updateData.date);
      const dateStr = newD.toLocaleDateString('fr-FR');
      const timeStr = newD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      driverSummary.push(`date le ${dateStr} à ${timeStr}`);
    }
    if (priceChanged) driverSummary.push(`nouveau prix : ${updateData.price} FCFA`);
    if (fromChanged || toChanged) driverSummary.push(`trajet : ${voyage.from} → ${voyage.to}`);

    if (totalSeatsChanged || availSeatsChanged) {
      const total = updateData.totalSeats !== undefined ? updateData.totalSeats : voyage.totalSeats;
      const avail = updateData.availableSeats !== undefined ? updateData.availableSeats : voyage.availableSeats;
      const s = avail > 1 ? 's' : '';
      driverSummary.push(`places : ${total} totales, ${avail} disponible${s}`);
    }

    if (wifiChanged) driverSummary.push(`WiFi : ${updateData.wifi ? 'activé' : 'désactivé'}`);
    if (climChanged) driverSummary.push(`climatisation : ${updateData.climatisation ? 'activée' : 'désactivée'}`);

    const finalDriverMsg = driverSummary.length > 0
      ? `Votre trajet ${oldVoyage.from} → ${oldVoyage.to} a été mis à jour : ${driverSummary.join(', ')}.`
      : `Votre trajet ${oldVoyage.from} → ${oldVoyage.to} a été mis à jour avec succès.`;

    await sendAndSaveNotification(
      req.user._id,
      'Modification enregistrée ✓',
      finalDriverMsg,
      { type: 'info', voyageId: voyage._id.toString(), screen: 'voyages' }
    ).catch(err => console.error('Erreur notification chauffeur (me):', err));

    res.status(200).json({ message: 'Succès', voyage });
  } catch (err) {
    console.error('[VOYAGE_UPDATE_DRIVER] Erreur:', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { createVoyage, getAllVoyage, getAllVoyageIncludingExpired, getVoyageById, updateVoyage, deleteVoyage, searchVoyages, getMyVoyages, createVoyageByDriver, updateMyVoyage };
