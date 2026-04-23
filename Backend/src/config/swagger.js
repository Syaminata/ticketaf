const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Ticketaf',
      version: '1.0.0',
      description: 'Documentation complète de l\'API Ticketaf - Système de réservation de tickets de transport',
      contact: {
        name: 'Support API',
        email: 'support@ticketaf.com'
      }
    },
    servers: [
      {
        url: 'https://ticket-taf.itea.africa/api',
        description: 'Serveur de production'
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Serveur local de développement'
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
      { name: 'Notifications', description: 'Gestion des notifications' },
      { name: 'Colis', description: 'Gestion des colis' },
      { name: 'Villes', description: 'Gestion des villes' },
      { name: 'OTP', description: 'Réinitialisation de mot de passe par OTP' },
      { name: 'Admin - Drivers', description: 'Administration des conducteurs' },
      { name: 'Admin - Voyages', description: 'Administration des voyages' }
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
            address: { type: 'string', description: 'Adresse de l\'utilisateur' },
            role: { type: 'string', enum: ['client', 'admin', 'conducteur', 'superadmin', 'gestionnaireColis', 'entreprise'], default: 'client' },
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
            price: { type: 'number' },
            isActive: { type: 'boolean', default: false, description: 'Indique si le bus est actif' },
            owner: { type: 'string', description: 'ID propriétaire (entreprise)' }
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
            totalSeats: { type: 'number', default: 5 },
            availableSeats: { type: 'number', default: 5 },
            status: { type: 'string', enum: ['CREATED', 'OPEN', 'FULL', 'STARTED', 'FINISHED'], description: 'Statut du voyage' }
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
            quantity: { type: 'number', default: 1 },
            status: { type: 'string', enum: ['confirmé', 'terminé', 'annulé'], description: 'Statut de la réservation' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
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
        Colis: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'ID unique du colis' },
            voyage: { type: 'string', description: 'Référence au voyage (ID Voyage)' },
            expediteur: { type: 'string', description: 'Référence à l\'utilisateur expéditeur (ID User)' },
            destinataire: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                telephone: { type: 'string' },
                adresse: { type: 'string' }
              }
            },
            destination: { type: 'string', description: 'Ville de destination du colis' },
            villeDepart: { type: 'string', description: 'Ville de départ du colis' },
            dateEnvoi: { type: 'string', format: 'date-time', description: 'Date d\'envoi prévue' },
            description: { type: 'string' },
            imageUrl: { type: 'string', description: 'URL de l\'image du colis' },
            status: {
              type: 'string',
              enum: ['en attente', 'enregistré', 'envoyé', 'reçu', 'annulé'],
              description: 'Statut du colis'
            },
            prix: { type: 'number', minimum: 0, description: 'Prix du colis' },
            trackingNumber: { type: 'string', description: 'Numéro de suivi unique' },
            createdBy: { type: 'string', description: 'ID de l\'utilisateur qui a créé le colis' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Ville: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'ID unique de la ville' },
            nom: {
              type: 'string',
              description: 'Nom de la ville',
              minLength: 2,
              maxLength: 100
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        UserNotification: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'ID unique de la notification' },
            user: { type: 'string', description: 'ID de l\'utilisateur destinataire' },
            title: { type: 'string', description: 'Titre de la notification' },
            body: { type: 'string', description: 'Contenu de la notification' },
            type: { type: 'string', description: 'Type de notification' },
            read: { type: 'boolean', default: false, description: 'Indique si la notification a été lue' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        NotificationLog: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'ID unique du log' },
            title: { type: 'string', description: 'Titre de la notification envoyée' },
            body: { type: 'string', description: 'Contenu de la notification envoyée' },
            target: { type: 'string', description: 'Cible de la notification (description)' },
            type: { type: 'string', description: 'Type de notification' },
            sentCount: { type: 'number', description: 'Nombre d\'envois réussis' },
            failedCount: { type: 'number', description: 'Nombre d\'envois échoués' },
            sentBy: { type: 'string', description: 'ID de l\'admin qui a envoyé la notification' },
            createdAt: { type: 'string', format: 'date-time' }
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
            firebaseToken: { type: 'string', description: 'Firebase Custom Token for mobile authentication' },
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
