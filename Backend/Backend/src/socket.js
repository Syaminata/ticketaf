const socketIo = require('socket.io');

let io = null;

/**
 * Initialise le serveur Socket.IO et configure les rooms utilisateur.
 * Doit être appelé une seule fois depuis index.js.
 */
function init(httpServer) {
  io = socketIo(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connecté via Socket.IO');

    // Rejoindre une room personnelle — le frontend envoie son userId après connexion
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 Socket rejoint room user:${userId}`);
      }
    });

    // Suivi GPS bus (comportement existant conservé)
    socket.on('update-location', (data) => {
      io.emit('bus-location', data);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client déconnecté');
    });
  });

  return io;
}

/**
 * Retourne l'instance io (ou null si non initialisée).
 */
function getIo() {
  return io;
}

/**
 * Émet un événement à un utilisateur précis via sa room.
 * Non bloquant : si io non initialisé ou room vide, l'appel est ignoré silencieusement.
 */
function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId.toString()}`).emit(event, data);
}

module.exports = { init, getIo, emitToUser };
