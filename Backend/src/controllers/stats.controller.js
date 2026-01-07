const User = require('../models/user.model');
const Reservation = require('../models/reservation.model');
const Bus = require('../models/bus.model');
const Voyage = require('../models/voyage.model');
const Driver = require('../models/driver.model');
const Colis = require('../models/colis.model');
const mongoose = require('mongoose');

exports.getStats = async (req, res) => {
  try {
    const utilisateurs = await User.countDocuments();
    const conducteurs = await Driver.countDocuments();
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Debut de la journee
    
    // Bus valides (departureDate >= aujourd'hui)
    const bus = await Bus.countDocuments({ departureDate: { $gte: now } });
    
    // Voyages valides (date >= aujourd'hui)
    const voyages = await Voyage.countDocuments({ date: { $gte: now } });
    
    // Reservations valides (liees a des voyages ou bus non expires)
    const validVoyages = await Voyage.find({ date: { $gte: now } }).select('_id');
    const validBuses = await Bus.find({ departureDate: { $gte: now } }).select('_id');
    const validVoyageIds = validVoyages.map(v => v._id);
    const validBusIds = validBuses.map(b => b._id);
    
    const reservations = await Reservation.countDocuments({
      $or: [
        { voyage: { $in: validVoyageIds } },
        { bus: { $in: validBusIds } }
      ]
    });

    res.json({ utilisateurs, conducteurs, reservations, bus, voyages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Calculer les revenus
exports.getRevenue = async (req, res) => {
  try {
    const { period } = req.query; // 'today', 'week', 'month', 'year'
    
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    // Normaliser la date de fin à la fin de la journée (23:59:59)
    endDate.setHours(23, 59, 59, 999);
    
    // Definir la periode
    switch(period) {
      case 'today':
        // Aujourd'hui : depuis minuit jusqu'à maintenant
        startDate.setHours(0, 0, 0, 0);
        endDate = now; // Jusqu'à maintenant
        break;
      case 'week':
        // 7 derniers jours : depuis 7 jours à minuit jusqu'à maintenant
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
        break;
      case 'month':
        // Mois actuel : depuis le 1er jour du mois actuel jusqu'à maintenant
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1er jour du mois
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
        break;
      case 'year':
        // Cette année : depuis le 1er janvier de cette année jusqu'à maintenant
        startDate = new Date(now.getFullYear(), 0, 1); // 1er janvier
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
        break;
      default:
        // Par défaut : aujourd'hui
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
    }
    
    // Log pour debug
    console.log(`[Revenue Stats] Période: ${period}`);
    console.log(`[Revenue Stats] Date de début: ${startDate.toISOString()}`);
    console.log(`[Revenue Stats] Date de fin: ${endDate.toISOString()}`);
    
    // Recuperer toutes les reservations de la periode
    const reservations = await Reservation.find({
      createdAt: { 
        $gte: startDate,
        $lte: endDate
      }
    }).populate('voyage').populate('bus');
    
    console.log(`[Revenue Stats] Nombre de réservations trouvées: ${reservations.length}`);
    
    // Calculer le revenu total
    let totalRevenue = 0;
    let revenueByDay = {};
    let revenueByRoute = {};
    
    reservations.forEach(reservation => {
      let price = 0;
      let quantity = reservation.quantity || 1;
      let routeName = '';
      
      if (reservation.voyage) {
        price = reservation.voyage.price || 0;
        routeName = `${reservation.voyage.from} → ${reservation.voyage.to}`;
      } else if (reservation.bus) {
        price = reservation.bus.price || 0;
        routeName = `${reservation.bus.from} → ${reservation.bus.to}`;
      }
      
      const revenue = price * quantity;
      totalRevenue += revenue;
      
      // Revenu par jour
      const day = reservation.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + revenue;
      
      // Revenu par route
      if (routeName) {
        revenueByRoute[routeName] = (revenueByRoute[routeName] || 0) + revenue;
      }
    });
    
    // Formater les donnees pour les graphiques
    const dailyRevenue = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const routeRevenue = Object.entries(revenueByRoute)
      .map(([route, revenue]) => ({ route, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 routes
    
    res.json({
      totalRevenue,
      reservationsCount: reservations.length,
      averageRevenue: reservations.length > 0 ? totalRevenue / reservations.length : 0,
      dailyRevenue,
      routeRevenue,
      period
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir le top 5 des clients avec le plus de réservations de voyage
exports.getTopReservationsClients = async (req, res) => {
  try {
    const topClients = await Reservation.aggregate([
      // Filtrer uniquement les réservations de type 'place' (voyage)
      { $match: { ticket: 'place' } },
      // Grouper par utilisateur et compter le nombre de réservations
      {
        $group: {
          _id: '$user',
          reservationCount: { $sum: 1 },
          lastReservation: { $max: '$createdAt' }
        }
      },
      // Trier par nombre de réservations (décroissant)
      { $sort: { reservationCount: -1 } },
      // Limiter aux 5 premiers
      { $limit: 5 },
      // Joindre les informations de l'utilisateur
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      // Dérouler le tableau userInfo
      { $unwind: '$userInfo' },
      // Projeter uniquement les champs nécessaires
      {
        $project: {
          _id: 1,
          name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          email: '$userInfo.email',
          phone: '$userInfo.phone',
          reservationCount: 1,
          lastActivity: '$lastReservation'
        }
      }
    ]);

    res.json(topClients);
  } catch (err) {
    console.error('Erreur lors de la récupération des meilleurs clients voyageurs:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des meilleurs clients voyageurs',
      error: err.message 
    });
  }
};

// Obtenir le top 5 des destinations de colis
exports.getTopColisDestinations = async (req, res) => {
  try {
    const topDestinations = await Colis.aggregate([
      // Joindre avec les informations du voyage
      {
        $lookup: {
          from: 'voyages',
          localField: 'voyage',
          foreignField: '_id',
          as: 'voyageInfo'
        }
      },
      // Dérouler le tableau voyageInfo
      { $unwind: '$voyageInfo' },
      // Grouper par destination et compter le nombre de colis
      {
        $group: {
          _id: '$voyageInfo.to',
          colisCount: { $sum: 1 }
        }
      },
      // Trier par nombre de colis (décroissant)
      { $sort: { colisCount: -1 } },
      // Limiter aux 5 premiers
      { $limit: 5 },
      // Projeter les champs nécessaires
      {
        $project: {
          _id: 0,
          destination: '$_id',
          colisCount: 1
        }
      }
    ]);

    res.json(topDestinations);
  } catch (err) {
    console.error('Erreur lors de la récupération des meilleures destinations de colis:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des destinations de colis',
      error: err.message 
    });
  }
};

// Pour les clients
exports.getTopClients = async (req, res) => {
  try {
    const topClients = await User.aggregate([
      {
        $lookup: {
          from: 'colis',
          localField: '_id',
          foreignField: 'expediteur',
          as: 'colis'
        }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$name', 'Client sans nom'] },
          phone: { $ifNull: ['$numero', 'Non renseigné'] },
          totalColis: { $size: '$colis' },
          lastActivity: { $max: '$colis.createdAt' }
        }
      },
      { $match: { totalColis: { $gt: 0 } } },
      { $sort: { totalColis: -1 } },
      { $limit: 5 }
    ]);

    res.json(topClients || []);
  } catch (err) {
    console.error('Erreur lors de la récupération des meilleurs clients:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Pour les chauffeurs
exports.getTopDrivers = async (req, res) => {
  try {
    const topDrivers = await Driver.aggregate([
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$name', 'Chauffeur sans nom'] },
          phone: { $ifNull: ['$numero', 'Non renseigné'] },
          isActive: { $ifNull: ['$isActive', false] },
          tripCount: { $ifNull: ['$tripCount', 0] },
          status: {
            $cond: {
              if: { $ifNull: ['$isActive', false] },
              then: 'Actif',
              else: 'Inactif'
            }
          }
        }
      },
      { $sort: { tripCount: -1 } },
      { $limit: 5 }
    ]);

    console.log('Top drivers data:', JSON.stringify(topDrivers, null, 2));
    res.json(topDrivers);
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs chauffeurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};