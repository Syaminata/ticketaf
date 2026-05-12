const Bus = require('../models/bus.model');
const Reservation = require('../models/reservation.model');
const { sendAndSaveNotification } = require('../services/notification.service');

const createBus = async (req, res) => {
  try {
    if (!['entreprise', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    if (req.user.role === 'entreprise') {
      const User = require('../models/user.model');
      const owner = await User.findById(req.user._id);
      if (!owner || !owner.isActive) {
        return res.status(403).json({ message: 'Votre compte doit être activé par un administrateur avant de pouvoir créer des bus.' });
      }
    }

    const { name, plateNumber, capacity, from, to, departureDate, price, climatisation, wifi  } = req.body;
    const existingBus = await Bus.findOne({ plateNumber });
    if (existingBus) return res.status(400).json({ message: 'Numéro de plaque déjà utilisé' });

    const busData = {
      name, plateNumber, capacity,
      availableSeats: capacity,
      from, to,
      departureDate: new Date(departureDate),
      price,
      climatisation: climatisation === true || climatisation === 'true',
      wifi: wifi === true || wifi === 'true',
      isActive: true
    };

    if (req.user.role === 'entreprise') busData.owner = req.user._id;
    else if (req.body.owner) busData.owner = req.body.owner;

    const bus = await Bus.create(busData);
    res.status(201).json({ message: 'Bus créé', bus });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getAllBuses = async (req, res) => {
  try {
    const search = req.query.search?.trim() || '';
    const from = req.query.from || '';
    const to = req.query.to || '';
    const date  = req.query;

    let busQuery = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      busQuery.$or = [
        { name: searchRegex },
        { plateNumber: searchRegex },
        { from: searchRegex },
        { to: searchRegex }
      ];
    }

    if (from) busQuery.from = from;
    if (to) busQuery.to = to;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d)) {
        query.departureDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
      }
    }
    // Filtrer les bus dont la date de départ n'est pas encore passée
    busQuery.departureDate = { $gte: new Date() };

    const hasPagination =
      req.query.page !== undefined &&
      req.query.limit !== undefined;

    // =========================
    //  MODE MOBILE (liste simple)
    // =========================
    if (!hasPagination) {

      const buses = await Bus.find(busQuery)
        .sort({ departureDate: 1 });

      return res.status(200).json(buses);
    }

    // =========================
    // MODE WEB (pagination)
    // =========================
    const page = Math.max(1, parseInt(req.query.page));
    const limit = Math.min(50, parseInt(req.query.limit));
    const skip = (page - 1) * limit;

    const total = await Bus.countDocuments(busQuery);

    const buses = await Bus.find(busQuery)
      .sort({ departureDate: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      buses,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Erreur getAllBuses:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
    res.status(200).json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateBus = async (req, res) => {
  try {
    const busId = req.params.id;
    const updates = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = req.user.role === 'entreprise' && String(bus.owner) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    // Récupérer les réservations confirmées
    const reservations = await Reservation.find({ bus: busId, status: 'confirmé' });

    if (reservations.length > 0) {
      const uniqueUserMap = new Map();
      for (const r of reservations) {
        if (!r.user) continue;
        const uid = r.user.toString();
        if (!uniqueUserMap.has(uid)) uniqueUserMap.set(uid, r);
      }

      const dateChanged = updates.departureDate && new Date(updates.departureDate).getTime() !== new Date(bus.departureDate).getTime();
      const priceChanged = updates.price !== undefined && Number(updates.price) !== Number(bus.price);
      const fromChanged = updates.from && updates.from !== bus.from;
      const toChanged = updates.to && updates.to !== bus.to;
      const seatsChanged = updates.availableSeats !== undefined && Number(updates.availableSeats) !== Number(bus.availableSeats);
      const wifiChanged = updates.wifi !== undefined && updates.wifi !== bus.wifi;
      const climChanged = updates.climatisation !== undefined && updates.climatisation !== bus.climatisation;

      const clientChanges = [];
      if (dateChanged) {
        const d = new Date(updates.departureDate);
        clientChanges.push(`horaire : ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
      }
      if (fromChanged || toChanged) clientChanges.push(`trajet : ${updates.from || bus.from} → ${updates.to || bus.to}`);
      if (seatsChanged) clientChanges.push(`places disponibles : ${updates.availableSeats}`);
      if (wifiChanged) clientChanges.push(`WiFi : ${updates.wifi ? 'disponible' : 'indisponible'}`);
      if (climChanged) clientChanges.push(`climatisation : ${updates.climatisation ? 'disponible' : 'indisponible'}`);

      // Prix modifié (notification séparée avec mention du prix verrouillé)
      if (priceChanged) {
        for (const [, reservation] of uniqueUserMap) {
          const locked = reservation.lockedPrice || bus.price;
          await sendAndSaveNotification(
            reservation.user,
            'Prix du bus modifié',
            `${bus.from} → ${bus.to} : prix passé de ${bus.price} à ${updates.price} FCFA. Votre réservation garde le prix initial de ${locked} FCFA.`,
            { type: 'info', busId: busId.toString(), screen: 'tickets' }
          );
        }
      }

      // Autres changements (horaire, trajet, places, wifi, clim)
      if (clientChanges.length > 0) {
        const userIds = [...uniqueUserMap.keys()];
        await sendAndSaveNotification(
          userIds,
          'Bus modifié',
          `Votre trajet en bus ${bus.from} → ${bus.to} a été modifié : ${clientChanges.join(', ')}.`,
          { type: 'info', busId: busId.toString(), screen: 'tickets' }
        );
      }
    }

    const updatedBus = await Bus.findByIdAndUpdate(busId, updates, { new: true });

    // Notifier le propriétaire (entreprise) de la confirmation de modification
    if (bus.owner) {
      const changesSummary = [];
      if (updates.departureDate && new Date(updates.departureDate).getTime() !== new Date(bus.departureDate).getTime()) {
        const d = new Date(updates.departureDate);
        changesSummary.push(`horaire : ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
      }
      if (updates.price !== undefined && Number(updates.price) !== Number(bus.price)) changesSummary.push(`prix : ${updates.price} FCFA`);
      if (updates.from && updates.from !== bus.from) changesSummary.push(`départ : ${updates.from}`);
      if (updates.to && updates.to !== bus.to) changesSummary.push(`destination : ${updates.to}`);
      if (updates.availableSeats !== undefined && Number(updates.availableSeats) !== Number(bus.availableSeats)) changesSummary.push(`places : ${updates.availableSeats}`);
      if (updates.wifi !== undefined && updates.wifi !== bus.wifi) changesSummary.push(`WiFi : ${updates.wifi ? 'activé' : 'désactivé'}`);
      if (updates.climatisation !== undefined && updates.climatisation !== bus.climatisation) changesSummary.push(`clim : ${updates.climatisation ? 'activée' : 'désactivée'}`);
      const summary = changesSummary.length > 0 ? changesSummary.join(', ') : 'informations mises à jour';
      await sendAndSaveNotification(
        bus.owner,
        'Bus modifié ✓',
        `${bus.from} → ${bus.to} : ${summary}.`,
        { type: 'info', busId: busId.toString(), screen: 'buses' }
      );
    }

    res.status(200).json({ message: 'Bus mis à jour', bus: updatedBus });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = req.user.role === 'entreprise' && String(bus.owner) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    await Bus.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Bus supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const activateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.status(200).json({ message: 'Bus activé', bus });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deactivateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json({ message: 'Bus désactivé', bus });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const searchBuses = async (req, res) => {
  try {
    const { from, to } = req.query;
    const now = new Date();
    const query = { isActive: true, departureDate: { $gt: now } };
    if (from) query.from = { $regex: from, $options: 'i' };
    if (to) query.to = { $regex: to, $options: 'i' };
    const buses = await Bus.find(query);
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getMyBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ owner: req.user._id });
    res.status(200).json({ buses });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createBus, getAllBuses, getBusById, updateBus, deleteBus, activateBus, deactivateBus, searchBuses, getMyBuses };