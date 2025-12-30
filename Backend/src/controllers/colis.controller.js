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
    let destinataire;
    if (req.body.destinataire) {
      // Si les données viennent d'un objet JSON (cas de l'API)
      destinataire = {
        nom: req.body.destinataire.nom || req.body['destinataire[nom]'],
        telephone: req.body.destinataire.telephone || req.body['destinataire[telephone]'],
        adresse: req.body.destinataire.adresse || req.body['destinataire[adresse]'] || ''
      };
    } else {
      // Ancien format pour rétrocompatibilité
      destinataire = {
        nom: req.body['destinataire[nom]'],
        telephone: req.body['destinataire[telephone]'],
        adresse: req.body['destinataire[adresse]'] || ''
      };
    }

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
      .populate('expediteur', 'name email numero')
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
      .populate('expediteur', 'name email numero')
      .populate('voyage', 'from to date')
      .populate('createdBy', 'name email numero')
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
      .populate('expediteur', 'name email numero')
      .populate('voyage', 'from to date driver')
      .populate('voyage.driver', 'name numero')
      .populate('createdBy', 'name email numero');

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
    const { destinataire, prix, description, status, voyageId } = req.body;
    
    const colis = await Colis.findById(req.params.id);

    if (!colis) {
      return res.status(404).json({ message: 'Colis non trouvé' });
    }

    // Préparer les données de mise à jour
    const updateData = {};

    // Valider le statut s'il est fourni
    if (status && !['en attente', 'envoyé', 'reçu', 'annulé'].includes(status)) {
      return res.status(400).json({ 
        message: 'Statut invalide. Les statuts valides sont: en attente, envoyé, reçu, annulé' 
      });
    }

    // Mettre à jour les champs simples
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (voyageId !== undefined) updateData.voyage = voyageId;

    // Valider et mettre à jour le prix si fourni
    if (prix !== undefined && prix !== null && prix !== '') {
      const prixNumber = parseFloat(prix);
      if (isNaN(prixNumber) || prixNumber < 0) {
        return res.status(400).json({ 
          message: 'Le prix doit être un nombre positif' 
        });
      }
      updateData.prix = prixNumber;
    }

    // Mise à jour des champs du destinataire si fournis
    if (destinataire) {
      updateData.$set = updateData.$set || {};
      
      // Parser le destinataire s'il vient du FormData
      let destData = destinataire;
      if (typeof destinataire === 'string') {
        try {
          destData = JSON.parse(destinataire);
        } catch (e) {
          // Si ce n'est pas du JSON, essayer de récupérer depuis req.body
          destData = {
            nom: req.body['destinataire[nom]'],
            telephone: req.body['destinataire[telephone]'],
            adresse: req.body['destinataire[adresse]']
          };
        }
      }
      
      if (destData.nom) updateData.$set['destinataire.nom'] = destData.nom;
      if (destData.telephone) updateData.$set['destinataire.telephone'] = destData.telephone;
      if (destData.adresse !== undefined) updateData.$set['destinataire.adresse'] = destData.adresse;
    }

    // Gérer l'upload d'image UNIQUEMENT si un fichier est présent
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
      .populate('expediteur', 'name numero')
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

// Mettre à jour le prix d'un colis (admin)
const updateColisPrix = async (req, res) => {
  try {
    const { id } = req.params;
    const { prix } = req.body;

    if (typeof prix !== 'number' || prix < 0) {
      return res.status(400).json({ message: 'Un prix valide est requis' });
    }

    const colis = await Colis.findById(id);
    if (!colis) {
      return res.status(404).json({ message: 'Colis non trouvé' });
    }

    // Mettre à jour uniquement le prix, garder le statut actuel
    colis.prix = prix;
    await colis.save();

    // Peupler les références pour la réponse
    const updatedColis = await Colis.findById(colis._id)
      .populate('voyage', 'from to date')
      .populate('expediteur', 'name  numero');

    res.json({ 
      message: 'Prix mis à jour avec succès', 
      colis: updatedColis
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du prix:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du prix',
      error: error.message 
    });
  }
};

// Valider un colis (client)
const validateColis = async (req, res) => {
  try {
    const { id } = req.params;
    
    const colis = await Colis.findById(id);
    if (!colis) {
      return res.status(404).json({ message: 'Colis non trouvé' });
    }

    // Vérifier que l'utilisateur est bien le propriétaire du colis
    if (colis.expediteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Non autorisé à valider ce colis' 
      });
    }

    // Vérifier que le prix a été défini par l'admin
    if (!colis.prix || colis.prix <= 0) {
      return res.status(400).json({ 
        message: 'Le prix doit être défini par l\'administrateur avant validation' 
      });
    }

    // Vérifier que le colis est en attente
    if (colis.status !== 'en attente') {
      return res.status(400).json({ 
        message: `Impossible de valider un colis avec le statut "${colis.status}"` 
      });
    }

    // Mettre à jour le statut à "envoyé"
    colis.status = 'envoyé';
    await colis.save();
    
    // Peupler les références pour la réponse
    const updatedColis = await Colis.findById(colis._id)
      .populate('voyage', 'from to date')
      .populate('expediteur', 'name email numero');
    
    res.json({ 
      message: 'Colis validé et envoyé avec succès',
      colis: updatedColis
    });
  } catch (error) {
    console.error('Erreur lors de la validation du colis:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la validation du colis',
      error: error.message 
    });
  }
};
// Annuler un colis (client)
const cancelColis = async (req, res) => {
  try {
    const { id } = req.params;
    
    const colis = await Colis.findById(id);
    if (!colis) {
      return res.status(404).json({ message: 'Colis non trouvé' });
    }

    // Vérifier que l'utilisateur est bien le propriétaire du colis
    if (colis.expediteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Non autorisé à annuler ce colis' 
      });
    }

    // Vérifier que le colis est en attente
    if (colis.status !== 'en attente') {
      return res.status(400).json({ 
        message: `Impossible d'annuler un colis avec le statut "${colis.status}". Seuls les colis "en attente" peuvent être annulés.` 
      });
    }

    // Mettre à jour le statut à "annulé"
    colis.status = 'annulé';
    await colis.save();
    
    // Peupler les références pour la réponse
    const updatedColis = await Colis.findById(colis._id)
      .populate('voyage', 'from to date')
      .populate('expediteur', 'name email numero');
    
    res.json({ 
      message: 'Colis annulé avec succès',
      colis: updatedColis
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du colis:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'annulation du colis',
      error: error.message 
    });
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
