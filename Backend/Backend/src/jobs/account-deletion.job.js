const cron = require('node-cron');
const User = require('../models/user.model');

/**
 * Vérifie toutes les heures les comptes en attente de suppression
 * et supprime définitivement ceux dont le délai de 24h est dépassé.
 */
function initAccountDeletionCron() {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await User.deleteMany({
        pendingDeletion: true,
        deletionScheduledAt: { $lte: now },
      });
      if (result.deletedCount > 0) {
        console.log(`🗑️  Suppression automatique: ${result.deletedCount} compte(s) supprimé(s)`);
      }
    } catch (err) {
      console.error('❌ Erreur cron account-deletion:', err.message);
    }
  }, { scheduled: true, timezone: 'UTC' });

  console.log('🕐 Cron job suppression de comptes initialisé (toutes les heures)');
}

module.exports = { initAccountDeletionCron };
