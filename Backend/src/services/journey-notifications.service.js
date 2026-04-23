const cron = require('node-cron');
const Voyage = require('../models/voyage.model');
const Reservation = require('../models/reservation.model');
const UserNotification = require('../models/userNotification.model');
const { emitToUser } = require('../socket');
const { sendEmail } = require('./email.service');

/**
 * Service de notifications pour les voyages "Jour J"
 * Envoie une notification aux passagers le jour de leur voyage
 */

// Démarrer le cron pour les notifications Jour J
const startJourneyDayNotifications = () => {
  console.log('[CRON] Démarrage des notifications "Jour J" - s\'exécute chaque jour à 06:00');

  // S'exécute chaque jour à 06:00 (heure serveur)
  cron.schedule('0 6 * * *', async () => {
    try {
      console.log('[CRON-JOURNEY] Vérification des voyages pour aujourd\'hui...');
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Récupérer tous les voyages d'aujourd'hui
      const voyages = await Voyage.find({
        dateDepart: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
          $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
        }
      }).populate('driverId', 'name email numero');

      console.log(`[CRON-JOURNEY] ${voyages.length} voyage(s) trouvé(s) pour aujourd'hui`);

      for (const voyage of voyages) {
        // Récupérer les réservations confirmées pour ce voyage
        const reservations = await Reservation.find({
          voyage: voyage._id,
          statut: 'confirmée'
        }).populate('userId', 'name email numero');

        console.log(`[CRON-JOURNEY] ${reservations.length} réservation(s) confirmée(s) pour le voyage ${voyage._id}`);

        // Envoyer une notification à chaque passager
        for (const reservation of reservations) {
          const user = reservation.userId;
          const message = `Votre voyage de ${voyage.depart} à ${voyage.arrivee} est prévu pour aujourd'hui à ${formatTime(voyage.dateDepart)}. Rejoignez le chauffeur à l'heure convenue.`;

          // Créer une notification in-app
          UserNotification.create({
            user: user._id,
            title: '🚗 Votre voyage est aujourd\'hui!',
            body: message,
            type: 'VOYAGE_JOUR_J',
            relatedVoyage: voyage._id,
            relatedReservation: reservation._id
          }).then(notif => {
            emitToUser(user._id.toString(), 'notification', {
              _id: notif._id,
              title: notif.title,
              body: notif.body,
              type: notif.type,
              createdAt: notif.createdAt
            });
            console.log(`✅ Notification "Jour J" envoyée à ${user.name}`);
          }).catch(err => console.warn('⚠️ Notification "Jour J" non créée:', err.message));

          // Envoyer un email de rappel — non bloquant
          if (user.email) {
            sendJourneyDayEmail(user.email, user.name, voyage, formatTime(voyage.dateDepart))
              .catch(err => console.warn(`⚠️ Email "Jour J" non envoyé à ${user.email}:`, err.message));
          }
        }
      }

      console.log('[CRON-JOURNEY] Notifications "Jour J" traitées avec succès');
    } catch (error) {
      console.error('[CRON-JOURNEY] Erreur lors du traitement des notifications "Jour J":', error);
    }
  });
};

/**
 * Envoyer un email de rappel du voyage
 */
const sendJourneyDayEmail = async (email, name, voyage, departTime) => {
  const subject = `🚗 Rappel: Votre voyage est aujourd'hui!`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #FFCC33 0%, #FFB700 100%); padding: 20px; border-radius: 8px; color: white; text-align: center;">
        <h1 style="margin: 0;">Votre Voyage est Aujourd'hui! 🚗</h1>
      </div>
      <div style="padding: 20px;">
        <p>Bonjour <strong>${name}</strong>,</p>
        
        <p>C'est le jour de votre voyage! Voici les détails:</p>
        
        <div style="background: #f0f0f0; padding: 15px; border-left: 4px solid #FFCC33; margin: 20px 0; border-radius: 4px;">
          <p><strong>Trajet:</strong> ${voyage.depart} → ${voyage.arrivee}</p>
          <p><strong>Heure de départ:</strong> ${departTime}</p>
          <p><strong>Type de transport:</strong> ${voyage.typeVoyage || 'Transport'}</p>
          <p><strong>Chauffeur:</strong> ${voyage.driverId?.name || 'N/A'}</p>
        </div>

        <p style="color: #666;">
          <strong>✓ Assurez-vous de:</strong><br>
          • Être prêt 15 minutes avant l'heure de départ<br>
          • Avoir votre ticket/code de réservation<br>
          • Apporter les documents d'identité requis
        </p>

        <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; color: #856404;">
          <strong>Besoin d'aide?</strong> Notre équipe d'assistance est disponible via WhatsApp.
        </p>

        <p style="color: #666; font-size: 14px;">Bon voyage!</p>
      </div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">© 2026 TicketAf - Tous les droits réservés</p>
    </div>
  `;
  
  return sendEmail(email, subject, htmlContent);
};

/**
 * Formatter l'heure
 */
const formatTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

module.exports = {
  startJourneyDayNotifications,
};
