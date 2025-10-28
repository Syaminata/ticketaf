const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Controllers
const authController = require('./controllers/auth.controller');
const driverController = require('./controllers/driver.controller');
const busController = require('./controllers/bus.controller');
const voyageRoutes = require('./routes/voyage.routes');
const reservationController = require('./controllers/reservation.controller');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const driverRoutes = require('./routes/driver.routes');
const statsRoutes = require('./routes/stats.routes');
const reservationRoutes = require("./routes/reservation.routes");
const annonceRoutes = require('./routes/annonce.routes');


// Middleware
const { auth, adminAuth } = require('./middleware/auth');
const validateObjectId = require('./middleware/validateObjectId'); 

const app = express();


// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Serveur backend fonctionne!', timestamp: new Date() });
});

// -----------------
// Auth Routes
// -----------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// -----------------
// Driver Routes
// -----------------
app.use('/api/drivers', driverRoutes);
// -----------------
// Bus Routes
// -----------------
app.post('/api/buses', busController.createBus);
app.get('/api/buses', busController.getAllBuses);
app.get('/api/buses/:id', validateObjectId, busController.getBusById);
app.put('/api/buses/:id', validateObjectId, busController.updateBus);
app.delete('/api/buses/:id', validateObjectId, busController.deleteBus);

// -----------------
// Voyage Routes
// -----------------
app.use('/api/voyages', voyageRoutes);

// -----------------
// Stats Routes
// -----------------
app.use('/api/stats', statsRoutes);

// -----------------
// Reservation Routes (Chart endpoint)
// -----------------
app.use('/api/reservations', reservationRoutes);

// -----------------
// Annonce Routes
// -----------------
app.use('/api/annonces', annonceRoutes);

// Catch-all
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint non trouvé' });
});

module.exports = app;
