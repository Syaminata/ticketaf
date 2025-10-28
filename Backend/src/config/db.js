const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/ticketaf';
    console.log('Tentative de connexion à:', mongoUrl);
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    console.log('Vérifiez que MongoDB est démarré sur votre système');
    process.exit(1);
  }
};

module.exports = connectDB;
