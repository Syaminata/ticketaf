const User = require('../models/user.model');
const Reservation = require('../models/reservation.model');
const Bus = require('../models/bus.model');
const Voyage = require('../models/voyage.model');
const Driver = require('../models/driver.model');

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
    
    // Definir la periode
    switch(period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Recuperer toutes les reservations de la periode
    const reservations = await Reservation.find({
      createdAt: { $gte: startDate }
    }).populate('voyage').populate('bus');
    
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
