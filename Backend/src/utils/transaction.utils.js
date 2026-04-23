const mongoose = require('mongoose');

/**
 * Utilitaire pour gérer les transactions MongoDB
 * En développement local sans replica set, les transactions sont ignorées
 */

// Vérifie si les transactions sont supportées
const isTransactionSupported = async () => {
  try {
    const client = mongoose.connection.getClient();
    const admin = client.db('admin').admin();
    const status = await admin.serverStatus();
    
    // Vérifier si c'est un replica set
    return status.repl && (status.repl.setName || status.repl.ismaster);
  } catch (err) {
    return false;
  }
};

// Session factory qui retourne une session ou un mock
const createSession = async () => {
  const isSupported = await isTransactionSupported();
  
  if (!isSupported) {
    // Retourner une session mock pour les opérations sans transaction
    return {
      startTransaction: () => {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession: () => {},
      withTransaction: async (fn) => {
        try {
          return await fn();
        } catch (err) {
          throw err;
        }
      },
      _mockSession: true
    };
  }
  
  // Session réelle pour replica set
  const session = await mongoose.startSession();
  return session;
};

module.exports = {
  createSession,
  isTransactionSupported
};
