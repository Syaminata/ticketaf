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

    const dateChanged = updates.departureDate && new Date(updates.departureDate).getTime() !== new Date(bus.departureDate).getTime();
    const priceChanged = updates.price !== undefined && Number(updates.price) !== Number(bus.price);
    const fromChanged = updates.from && updates.from !== bus.from;
    const toChanged = updates.to && updates.to !== bus.to;
    const totalSeatsChanged = updates.capacity !== undefined && Number(updates.capacity) !== Number(bus.capacity);
    const availSeatsChanged = updates.availableSeats !== undefined && Number(updates.availableSeats) !== Number(bus.availableSeats);
    const wifiChanged = updates.wifi !== undefined && updates.wifi !== bus.wifi;
    const climChanged = updates.climatisation !== undefined && updates.climatisation !== bus.climatisation;

    if (reservations.length > 0) {
      const uniqueUserMap = new Map();
      for (const r of reservations) {
        if (!r.user) continue;
        const uid = r.user.toString();
        if (!uniqueUserMap.has(uid)) uniqueUserMap.set(uid, r);
      }

      const clientChanges = [];
      if (dateChanged) {
        const d = new Date(updates.departureDate);
        const dateStr = d.toLocaleDateString('fr-FR');
        const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        clientChanges.push(`nouvel horaire le ${dateStr} à ${timeStr}`);
      }
      if (fromChanged || toChanged) clientChanges.push(`trajet : ${updates.from || bus.from} → ${updates.to || bus.to}`);

      if (totalSeatsChanged || availSeatsChanged) {
        const total = updates.capacity !== undefined ? updates.capacity : bus.capacity;
        const avail = updates.availableSeats !== undefined ? updates.availableSeats : bus.availableSeats;
        const s = avail > 1 ? 's' : '';
        clientChanges.push(`places : ${total} totales, ${avail} disponible${s}`);
      }

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

      // Autres changements
      if (clientChanges.length > 0) {
        const userIds = [...uniqueUserMap.keys()];
        await sendAndSaveNotification(
          userIds,
          'Bus modifié',
          `Votre trajet en bus ${bus.name} (${bus.from} → ${bus.to}) a été modifié : ${clientChanges.join(', ')}.`,
          { type: 'info', busId: busId.toString(), screen: 'tickets' }
        );
      }
    }

    const updatedBus = await Bus.findByIdAndUpdate(busId, updates, { new: true });

    // Notifier le propriétaire (entreprise) de la confirmation de modification
    if (bus.owner) {
      const changesSummary = [];
      if (dateChanged) {
        const d = new Date(updates.departureDate);
        const dateStr = d.toLocaleDateString('fr-FR');
        const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        changesSummary.push(`horaire le ${dateStr} à ${timeStr}`);
      }
      if (priceChanged) changesSummary.push(`nouveau prix : ${updates.price} FCFA`);
      if (fromChanged || toChanged) changesSummary.push(`nouveau trajet : ${updatedBus.from} → ${updatedBus.to}`);

      if (totalSeatsChanged || availSeatsChanged) {
        const total = updates.capacity !== undefined ? updates.capacity : bus.capacity;
        const avail = updates.availableSeats !== undefined ? updates.availableSeats : bus.availableSeats;
        const s = avail > 1 ? 's' : '';
        changesSummary.push(`places : ${total} totales, ${avail} disponible${s}`);
      }

      if (wifiChanged) changesSummary.push(`WiFi : ${updates.wifi ? 'activé' : 'désactivé'}`);
      if (climChanged) changesSummary.push(`climatisation : ${updates.climatisation ? 'activée' : 'désactivée'}`);

      const finalOwnerMsg = changesSummary.length > 0
        ? `Votre bus ${bus.from} → ${bus.to} a été mis à jour : ${changesSummary.join(', ')}.`
        : `Votre bus ${bus.from} → ${bus.to} a été mis à jour avec succès.`;

      await sendAndSaveNotification(
        bus.owner,
        'Bus modifié ✓',
        finalOwnerMsg,
        { type: 'info', busId: busId.toString(), screen: 'buses' }
      ).catch(err => console.error('Erreur notification entreprise:', err));
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
    const isOwner = String(bus.owner) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const trajet = `${bus.from} → ${bus.to}`;
    const dateStr = new Date(bus.departureDate).toLocaleDateString('fr-FR');

    // Récupérer les clients ayant une réservation confirmée
    const reservations = await Reservation.find({ bus: bus._id, status: 'confirmé' });
    const clientIds = reservations.map(r => r.user).filter(Boolean);

    if (isAdmin) {
      sendAndSaveNotification(
        bus.owner,
        'Bus annulé',
        `Votre bus ${trajet} du ${dateStr} a été annulé par un administrateur.`,
        { type: 'warning', screen: 'buses' }
      ).catch(() => {});
    }

    if (isOwner) {
      sendAndSaveNotification(
        bus.owner,
        'Bus supprimé',
        `Votre bus ${trajet} du ${dateStr} a été supprimé.`,
        { type: 'info', screen: 'buses' }
      ).catch(() => {});
    }

    if (clientIds.length > 0) {
      const msgClient = isAdmin
        ? `Le bus ${trajet} du ${dateStr} a été annulé par l'administrateur.`
        : `L'entreprise a annulé le bus ${trajet} du ${dateStr}.`;
      sendAndSaveNotification(
        clientIds,
        'Bus annulé',
        msgClient,
        { type: 'warning', screen: 'tickets' }
      ).catch(() => {});
    }

    await Bus.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Bus supprimé avec succès' });
  } catch (err) {
    console.error('[BUS_DELETE] Erreur:', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const activateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
    if (bus.owner) {
      sendAndSaveNotification(
        bus.owner,
        'Bus activé',
        `Votre bus ${bus.from} → ${bus.to} a été activé par Ticketaf.`,
        { type: 'info', screen: 'buses' }
      ).catch(() => {});
    }
    res.status(200).json({ message: 'Bus activé', bus });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deactivateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
    if (bus.owner) {
      sendAndSaveNotification(
        bus.owner,
        'Bus désactivé',
        `Votre bus ${bus.from} → ${bus.to} a été désactivé par un administrateur. Contactez le support pour plus d'informations.`,
        { type: 'warning', screen: 'buses' }
      ).catch(() => {});
    }
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
