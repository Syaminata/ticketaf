const path = require('path');
const fs = require('fs');
const Colis = require('../models/colis.model');
const Voyage = require('../models/voyage.model');
const User = require('../models/user.model');
const UserNotification = require('../models/userNotification.model');
const { emitToUser } = require('../socket');
const { sendNewColiNotification, sendColisStatusNotification, sendColisPriceNotification } = require('../services/email.service');
const { sendAndSaveNotification } = require('../services/notification.service');

// Types de notifications colis
const COLIS_NOTIF = {
  PRIX_DEFINI:  { title: 'Prix de votre colis défini',    type: 'COLIS_PRIX_DEFINI'  },
  ENREGISTRE:   { title: 'Colis enregistré',              type: 'COLIS_ENREGISTRE'   },
  ENVOYE:       { title: 'Colis en cours d\'acheminement',type: 'COLIS_ENVOYE'       },
  RECU:         { title: 'Colis livré',                   type: 'COLIS_RECU'         },
};

const createColis = async (req, res) => {
  try {
    if (req.user.isActive === false) {
      return res.status(403).json({ message: 'Votre compte est désactivé, veuillez contacter le support.' });
    }

    const { description, voyageId, destination, dateEnvoi, villeDepart } = req.body;
    let destinataire;
    if (req.body.destinataire) {
      destinataire = {
        nom: req.body.destinataire.nom || req.body['destinataire[nom]'],
        telephone: req.body.destinataire.telephone || req.body['destinataire[telephone]'],
        adresse: req.body.destinataire.adresse || req.body['destinataire[adresse]'] || ''
      };
    } else {
      destinataire = {
        nom: req.body['destinataire[nom]'],
        telephone: req.body['destinataire[telephone]'],
        adresse: req.body['destinataire[adresse]'] || ''
      };
    }

    if (!destinataire.nom || !destinataire.telephone) {
      return res.status(400).json({ message: 'Informations destinataire requises' });
    }

    const colisData = {
      expediteur: req.user._id,
      destinataire,
      description: description || '',
      status: 'en attente',
      createdBy: req.user._id,
      destination,
      dateEnvoi: dateEnvoi ? new Date(dateEnvoi) : undefined,
      villeDepart,
      voyage: voyageId
    };

    if (req.file) colisData.imageUrl = `/uploads/colis/${req.file.filename}`;

    const colis = await Colis.create(colisData);

    // Notification push + in-app pour l'expéditeur
    await sendAndSaveNotification(
      req.user._id,
      'Colis enregistré',
      `Votre colis de ${villeDepart} vers ${destination} est en attente de validation`,
      {
        type: 'info',
        tripType: 'colis',
        colisId: colis._id.toString(),
      }
    );

    res.status(201).json({ message: 'Colis créé', colis });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

const getUserColis = async (req, res) => {
  try {
    const colis = await Colis.find({ expediteur: req.user._id })
      .populate('expediteur', 'name numero')
      .sort({ createdAt: -1 });
    res.json(colis);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getAllColis = async (req, res) => {
  try {
    const colis = await Colis.find()
      .populate('expediteur', 'name numero email')
      .populate('createdBy', 'name numero')
      .sort({ createdAt: -1 });
    res.json(colis);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getColisById = async (req, res) => {
  try {
    const colis = await Colis.findById(req.params.id)
      .populate('expediteur', 'name numero email')
      .populate('createdBy', 'name numero');
    if (!colis) return res.status(404).json({ message: 'Non trouvé' });
    res.json(colis);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateColis = async (req, res) => {
  try {
    const colis = await Colis.findById(req.params.id);
    if (!colis) return res.status(404).json({ message: 'Colis non trouvé' });
    const updated = await Colis.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (colis.expediteur && req.body.status && req.body.status !== colis.status) {
      const messages = {
        'envoyé':  'Votre colis est en cours d\'acheminement.',
        'reçu':    'Votre colis a été livré avec succès.',
        'annulé':  `Votre colis vers ${colis.destination} a été annulé.`,
      };
      const msg = messages[req.body.status];
      if (msg) {
        await sendAndSaveNotification(
          colis.expediteur,
          req.body.status === 'reçu' ? 'Colis livré' : req.body.status === 'envoyé' ? 'Colis en route' : 'Statut colis mis à jour',
          msg,
          { type: req.body.status === 'reçu' ? 'success' : 'info', colisId: colis._id.toString(), screen: 'colis' }
        );
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deleteColis = async (req, res) => {
  try {
    await Colis.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const trackColis = async (req, res) => {
  try {
    const colis = await Colis.findOne({ trackingNumber: req.params.trackingNumber });
    if (!colis) return res.status(404).json({ message: 'Non trouvé' });
    res.json(colis);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getColisStats = async (req, res) => {
  try {
    const total = await Colis.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateColisPrix = async (req, res) => {
  try {
    const Reservation = require('../models/reservation.model');
    const colis = await Colis.findById(req.params.id);
    if (!colis) return res.status(404).json({ message: 'Colis non trouvé' });
    const updated = await Colis.findByIdAndUpdate(req.params.id, { prix: req.body.prix }, { new: true });

    let recipientId = colis.expediteur;
    if (!recipientId && colis.reservation) {
      const reservation = await Reservation.findById(colis.reservation).select('user');
      recipientId = reservation?.user;
    }

    if (recipientId) {
      const destination = colis.destination || '';
      await sendAndSaveNotification(
        recipientId,
        'Prix de votre colis défini',
        `Le prix d'envoi de votre colis${destination ? ' vers ' + destination : ''} est de ${req.body.prix} FCFA.`,
        { type: 'info', colisId: colis._id.toString(), screen: 'colis' }
      );
    }

    res.json(updated);
  } catch (err) {
    console.error('Erreur updateColisPrix:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const validateColis = async (req, res) => {
  try {
    const colis = await Colis.findById(req.params.id);
    if (!colis) return res.status(404).json({ message: 'Colis non trouvé' });
    const updated = await Colis.findByIdAndUpdate(req.params.id, { status: 'envoyé' }, { new: true });

    // Notification au client : confirmation d'acceptation du prix
    if (colis.expediteur) {
      await sendAndSaveNotification(
        colis.expediteur,
        'Prix accepté',
        `Vous avez accepté le prix pour votre colis vers ${colis.destination}. Il sera bientôt pris en charge.`,
        { type: 'success', colisId: colis._id.toString(), screen: 'colis' }
      );
    }

    // Notification aux admins : le client a accepté
    const admins = await User.find({ role: { $in: ['admin', 'superadmin', 'gestionnaireColis'] } }).select('_id');
    if (admins.length > 0) {
      await sendAndSaveNotification(
        admins.map(a => a._id),
        'Prix colis accepté',
        `Un client a accepté le prix pour son colis vers ${colis.destination}.`,
        { type: 'info', colisId: colis._id.toString(), screen: 'colis' }
      );
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const cancelColis = async (req, res) => {
  try {
    const colis = await Colis.findById(req.params.id);
    if (!colis) return res.status(404).json({ message: 'Colis non trouvé' });

    const isAdmin = ['admin', 'superadmin', 'gestionnaireColis'].includes(req.user?.role);
    const isOwner = String(colis.expediteur) === String(req.user?._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const updated = await Colis.findByIdAndUpdate(req.params.id, { status: 'annulé' }, { new: true });

    // Toujours notifier le client
    if (colis.expediteur) {
      await sendAndSaveNotification(
        colis.expediteur,
        'Colis annulé',
        `Votre colis vers ${colis.destination} a été annulé.`,
        { type: 'warning', colisId: colis._id.toString(), screen: 'colis' }
      );
    }

    // Si c'est le client qui annule → notifier les admins
    if (isOwner && !isAdmin) {
      const admins = await User.find({ role: { $in: ['admin', 'superadmin', 'gestionnaireColis'] } }).select('_id');
      if (admins.length > 0) {
        await sendAndSaveNotification(
          admins.map(a => a._id),
          'Colis annulé par le client',
          `Un client a annulé son colis vers ${colis.destination}.`,
          { type: 'warning', colisId: colis._id.toString(), screen: 'colis' }
        );
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  createColis,
  getUserColis,
  getAllColis,
  getColisById,
  updateColis,
  deleteColis,
  trackColis,
  getColisStats,
  updateColisPrix,
  validateColis,
  cancelColis
};