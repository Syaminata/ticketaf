const Voyage = require('../models/voyage.model');
const Reservation = require('../models/reservation.model');
const Driver = require('../models/driver.model');
const { sendNotification } = require('../services/notification.service');

const createVoyage = async (req, res) => {
  try {
    const { driverId, from, to, date, price, totalSeats } = req.body;

    if (!driverId || !from || !to || !date || !price) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const driver = await Driver.findOne({ 
      _id: driverId, 
      isActive: true 
    });

    if (!driver) {
      return res.status(403).json({
        message: 'Conducteur inactif'
      });
    }

    // Vérifier si le chauffeur a déjà un voyage à la même date et heure
    const voyageDate = new Date(date);
    const twoHoursBefore = new Date(voyageDate.getTime() - 120 * 60000); // 2h avant
    const twoHoursAfter = new Date(voyageDate.getTime() + 120 * 60000); // 2h après
    
    const existingVoyage = await Voyage.findOne({
      driver: driverId,
      date: {
        $gte: twoHoursBefore,
        $lt: twoHoursAfter
      }
    });

    if (existingVoyage) {
      return res.status(409).json({
        message: 'Ce conducteur a déjà un voyage programmé à cette période',
        existingVoyage: {
          from: existingVoyage.from,
          to: existingVoyage.to,
          date: existingVoyage.date
        }
      });
    }

    // Utiliser la capacité du driver par défaut si totalSeats n'est pas fourni
    const seats = totalSeats || driver.capacity || 4;

    const voyage = await Voyage.create({ 
      driver: driver._id,
      from,
      to,
      date,
      price,
      totalSeats: seats,
      availableSeats: seats
    });

    // Populate le driver pour la réponse
    const populatedVoyage = await Voyage
      .findById(voyage._id)
      .populate('driver', '-password');

    res.status(201).json({
      message: 'Voyage créé avec un conducteur actif',
      voyage: populatedVoyage
    });

  } catch (err) {
    console.error('Erreur createVoyage:', err);
    res.status(500).json({
      message: 'Erreur serveur',
      error: err.message
    });
  }
};


