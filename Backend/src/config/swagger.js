const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Ticketaf',
      version: '1.0.0',
      description: 'Documentation complète de l\'API Ticketaf - Système de réservation de tickets de bus',
      contact: {
        name: 'Support API',
        email: 'support@ticketaf.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api', 
        description: 'Serveur de développement'
      }
    ],
    tags: [
      { name: 'Test', description: 'Tests de connexion' },
      { name: 'Auth', description: 'Authentification et autorisation' },
      { name: 'Users', description: 'Gestion des utilisateurs' },
      { name: 'Drivers', description: 'Gestion des conducteurs' },
      { name: 'Buses', description: 'Gestion des bus' },
      { name: 'Voyages', description: 'Gestion des voyages' },
      { name: 'Reservations', description: 'Gestion des réservations' },
      { name: 'Annonces', description: 'Gestion des annonces' },
      { name: 'Stats', description: 'Statistiques et rapports' },
      { name: 'Notifications', description: 'Gestion des notifications' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu via /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'ID unique de l\'utilisateur' },
            name: { type: 'string', description: 'Nom de l\'utilisateur' },
            email: { type: 'string', format: 'email', nullable: true, description: 'Email de l\'utilisateur (optionnel)' },
            numero: { type: 'string', pattern: '^(77|78|76|70|75|33|71)\\d{7}$', description: 'Numéro de téléphone (9 chiffres)' },
            role: { type: 'string', enum: ['client', 'admin', 'conducteur', 'superadmin'], default: 'client' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Driver: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            numero: { type: 'string' },
            matricule: { type: 'string', description: 'Matricule du véhicule' },
            marque: { type: 'string', description: 'Marque du véhicule' },
            capacity: { type: 'number', description: 'Capacité du véhicule' },
            capacity_coffre: { type: 'string', enum: ['petit', 'moyen', 'grand'] },
            climatisation: { type: 'boolean', default: false },
            permis: { type: 'array', items: { type: 'object' } },
            photo: { type: 'array', items: { type: 'object' } },
            isActive: { type: 'boolean', default: false },
            role: { type: 'string', default: 'conducteur' }
          }
        },
        Bus: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            plateNumber: { type: 'string', description: 'Numéro de plaque' },
            capacity: { type: 'number' },
            availableSeats: { type: 'number' },
            from: { type: 'string', description: 'Ville de départ' },
            to: { type: 'string', description: 'Ville d\'arrivée' },
            departureDate: { type: 'string', format: 'date-time' },
            price: { type: 'number' }
          }
        },
        Voyage: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            driver: { type: 'string', description: 'ID du conducteur' },
            from: { type: 'string' },
            to: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            price: { type: 'number' },
            totalSeats: { type: 'number', default: 4 },
            availableSeats: { type: 'number', default: 4 }
          }
        },
        Reservation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            voyage: { type: 'string', description: 'ID du voyage (optionnel si bus est fourni)' },
            bus: { type: 'string', description: 'ID du bus (optionnel si voyage est fourni)' },
            user: { type: 'string', description: 'ID de l\'utilisateur' },
            ticket: { type: 'string', enum: ['place', 'colis'], default: 'place' },
            quantity: { type: 'number', default: 1 }
          }
        },
        Annonce: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
            datePublication: { type: 'string', format: 'date-time' },
            dateFin: { type: 'string', format: 'date-time' },
            createdBy: { type: 'string', description: 'ID de l\'utilisateur créateur' },
            published: { type: 'boolean', default: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string', description: 'JWT token' },
            user: { $ref: '#/components/schemas/User' }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../app.js')
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;