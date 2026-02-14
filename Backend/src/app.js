const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('./config/firebase');


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
const colisRoutes = require('./routes/colis.routes');
const villeRoutes = require('./routes/ville.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const otpRoutes = require('./routes/otp.routes');

// Middleware
const { auth, adminAuth } = require('./middleware/auth');
const validateObjectId = require('./middleware/validateObjectId'); 

const app = express();


// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); 

/**
 * @swagger
 * /test:
 *   get:
 *     summary: Test de connexion au serveur
 *     tags: [Test]
 *     security: []
 *     responses:
 *       200:
 *         description: Serveur fonctionne
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
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
/**
 * @swagger
 * /buses:
 *   post:
 *     summary: Créer un nouveau bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - plateNumber
 *               - capacity
 *               - from
 *               - to
 *               - departureDate
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               plateNumber:
 *                 type: string
 *                 description: Numéro de plaque d'immatriculation
 *               capacity:
 *                 type: number
 *               availableSeats:
 *                 type: number
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               departureDate:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bus créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bus'
 */
app.post('/api/buses', auth, busController.createBus);

/**
 * @swagger
 * /buses:
 *   get:
 *     summary: Récupérer tous les bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des bus
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bus'
 */
app.get('/api/buses', auth, busController.getAllBuses);

/**
 * @swagger
 * /buses/me:
 *   get:
 *     summary: Récupérer les bus de l'entreprise connectée
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des bus de l'entreprise
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 buses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bus'
 *       403:
 *         description: Accès refusé - Réservé aux entreprises
 */
app.get('/api/buses/me', auth, busController.getMyBuses);

/**
 * @swagger
 * /buses/{id}:
 *   get:
 *     summary: Récupérer un bus par ID
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du bus
 *     responses:
 *       200:
 *         description: Détails du bus
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bus'
 *       404:
 *         description: Bus non trouvé
 */
app.get('/api/buses/:id', auth, validateObjectId, busController.getBusById);
app.get('/api/buses', busController.searchBuses);
/**
 * @swagger
 * /buses/{id}:
 *   put:
 *     summary: Mettre à jour un bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               plateNumber:
 *                 type: string
 *               capacity:
 *                 type: number
 *               availableSeats:
 *                 type: number
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               departureDate:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Bus mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bus'
 */
app.put('/api/buses/:id', auth, validateObjectId, busController.updateBus);

/**
 * @swagger
 * /buses/{id}:
 *   delete:
 *     summary: Supprimer un bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bus supprimé avec succès
 *       404:
 *         description: Bus non trouvé
 */
app.put('/api/bus/:id/activate', auth, busController.activateBus);
app.put('/api/bus/:id/deactivate', auth, busController.deactivateBus);
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

// -----------------
// Colis Routes
// -----------------
app.use('/api/colis', colisRoutes);

// -----------------
// Notifications Routes
// -----------------
app.use('/api/notifications', notificationsRoutes);

// -----------------
// Villes Routes
// -----------------
app.use('/api/villes', villeRoutes);

// OTP reénitialisation de mot de passe
app.use('/api/otp', otpRoutes);



// Catch-all
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint non trouvé' });
});

module.exports = app;
