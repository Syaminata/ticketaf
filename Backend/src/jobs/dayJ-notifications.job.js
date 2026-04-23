const cron = require('node-cron');
const { sendDayJNotifications } = require('../services/notification.service');

/**
 * Initialise le cron job pour envoyer les notifications du jour J
 * S'exécute chaque jour à 6h du matin (06:00)
 */
function initDayJNotificationsCron() {
  try {
    // Exécuter tous les jours à 6h du matin (fuseau horaire du serveur)
    // Format cron: minute heure jour mois jour_semaine
    const cronSchedule = '0 6 * * *'; // 6h00 chaque jour
    
    const task = cron.schedule(cronSchedule, async () => {
      console.log('⏰ Cron job déclenché - Envoi des notifications du jour J');
      try {
        const result = await sendDayJNotifications();
        console.log(`✅ Cron job terminé - ${result.processed} voyage(s) traité(s)`);
      } catch (error) {
        console.error('❌ Erreur lors de l\'exécution du cron job:', error.message);
      }
    }, {
      scheduled: true,
      timezone: 'UTC' // À modifier selon votre fuseau horaire (ex: "Africa/Dakar" pour le Sénégal)
    });

    console.log('🕐 Cron job des notifications du jour J initialisé (6h du matin UTC)');
    
    return task;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du cron job:', error.message);
  }
}

module.exports = { initDayJNotificationsCron };
