const Bus = require('../models/bus.model');

const createBus = async (req, res) => {
  try {
    const { name, plateNumber, capacity, from, to, departureDate, price } = req.body;
    
    // Vérification des champs requis
    const requiredFields = { name, plateNumber, capacity, from, to, departureDate, price };
    const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Tous les champs sont requis', 
        missing: missingFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      });
    }

    const existingBus = await Bus.findOne({ plateNumber });
    if (existingBus) return res.status(400).json({ message: 'Numéro de plaque déjà utilisé' });

    const bus = await Bus.create({ 
      name, 
      plateNumber, 
      capacity, 
      availableSeats: capacity, // Initialiser avec la capacité
      from, 
      to, 
      departureDate: new Date(departureDate),
      price 
    });
    res.status(201).json({ message: 'Bus créé', bus });
  } catch (err) {
    console.error('Erreur createBus:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getAllBuses = async (req, res) => {
  try {
    const now = new Date();

    const buses = await Bus.find({
      departureDate: { $gte: now },
      isActive: true // Ne retourner que les bus actifs
    });

    // Migration: Corriger les bus qui n'ont pas de availableSeats
    for (const bus of buses) {
      if (bus.availableSeats === undefined || bus.availableSeats === null) {
        await Bus.findByIdAndUpdate(bus._id, { 
          availableSeats: bus.capacity 
        });
        bus.availableSeats = bus.capacity;
      }
    }

    res.status(200).json(buses);
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
    console.error('Erreur getBusById:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
    res.status(200).json({ message: 'Bus mis à jour', bus });
  } catch (err) {
    console.error('Erreur updateBus:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
    res.status(200).json({ message: 'Bus supprimé' });
  } catch (err) {
    console.error('Erreur deleteBus:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const migrateBusSeats = async (req, res) => {
  try {
    const buses = await Bus.find({});
    let updatedCount = 0;
    
    for (const bus of buses) {
      if (bus.availableSeats === undefined || bus.availableSeats === null || bus.availableSeats < 0) {
        await Bus.findByIdAndUpdate(bus._id, { 
          availableSeats: bus.capacity 
        });
        updatedCount++;
      }
    }
    
    res.status(200).json({ 
      message: `Migration terminée: ${updatedCount} bus mis à jour`,
      updatedCount 
    });
  } catch (err) {
    console.error('Erreur migrateBusSeats:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
const activateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
    res.status(200).json({ message: 'Bus activé', bus });
  } catch (err) {
    console.error('Erreur activateBus:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deactivateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
    res.status(200).json({ message: 'Bus désactivé', bus });
  } catch (err) {
    console.error('Erreur deactivateBus:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { createBus, getAllBuses, getBusById, updateBus, deleteBus, migrateBusSeats, activateBus, deactivateBus };
