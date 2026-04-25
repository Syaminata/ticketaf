const Bus = require('../models/bus.model');

const createBus = async (req, res) => {
  try {
    if (!['entreprise', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const { name, plateNumber, capacity, from, to, departureDate, price } = req.body;
    const existingBus = await Bus.findOne({ plateNumber });
    if (existingBus) return res.status(400).json({ message: 'Numéro de plaque déjà utilisé' });

    const busData = {
      name, plateNumber, capacity,
      availableSeats: capacity,
      from, to,
      departureDate: new Date(departureDate),
      price,
      isActive: true // Par défaut actif pour les tests
    };

    if (req.user.role === 'entreprise') busData.owner = req.user._id;

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

    const hasPagination =
      req.query.page !== undefined &&
      req.query.limit !== undefined;

    // =========================
    // 📱 MODE MOBILE (liste simple)
    // =========================
    if (!hasPagination) {
      console.log('📱 Mode MOBILE BUS (liste simple)');

      const buses = await Bus.find(busQuery)
        .sort({ departureDate: 1 });

      return res.status(200).json(buses);
    }

    // =========================
    // 💻 MODE WEB (pagination)
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
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });

    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isOwner = req.user.role === 'entreprise' && String(bus.owner) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const updatedBus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
