const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Driver = require('./src/models/driver.model');

async function cleanupDuplicateTokens() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketaf');
    console.log('🔗 Connecté à MongoDB');

    // Nettoyer les tokens pour les utilisateurs
    const users = await User.find({});
    console.log(`📊 Traitement de ${users.length} utilisateurs...`);

    let totalDuplicatesRemoved = 0;

    for (const user of users) {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        // Créer une Map pour dédupliquer basé sur le token
        const uniqueTokens = new Map();
        
        user.fcmTokens.forEach(tokenObj => {
          const key = tokenObj.token;
          if (!uniqueTokens.has(key) || new Date(tokenObj.lastActive) > new Date(uniqueTokens.get(key).lastActive)) {
            uniqueTokens.set(key, tokenObj);
          }
        });

        const uniqueTokensArray = Array.from(uniqueTokens.values());
        const duplicatesCount = user.fcmTokens.length - uniqueTokensArray.length;
        
        if (duplicatesCount > 0) {
          console.log(`🧹 ${duplicatesCount} doublons supprimés pour l'utilisateur ${user.name} (${user._id})`);
          totalDuplicatesRemoved += duplicatesCount;
          
          await User.findByIdAndUpdate(user._id, {
            fcmTokens: uniqueTokensArray
          });
        }
      }
    }

    // Faire la même chose pour les drivers (si ils ont aussi fcmTokens)
    const drivers = await Driver.find({});
    console.log(`📊 Traitement de ${drivers.length} chauffeurs...`);

    for (const driver of drivers) {
      if (driver.fcmTokens && driver.fcmTokens.length > 0) {
        const uniqueTokens = new Map();
        
        driver.fcmTokens.forEach(tokenObj => {
          const key = tokenObj.token;
          if (!uniqueTokens.has(key) || new Date(tokenObj.lastActive) > new Date(uniqueTokens.get(key).lastActive)) {
            uniqueTokens.set(key, tokenObj);
          }
        });

        const uniqueTokensArray = Array.from(uniqueTokens.values());
        const duplicatesCount = driver.fcmTokens.length - uniqueTokensArray.length;
        
        if (duplicatesCount > 0) {
          console.log(`🧹 ${duplicatesCount} doublons supprimés pour le chauffeur ${driver.name} (${driver._id})`);
          totalDuplicatesRemoved += duplicatesCount;
          
          await Driver.findByIdAndUpdate(driver._id, {
            fcmTokens: uniqueTokensArray
          });
        }
      }
    }

    console.log(`✅ Nettoyage terminé! ${totalDuplicatesRemoved} doublons supprimés au total.`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  }
}

cleanupDuplicateTokens();
