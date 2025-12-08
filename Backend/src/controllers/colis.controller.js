const path = require('path');
const fs = require('fs');
const { uploadColisImage, deleteColisImage } = require('../middleware/upload');
const Colis = require('../models/colis.model');
const Voyage = require('../models/voyage.model');
const User = require('../models/user.model');

// Créer un colis avec upload d'image
const createColis = async (req, res) => {
  try {
    // Récupérer les données du formulaire
    const { description, voyageId } = req.body;
    const destinataire = {
      nom: req.body['destinataire[nom]'],
      telephone: req.body['destinataire[telephone]'],
      adresse: req.body['destinataire[adresse]'] || ''
    };

    // Validation des champs obligatoires
    if (!voyageId) {
      return res.status(400).json({ message: 'Le voyage est requis' });
    }

    if (!destinataire.nom || !destinataire.telephone) {
      return res.status(400).json({ 
        message: 'Les informations du destinataire sont requises (nom et téléphone)' 
      });
    }

    // Vérifier que le voyage existe
    const voyage = await Voyage.findById(voyageId);
    if (!voyage) {
      return res.status(404).json({ message: 'Voyage non trouvé' });
    }

    // Créer le colis
    const colisData = {
      voyage: voyageId,
      expediteur: req.user._id,
      destinataire: destinataire,
      description: description || '',
      status: 'en attente',
      createdBy: req.user._id
    };

    // Si une image a été téléchargée
    if (req.file) {
      colisData.imageUrl = `/uploads/colis/${req.file.filename}`;
    }

    const colis = new Colis(colisData);
    await colis.save();

    // Peupler les références pour la réponse
    const newColis = await Colis.findById(colis._id)
      .populate('voyage', 'from to date')
      .populate('expediteur', 'name email phone')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Colis créé avec succès',
      colis: newColis
    });
  } catch (error) {
    console.error('Erreur création colis:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les colis d'un utilisateur
const getUserColis = async (req, res) => {
  try {
    const colis = await Colis.find({ expediteur: req.user._id })
      .populate('voyage', 'from to date price')
      .sort({ createdAt: -1 });
      
    res.status(200).json(colis);
  } catch (err) {
    console.error('Erreur getUserColis:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des colis', 
      error: err.message 
    });
  }
};

// Récupérer tous les colis (admin)
const getAllColis = async (req, res) => {
  try {
    const { status, voyageId, expediteur } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (voyageId) filter.voyage = voyageId;
    if (expediteur) filter.expediteur = expediteur;

    const colis = await Colis.find(filter)
      .populate('expediteur', 'name email phone')
      .populate('voyage', 'from to date')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(colis);
  } catch (err) {
    console.error('Erreur getAllColis:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Récupérer un colis/place par ID
const getColisById = async (req, res) => {
  try {
    const colis = await Colis.findById(req.params.id)
      .populate('expediteur', 'name email phone')
      .populate('voyage', 'from to date driver')
      .populate('voyage.driver', 'name phone')
      .populate('createdBy', 'name email');

    if (!colis) {
      return res.status(404).json({ message: 'Colis/Place non trouvé' });
    }

    res.status(200).json(colis);
  } catch (err) {
    console.error('Erreur getColisById:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Mettre à jour un colis 
const updateColis = async (req, res) => {
  try {
    // Gérer l'upload de la nouvelle image si elle existe
    uploadColisImage(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ 
          message: 'Erreur lors du téléchargement de l\'image',
          error: err.message 
        });
      }

      const { destinataire, ...updateData } = req.body;
      const colis = await Colis.findById(req.params.id);

      if (!colis) {
        return res.status(404).json({ message: 'Colis non trouvé' });
      }

      // Valider le statut s'il est fourni
      if (updateData.status && !['en attente', 'envoyé', 'reçu', 'annulé'].includes(updateData.status)) {
        return res.status(400).json({ 
          message: 'Statut invalide. Les statuts valides sont: en attente, envoyé, reçu, annulé' 
        });
      }

      // Mise à jour des champs du destinataire si fournis
      if (destinataire) {
        updateData.$set = updateData.$set || {};
        if (destinataire.nom) updateData.$set['destinataire.nom'] = destinataire.nom;
        if (destinataire.telephone) updateData.$set['destinataire.telephone'] = destinataire.telephone;
        if (destinataire.adresse !== undefined) updateData.$set['destinataire.adresse'] = destinataire.adresse;
      }

      // Si une nouvelle image est téléchargée
      if (req.file) {
        // Supprimer l'ancienne image si elle existe
        if (colis.imageUrl) {
          const oldFilename = path.basename(colis.imageUrl);
          deleteColisImage(oldFilename);
        }
        updateData.$set = updateData.$set || {};
        updateData.$set.imageUrl = `/uploads/colis/${req.file.filename}`;
      }

      const updatedColis = await Colis.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('expediteur', 'name email phone')
      .populate('voyage', 'from to date driver')
      .populate('createdBy', 'name email');

      res.status(200).json({ 
        message: 'Colis mis à jour avec succès', 
        colis: updatedColis 
      });
    });
  } catch (err) {
    console.error('Erreur updateColis:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du colis', 
      error: err.message 
    });
  }
};

// Supprimer un colis
const deleteColis = async (req, res) => {
  try {
    const colis = await Colis.findById(req.params.id);

    if (!colis) {
      return res.status(404).json({ message: 'Colis non trouvé' });
    }

    // Supprimer l'image associée si elle existe
    if (colis.imageUrl) {
      const filename = path.basename(colis.imageUrl);
      deleteColisImage(filename);
    }

    await Colis.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Colis supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteColis:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression du colis', 
      error: err.message 
    });
  }
};

// Suivre un colis par numéro de suivi
const trackColis = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const colis = await Colis.findOne({ trackingNumber })
      .populate('voyage', 'from to date')
      .populate('expediteur', 'name phone')
      .populate({
        path: 'voyage',
        populate: {
          path: 'driver',
          select: 'name phone'
        }
      });

    if (!colis) {
      return res.status(404).json({ message: 'Colis non trouvé' });
    }

    res.status(200).json(colis);
  } catch (err) {
    console.error('Erreur trackColis:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Statistiques des colis et places
const getColisStats = async (req, res) => {
  try {
    const totalColis = await Colis.countDocuments();
    
    const colisByStatus = await Colis.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const colisByMonth = await Colis.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      totalColis,
      colisByStatus: colisByStatus.reduce((acc, curr) => ({
        ...acc,
        [curr._id]: curr.count
      }), {}),
      colisByMonth
    });
  } catch (err) {
    console.error('Erreur getColisStats:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
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
  getColisStats
};
