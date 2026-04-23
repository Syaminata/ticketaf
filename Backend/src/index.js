const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');
const socketManager = require('./socket');
const { initDayJNotificationsCron } = require('./jobs/dayJ-notifications.job');
const { initAccountDeletionCron } = require('./jobs/account-deletion.job');

dotenv.config();

// Fallback pour JWT_SECRET en développement si le fichier .env est manquant ou incomplet
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET non défini. Utilisation d\'une clé par défaut (DEV ONLY)');
  process.env.JWT_SECRET = 'ticketaf_secret_key_2024_local_dev';
}

// Connexion MongoDB
connectDB();

// Initialiser les cron jobs
initDayJNotificationsCron();
initAccountDeletionCron();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialisation Socket.IO
socketManager.init(server);

// Force l'écoute sur 0.0.0.0 pour être accessible sur le réseau local (WiFi)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Accès local: http://localhost:${PORT}`);
  console.log(`🌐 Accès réseau: http://192.168.1.35:${PORT}`);
});
