const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');

dotenv.config();

// Connexion MongoDB
connectDB();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" }
});

// Exemple socket (pour suivre un bus en temps réel)
io.on('connection', (socket) => {
  console.log(' Client connecté via Socket.IO');

  socket.on('update-location', (data) => {
    io.emit('bus-location', data);
  });

  socket.on('disconnect', () => console.log(' Client déconnecté'));
});

server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
