const Colis = require('../models/colis.model');
const Place = require('../models/place.model');
const ColisModel = require('../models/colis.model');
const Voyage = require('../models/voyage.model');

// Créer un colis
const createColis = async (req, res) => {
  try {
    const colisData = {
      ...req.body,
      type: 'colis',
      createdBy: req.user._id
    };

    const colis = await ColisModel.create(colisData);
    res.status(201).json({ message: 'Colis créé avec succès', colis });
  } catch (err) {
    console.error('Erreur createColis:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Créer une réservation de place
const createPlace = async (req, res) => {
  try {
    const placeData = {
      ...req.body,
      type: 'place',
      createdBy: req.user._id
    };

    const place = await Place.create(placeData);
    res.status(201).json({ message: 'Place réservée avec succès', place });
  } catch (err) {
    console.error('Erreur createPlace:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Récupérer tous les colis et places
const getAllColis = async (req, res) => {
  try {
    const { type, status, from, to, date } = req.query;
    
    let filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (from) filter.from = new RegExp(from, 'i');
    if (to) filter.to = new RegExp(to, 'i');
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const colis = await Colis.find(filter)
      .populate('voyage', 'departure arrival price')
      .populate('driver', 'name phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(colis);
  } catch (err) {
    console.error('Erreur getAllColis:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Récupérer un colis/place par ID
const getColisById = async (req, res) => {
  try {
    const colis = await Colis.findById(req.params.id)
      .populate('voyage', 'departure arrival price')
      .populate('driver', 'name phone')
      .populate('createdBy', 'name email');

    if (!colis) {
      return res.status(404).json({ message: 'Colis/Place non trouvé' });
    }

    res.status(200).json(colis);
  } catch (err) {
    console.error('Erreur getColisById:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Mettre à jour un colis/place
const updateColis = async (req, res) => {
  try {
    const colis = await Colis.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('voyage', 'departure arrival price')
     .populate('driver', 'name phone')
     .populate('createdBy', 'name email');

    if (!colis) {
      return res.status(404).json({ message: 'Colis/Place non trouvé' });
    }

    res.status(200).json({ message: 'Colis/Place mis à jour', colis });
  } catch (err) {
    console.error('Erreur updateColis:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Supprimer un colis/place
const deleteColis = async (req, res) => {
  try {
    const colis = await Colis.findByIdAndDelete(req.params.id);

    if (!colis) {
      return res.status(404).json({ message: 'Colis/Place non trouvé' });
    }

    res.status(200).json({ message: 'Colis/Place supprimé' });
  } catch (err) {
    console.error('Erreur deleteColis:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Suivre un colis par numéro de suivi
const trackColis = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const colis = await Colis.findOne({ trackingNumber })
      .populate('voyage', 'departure arrival')
      .populate('driver', 'name phone');

    if (!colis) {
      return res.status(404).json({ message: 'Colis non trouvé' });
    }

    res.status(200).json(colis);
  } catch (err) {
    console.error('Erreur trackColis:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Statistiques des colis et places
const getColisStats = async (req, res) => {
  try {
    const totalColis = await ColisModel.countDocuments();
    const totalPlaces = await Place.countDocuments();
    
    const colisByStatus = await ColisModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const placesByStatus = await Place.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      totalColis,
      totalPlaces,
      colisByStatus,
      placesByStatus
    });
  } catch (err) {
    console.error('Erreur getColisStats:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = {
  createColis,
  createPlace,
  getAllColis,
  getColisById,
  updateColis,
  deleteColis,
  trackColis,
  getColisStats
};