// GET ALL VOYAGES (FUTURS UNIQUEMENT) - Pour les pages de réservation
const getAllVoyage = async (req, res) => {
  try {
    const now = new Date();
    const voyages = await Voyage.find({
      date: { $gt: now }
    })
    .populate({
      path: 'driver',
      select: '-password',
      options: { retainNullValues: true }
    })
    .sort({ date: 1 });
    
    // Trier les voyages
    const sortedVoyages = voyages.sort((a, b) => {
      // Gérer le cas où le driver est null
      const aDriver = a.driver || { isPinned: false, pinnedOrder: 0 };
      const bDriver = b.driver || { isPinned: false, pinnedOrder: 0 };
      
      // Si les deux chauffeurs ont le même statut isPinned
      if (aDriver.isPinned === bDriver.isPinned) {
        // Trier par pinnedOrder si les deux sont épinglés
        if (aDriver.isPinned) {
          return (aDriver.pinnedOrder || 0) - (bDriver.pinnedOrder || 0);
        }
        // Sinon garder l'ordre par date
        return 0;
      }
      // Les chauffeurs épinglés en premier
      return aDriver.isPinned ? -1 : 1;
    });

    res.status(200).json(sortedVoyages);
  } catch (error) {
    console.error('Erreur getAllVoyage:', error);
    res.status(500).json({ message: 'Erreur serveur' });
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
    const voyageId = req.params.id;
    const updates = req.body;
    
    // 🔹 récupérer le voyage existant
    const voyage = await Voyage.findById(voyageId);
    if (!voyage) {
      return res.status(404).json({ message: 'Voyage non trouvé' });
    }
    

    if (updates.totalSeats !== undefined) {
      const newTotalSeats = parseInt(updates.totalSeats, 10);
      
      // 🔹 COMPTER LES RÉSERVATIONS RÉELLES depuis la DB
      const activeReservations = await Reservation.countDocuments({
        voyage: voyageId,
        status: { $in: ['confirmé'] } 
      });
      
      if (newTotalSeats < activeReservations) {
        return res.status(400).json({
          message: `Impossible de descendre en dessous de ${activeReservations} places (déjà réservées)`
        });
      }
      
      // Recalcul propre basé sur les vraies réservations
      updates.totalSeats = newTotalSeats;
      updates.availableSeats = newTotalSeats - activeReservations;
    }
    
  
    // Si le chauffeur démarre le voyage
    if (updates.status === 'STARTED' && voyage.status !== 'STARTED') {
      updates.status = 'STARTED';
      const reservations = await Reservation.find({
        voyage: voyageId,
        status: 'confirmé'
      }).populate('user');
      
      for (const r of reservations) {
        if (r.user?.fcmToken) {
          await sendNotification(
            [r.user.fcmToken],
            'Voyage démarré',
            'Le chauffeur a démarré le voyage',
            {
              type: 'TRIP_STARTED',
              voyageId
            }
          );
        }
      }
    }
    
    // Chauffeur en route vers un client
    if (
      updates.currentClient &&
      String(updates.currentClient) !== String(voyage.currentClient)
    ) {
      const client = await User.findById(updates.currentClient);
      if (client?.fcmToken) {
        await sendNotification(
          [client.fcmToken],
          'Le chauffeur arrive',
          'Le chauffeur se dirige vers votre position',
          {
            type: 'DRIVER_ON_THE_WAY',
            voyageId,
          }
        );
      }
    }
    
    // Client embarqué
    if (updates.clientPicked === true && voyage.currentClient) {
      await Reservation.findOneAndUpdate(
        { voyage: voyageId, user: voyage.currentClient },
        { status: 'terminé' }
      );
    }
    

    const updatedVoyage = await Voyage.findByIdAndUpdate(
      voyageId,
      updates,
      { new: true }
    ).populate('driver', '-password');
    
    res.status(200).json({
      message: 'Trajet mis à jour',
      voyage: updatedVoyage
    });
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

const searchVoyages = async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const query = {};

    if (from) query.from = { $regex: from, $options: 'i' };
    if (to) query.to = { $regex: to, $options: 'i' };
    
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    const voyages = await Voyage.find(query).populate('driver', '-password');
    
    // Trier les voyages : chauffeurs épinglés en premier
    const sortedVoyages = voyages.sort((a, b) => {
      if (a.driver.isPinned === b.driver.isPinned) {
        if (a.driver.isPinned) {
          return (a.driver.pinnedOrder || 0) - (b.driver.pinnedOrder || 0);
        }
        return 0;
      }
      return b.driver.isPinned - a.driver.isPinned;
    });
    
    res.json(sortedVoyages);
  } catch (err) {
    console.error('Erreur lors de la recherche de voyages:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Récupérer les voyages d'un conducteur
const getMyVoyages = async (req, res) => {
  try {
    const driverId = req.user._id; // ID déjà disponible via le token
    const { includeExpired } = req.query;

    let query = { driver: driverId };

    // Filtrer les voyages expirés si nécessaire
    if (includeExpired === 'false' || includeExpired === false) {
      query.date = { $gte: new Date() };
    }

    const voyages = await Voyage.find(query)
      .populate('driver', '-password')
      .sort({ date: -1 });

    res.status(200).json(voyages);
  } catch (err) {
    console.error('Erreur getMyVoyages:', err);
    res.status(500).json({
      message: 'Erreur serveur',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


// CRÉATION DE VOYAGE PAR LE CONDUCTEUR
const createVoyageByDriver = async (req, res) => {
  try {
    const driverId = req.user._id; // vient du token (auth + isDriver)
    const { from, to, date, price, totalSeats } = req.body;

    if (!from || !to || !date || !price) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Conducteur non trouvé' });
    }

    if (!driver.isActive) {
      return res.status(403).json({
        message: 'Conducteur inactif. Veuillez contacter l’administration.'
      });
    }

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

    const populatedVoyage = await Voyage.findById(voyage._id)
      .populate('driver', '-password');

    res.status(201).json({
      message: 'Voyage créé avec succès',
      voyage: populatedVoyage
    });
  } catch (err) {
    console.error('Erreur createVoyageByDriver:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Mettre à jour un voyage spécifique du conducteur connecté
const updateMyVoyage = async (req, res) => {
  try {
    const driverId = req.user._id; // ID du conducteur connecté
    const voyageId = req.params.id;
    const updates = req.body;

    // Vérifier si le voyage existe et appartient au conducteur
    const voyage = await Voyage.findOne({ _id: voyageId, driver: driverId });
    
    if (!voyage) {
      return res.status(404).json({ 
        message: 'Voyage non trouvé ou vous n\'êtes pas autorisé à le modifier' 
      });
    }

    // Mettre à jour le voyage
    const updatedVoyage = await Voyage.findByIdAndUpdate(
      voyageId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('driver', '-password');

    res.status(200).json({ 
      message: 'Voyage mis à jour avec succès', 
      voyage: updatedVoyage 
    });
  } catch (err) {
    console.error('Erreur updateMyVoyage:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du voyage',
      error: err.message 
    });
  }
};

module.exports = { 
  createVoyage, 
  getAllVoyage, 
  getAllVoyageIncludingExpired, 
  getVoyageById, 
  updateVoyage, 
  deleteVoyage, 
  searchVoyages,
  getMyVoyages,
  createVoyageByDriver,
  updateMyVoyage
};
