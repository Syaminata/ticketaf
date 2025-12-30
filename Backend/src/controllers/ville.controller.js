const Ville = require('../models/ville.model');
const Voyage = require('../models/voyage.model');
const { validationResult } = require('express-validator');

exports.createVille = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom } = req.body;
    
    // Vérifier si la ville existe déjà
    const existingVille = await Ville.findOne({ nom: nom.toUpperCase() });
    if (existingVille) {
      return res.status(400).json({ message: 'Cette ville existe déjà' });
    }

    const ville = new Ville({
      nom,
      createdBy: req.user.id
    });

    await ville.save();
    res.status(201).json(ville);
  } catch (error) {
    console.error('Erreur lors de la création de la ville:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la ville' });
  }
};

exports.getAllVilles = async (req, res) => {
  try {
    const villes = await Ville.find()
      .select('nom')
      .sort('nom');
    res.json(villes);
  } catch (error) {
    console.error('Erreur lors de la récupération des villes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des villes' });
  }
};

exports.getVilleById = async (req, res) => {
  try {
    const ville = await Ville.findById(req.params.id);
    if (!ville) {
      return res.status(404).json({ message: 'Ville non trouvée' });
    }
    res.json(ville);
  } catch (error) {
    console.error('Erreur lors de la récupération de la ville:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la ville' });
  }
};

exports.updateVille = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, statut } = req.body;
    const ville = await Ville.findById(req.params.id);
    
    if (!ville) {
      return res.status(404).json({ message: 'Ville non trouvée' });
    }

    // Vérifier si le nom est déjà utilisé par une autre ville
    if (nom && nom.toUpperCase() !== ville.nom) {
      const existingVille = await Ville.findOne({ nom: nom.toUpperCase() });
      if (existingVille) {
        return res.status(400).json({ message: 'Ce nom de ville est déjà utilisé' });
      }
    }

    if (nom) ville.nom = nom;
    if (statut) ville.statut = statut;

    await ville.save();
    res.json(ville);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la ville:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la ville' });
  }
};

exports.deleteVille = async (req, res) => {
  try {
    const ville = await Ville.findById(req.params.id);
    if (!ville) {
      return res.status(404).json({ message: 'Ville non trouvée' });
    }

    // Vérifier si l'utilisateur est admin ou superadmin
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier si la ville est utilisée dans des voyages
    const isUsed = await Voyage.exists({ $or: [{ from: ville.nom }, { to: ville.nom }] });
    if (isUsed) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer cette ville car elle est utilisée dans des voyages' 
      });
    }

    await Ville.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ville supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la ville:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la ville' });
  }
};

exports.toggleVilleStatus = async (req, res) => {
  try {
    const ville = await Ville.findById(req.params.id);
    
    if (!ville) {
      return res.status(404).json({ message: 'Ville non trouvée' });
    }

    // Vérifier si on essaie de désactiver une ville utilisée dans des voyages actifs
    const usedInVoyages = await Voyage.findOne({ 
      date: { $gte: new Date() },
      $or: [
        { from: ville.nom },
        { to: ville.nom }
      ]
    });

    if (usedInVoyages) {
      return res.status(400).json({ 
        message: 'Impossible de désactiver cette ville car elle est utilisée dans des voyages à venir' 
      });
    }

    ville.statut = ville.statut === 'actif' ? 'inactif' : 'actif';
    await ville.save();
    
    res.json({ 
      message: `Ville marquée comme ${ville.statut} avec succès`,
      statut: ville.statut
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut de la ville:', error);
    res.status(500).json({ message: 'Erreur lors du changement de statut de la ville' });
  }
};
