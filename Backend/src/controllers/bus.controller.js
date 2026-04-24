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
    console.log('🔍 Backend getAllBuses - req.query:', req.query);
    
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const from   = req.query.from || '';
    const to     = req.query.to || '';

    console.log('📊 Pagination Buses - page:', page, 'limit:', limit, 'skip:', skip);

    // Construire la requête de base
    let busQuery = {};
    
    // Ajouter la recherche si fournie
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      busQuery.$or = [
        { name: searchRegex },
        { plateNumber: searchRegex },
        { from: searchRegex },
        { to: searchRegex }
      ];
    }
    
    // Filtrer par ville de départ
    if (from) {
      busQuery.from = from;
    }
    
    // Filtrer par ville d'arrivée
    if (to) {
      busQuery.to = to;
    }

    console.log('🔎 Recherche Buses avec filter:', busQuery);
    
    // Compter le total des buses pour la pagination
    const total = await Bus.countDocuments(busQuery);
    
    // Récupérer les buses avec pagination
    const buses = await Bus.find(busQuery)
      .sort({ departureDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📈 Résultats Buses - buses.length:', buses.length, 'total:', total);
    
    // Retourner les résultats avec pagination
    const response = {
      buses: buses,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    };

    console.log('📤 Réponse Buses envoyée:', {
      busesCount: buses.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

    res.status(200).json(response);
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
