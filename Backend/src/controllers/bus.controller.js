const Bus = require('../models/bus.model');

const createBus = async (req, res) => {
  try {
    // Vérifier si l'utilisateur a le droit de créer un bus
    if (!['entreprise', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé. Seules les entreprises et les administrateurs peuvent créer des bus.' });
    }

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

    // Ajouter l'ID de l'utilisateur qui crée le bus (pour les entreprises)
    const busData = { 
      name, 
      plateNumber, 
      capacity, 
      availableSeats: capacity, // Initialiser avec la capacité
      from, 
      to, 
      departureDate: new Date(departureDate),
      price 
    };

    // Si c'est une entreprise, ajouter son ID comme propriétaire
    if (req.user.role === 'entreprise') {
      busData.owner = req.user._id;
    }

    const bus = await Bus.create(busData);
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
      departureDate: { $gte: now }
    });

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
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });

    // Vérifier si l'utilisateur a le droit de modifier ce bus
    if (req.user.role === 'entreprise' && bus.owner && bus.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres bus.' });
    }

    if (!['entreprise', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé. Seules les entreprises et les administrateurs peuvent modifier des bus.' });
    }

    const updatedBus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ message: 'Bus mis à jour', bus: updatedBus });
  } catch (err) {
    console.error('Erreur updateBus:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });

    // Vérifier si l'utilisateur a le droit de supprimer ce bus
    if (req.user.role === 'entreprise' && bus.owner && bus.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez supprimer que vos propres bus.' });
    }

    if (!['entreprise', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé. Seules les entreprises et les administrateurs peuvent supprimer des bus.' });
    }

    await Bus.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Bus supprimé avec succès' });
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
// Dans bus.controller.js
const searchBuses = async (req, res) => {
  try {
    const { from, to, date, type } = req.query;
    const query = { isActive: true }; // Seulement les bus actifs

    if (from) query.from = { $regex: from, $options: 'i' }; // Recherche insensible à la casse
    if (to) query.to = { $regex: to, $options: 'i' };
    
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.departureDate = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    const buses = await Bus.find(query);
    res.json(buses);
  } catch (err) {
    console.error('Erreur lors de la recherche de bus:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { createBus, getAllBuses, getBusById, updateBus, deleteBus, migrateBusSeats, activateBus, deactivateBus, searchBuses };
