// src/sockets/socketHandlers.js
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connecté');

    socket.on('disconnect', () => {
      console.log('Client déconnecté');
    });

    // Exemple d'événement Socket.IO
    socket.on('new-location', (data) => {
      console.log('Nouvelle localisation reçue:', data);
      io.emit('location-update', data); // Diffuse la localisation à tous les clients connectés
    });
  });
};