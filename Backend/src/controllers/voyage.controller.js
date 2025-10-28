const Voyage = require('../models/voyage.model');
const Bus = require('../models/bus.model');
const Driver = require('../models/driver.model');

const createVoyage = async (req, res) => {
  try {
    const { driverId, from, to, date, price, totalSeats } = req.body;
    if (!driverId || !from || !to || !date || !price) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Conducteur non trouvé' });
    if (!driver.isActive) return res.status(403).json({ message: 'Conducteur inactif. Veuillez l\'activer avant de créer un voyage.' });

    // Utiliser la capacité du driver par défaut si totalSeats n'est pas fourni
    const seats = totalSeats || driver.capacity || 4;
    
    const voyage = await Voyage.create({ 
      driver: driverId, 
      from, 
      to, 
      date, 
      price,
      totalSeats: seats,
      availableSeats: seats
    });
    
    // Populate le driver pour la réponse
    const populatedVoyage = await Voyage.findById(voyage._id).populate('driver', '-password');
    
    res.status(201).json({ message: 'Voyage créé', voyage: populatedVoyage });
  } catch (err) {
    console.error('Erreur createVoyage:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET ALL VOYAGES (FUTURS UNIQUEMENT) - Pour les pages de réservation
const getAllVoyage = async (req, res) => {
  try {
    // Filtrer les voyages futurs uniquement
    const now = new Date();
    const voyage = await Voyage.find({
      date: { $gt: now } // Seulement les voyages dont la date est supérieure à maintenant
    })
    .populate('driver', '-password')
    .sort({ date: 1 }); // Trier par date croissante (plus proche en premier)
    
    res.status(200).json(voyage);
  } catch (err) {
    console.error('Erreur getAllVoyage:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET ALL VOYAGES (INCLUANT EXPIRÉS) - Pour la page historique
const getAllVoyageIncludingExpired = async (req, res) => {
  try {
    const voyage = await Voyage.find()
      .populate('driver', '-password')
      .sort({ date: -1 }); // Trier par date décroissante (plus récent en premier)
    
    res.status(200).json(voyage);
  } catch (err) {
    console.error('Erreur getAllVoyageIncludingExpired:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getVoyageById = async (req, res) => {
  try {
    const voyage = await Voyage.findById(req.params.id)
      .populate('driver', '-password');
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    res.status(200).json(voyage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateVoyage = async (req, res) => {
  try {
    const voyage = await Voyage.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('driver', '-password');
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    res.status(200).json({ message: 'Trajet mis à jour', voyage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deleteVoyage = async (req, res) => {
  try {
    const voyage = await Voyage.findByIdAndDelete(req.params.id);
    if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
    res.status(200).json({ message: 'Voyage supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { createVoyage, getAllVoyage, getAllVoyageIncludingExpired, getVoyageById, updateVoyage, deleteVoyage };
