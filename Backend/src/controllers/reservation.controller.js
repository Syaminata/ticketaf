const Reservation = require('../models/reservation.model');
const Colis = require('../models/colis.model');
const Voyage = require('../models/voyage.model');
const User = require('../models/user.model');
const Bus = require('../models/bus.model');
const { sendNotification, cleanupInvalidTokens } = require('../services/notification.service');


const createReservation = async (req, res) => {
  try {
    const { voyageId, busId, ticket, quantity, description, delivery } = req.body;

    
    if ( !ticket || !quantity) {
      return res.status(400).json({ message: 'type de ticket et quantité sont requis' });
    }

    if (!voyageId && !busId) {
      return res.status(400).json({ message: 'Au moins un voyage ou un bus doit être spécifié' });
    }

    if (voyageId && busId) {
      return res.status(400).json({ message: 'Uniquement un voyage OU un bus peut être spécifié, pas les deux' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (voyageId) {
      const voyage = await Voyage.findById(voyageId);
      if (!voyage) return res.status(404).json({ message: 'Voyage non trouvé' });
      if (ticket === 'place' && voyage.availableSeats < quantity) {
        return res.status(400).json({ message: `Pas assez de places disponibles. Places restantes: ${voyage.availableSeats}` });
      }
    }

    if (busId) {
      const bus = await Bus.findById(busId);
      if (!bus) return res.status(404).json({ message: 'Bus non trouvé' });
      
      // Vérifier si le bus est actif
      if (bus.isActive === false) {
        return res.status(400).json({ message: 'Ce bus n\'est pas disponible pour le moment' });
      }
      
      if (ticket === 'place' && (bus.availableSeats === undefined || bus.availableSeats === null)) {
        await Bus.findByIdAndUpdate(busId, { availableSeats: bus.capacity });
        bus.availableSeats = bus.capacity;
      }
      if (ticket === 'place' && bus.availableSeats < quantity) {
        return res.status(400).json({ message: `Pas assez de places disponibles. Places restantes: ${bus.availableSeats}` });
      }
    }

    // Créer la réservation
    const reservationData = { user: userId, ticket, quantity };
    if (voyageId) reservationData.voyage = voyageId;
    if (busId) reservationData.bus = busId;

    const reservation = await Reservation.create(reservationData);

    // NOTIFICATIONS METIER
    if (ticket === 'place' && voyageId) {
      const voyage = await Voyage.findById(voyageId)
        .populate('driver');

      if (voyage && voyage.driver) {
        const driver = voyage.driver;

        // Notification chauffeur : nouvelle réservation
        console.log('🔍 Vérification notification chauffeur:', {
          driverId: driver._id,
          driverName: driver.name,
          hasTokens: driver.fcmTokens && driver.fcmTokens.length > 0,
          tokenCount: driver.fcmTokens?.length || 0,
          tokens: driver.fcmTokens?.map(t => t.token.substring(0, 20) + '...') || []
        });
        
        if (driver.fcmTokens && driver.fcmTokens.length > 0) {
          const driverTokens = [...new Set(driver.fcmTokens.map(t => t.token))];
          console.log('📤 Envoi notification chauffeur pour voyage:', voyage._id);
          const result = await sendNotification(
            driverTokens,
            'Nouvelle réservation',
            `${user.name} a réservé ${quantity} place(s) sur ${voyage.from} → ${voyage.to}`,
            {
              type: 'NEW_RESERVATION',
              voyageId: voyage._id.toString(),
              reservationId: reservation._id.toString()
            }
          );
          
          // Nettoyer les tokens invalides
          if (result.invalidTokens && result.invalidTokens.length > 0) {
            await cleanupInvalidTokens(result.invalidTokens);
          }
        } else {
          console.log('❌ Chauffeur sans token FCM - notification non envoyée');
        }

        //Notification client : confirmation
        if (user.fcmTokens && user.fcmTokens.length > 0) {
          const userTokens = [...new Set(user.fcmTokens.map(t => t.token))];
          const result = await sendNotification(
            userTokens,
            'Réservation confirmée',
            `Votre place pour ${voyage.from} → ${voyage.to} est confirmée`,
            {
              type: 'RESERVATION_CONFIRMED',
              voyageId: voyage._id.toString()
            }
          );
          
          // Nettoyer les tokens invalides
          if (result.invalidTokens && result.invalidTokens.length > 0) {
            await cleanupInvalidTokens(result.invalidTokens);
          }
        }

        // Voyage plein
        if (voyage.availableSeats - quantity === 0) {
          await Voyage.findByIdAndUpdate(voyageId, { status: 'FULL' });

          if (driver.fcmTokens && driver.fcmTokens.length > 0) {
            const driverTokens = [...new Set(driver.fcmTokens.map(t => t.token))];
            const result = await sendNotification(
              driverTokens,
              'Voyage complet',
              'Toutes les places ont été réservées',
              {
                type: 'VOYAGE_FULL',
                voyageId: voyage._id.toString()
              }
            );
            
            // Nettoyer les tokens invalides
            if (result.invalidTokens && result.invalidTokens.length > 0) {
              await cleanupInvalidTokens(result.invalidTokens);
            }
          }
        }
      }
    }

    // Créer le colis si ticket === 'colis'
    let colisDoc = null;
    if (ticket === 'colis') {
      if (!description) {
        return res.status(400).json({ message: 'Description est requise pour un colis' });
      }
      colisDoc = await Colis.create({
        reservation: reservation._id,
        description,
        status: 'en attente'
      });
    }

    // Diminuer le nombre de places disponibles si ticket === place
    if (ticket === 'place') {
      if (voyageId) await Voyage.findByIdAndUpdate(voyageId, { $inc: { availableSeats: -quantity } });
      if (busId) await Bus.findByIdAndUpdate(busId, { $inc: { availableSeats: -quantity } });
    }

    // Populate pour retourner les données complètes
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus');

    res.status(201).json({
      message: 'Réservation créée',
      reservation: populatedReservation,
      colis: colisDoc
    });

  } catch (err) {
    console.error('Erreur createReservation:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET ALL RESERVATIONS

const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus')
      .sort({ createdAt: -1 });

    // Récupérer les descriptions de colis associées aux réservations (si existantes)
    const reservationIds = reservations.map(r => r._id);
    const colisList = await Colis.find({ reservation: { $in: reservationIds } })
      .select('reservation description');
    const colisByReservation = new Map(colisList.map(c => [String(c.reservation), c.description]));

    const enriched = reservations.map(r => {
      const obj = r.toObject();
      obj.colisDescription = colisByReservation.get(String(r._id)) || null;
      return obj;
    });

    res.status(200).json(enriched);
  } catch (err) {
    console.error('Erreur getAllReservations:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// GET RESERVATION BY ID

const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus');
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    const colis = await Colis.findOne({ reservation: reservation._id }).select('description');
    const obj = reservation.toObject();
    obj.colisDescription = colis ? colis.description : null;

    res.status(200).json(obj);
  } catch (err) {
    console.error('Erreur getReservationById:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// UPDATE RESERVATION

const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Si pas admin/superadmin, vérifier que la réservation appartient au user
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      if (String(reservation.user) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres réservations' });
      }
    }

    // Appliquer la mise à jour
    Object.assign(reservation, req.body);
    await reservation.save();

    const populated = await Reservation.findById(reservation._id)
      .populate('user', '-password')
      .populate({
        path: 'voyage',
        populate: { path: 'driver', select: '-password' }
      })
      .populate('bus');

    res.status(200).json({ message: 'Réservation mise à jour', reservation: populated });
  } catch (err) {
    console.error('Erreur updateReservation:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};


// DELETE RESERVATION

const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    // Si pas admin/superadmin, vérifier que la réservation appartient au user
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      if (String(reservation.user) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres réservations' });
      }
    }

    // Remettre les places disponibles si ticket === 'place'
    if (reservation.ticket === 'place') {
      if (reservation.voyage) await Voyage.findByIdAndUpdate(reservation.voyage, { $inc: { availableSeats: reservation.quantity } });
      if (reservation.bus) await Bus.findByIdAndUpdate(reservation.bus, { $inc: { availableSeats: reservation.quantity } });
    }

    await Reservation.findByIdAndDelete(req.params.id);

    if (reservation.ticket === 'colis') {
      await Colis.deleteOne({ reservation: reservation._id });
    }

    res.status(200).json({ message: 'Réservation supprimée' });
  } catch (err) {
    console.error('Erreur deleteReservation:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = {createReservation,getAllReservations, getReservationById,updateReservation,deleteReservation};

