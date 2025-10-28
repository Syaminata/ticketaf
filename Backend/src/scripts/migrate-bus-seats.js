const mongoose = require('mongoose');
const Bus = require('../models/bus.model');

const migrateBusSeats = async () => {
  try {
    console.log('Début de la migration des places de bus...');
    
    const buses = await Bus.find({});
    let updatedCount = 0;
    
    for (const bus of buses) {
      if (bus.availableSeats === undefined || bus.availableSeats === null || bus.availableSeats < 0) {
        await Bus.findByIdAndUpdate(bus._id, { 
          availableSeats: bus.capacity 
        });
        updatedCount++;
        console.log(`Bus ${bus.name} (${bus.plateNumber}) mis à jour: ${bus.capacity} places disponibles`);
      }
    }
    
    console.log(`Migration terminée: ${updatedCount} bus mis à jour`);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  }
};

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketaf')
    .then(() => {
      console.log('Connexion à MongoDB réussie');
      return migrateBusSeats();
    })
    .then(() => {
      console.log('Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}

module.exports = migrateBusSeats;
