const path = require('path');
const Annonce = require('../models/annonce.model');

exports.createAnnonce = async (req, res) => {
  try {
    const { title, description, datePublication, dateFin } = req.body;

    if (!title || !description || !datePublication || !dateFin) {
      return res.status(400).json({ message: 'Titre, description, date de publication et date de fin sont requis.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: "L'image est requise." });
    }

    const imageUrl = `/uploads/annonces/${req.file.filename}`;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      datePublication: new Date(datePublication),
      dateFin: new Date(dateFin),
      imageUrl,
    };

    if (req.user && req.user._id) {
      payload.createdBy = req.user._id;
    }

    const created = await Annonce.create(payload);
    return res.status(201).json({ message: 'Annonce créée', annonce: created });
  } catch (err) {
    console.error('Erreur création annonce:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

//  list annonces
exports.listAnnonces = async (req, res) => {
  try {
    const list = await Annonce.find().sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error('Erreur liste annonces:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Update annonce (title, description, and optionally image)
exports.updateAnnonce = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, datePublication, dateFin } = req.body;

    const update = {};
    if (typeof title !== 'undefined') update.title = String(title).trim();
    if (typeof description !== 'undefined') update.description = String(description).trim();
    if (typeof datePublication !== 'undefined') update.datePublication = new Date(datePublication);
    if (typeof dateFin !== 'undefined') update.dateFin = new Date(dateFin);
    if (req.file) {
      update.imageUrl = `/uploads/annonces/${req.file.filename}`;
    }

    const updated = await Annonce.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Annonce non trouvée' });
    return res.json({ message: 'Annonce mise à jour', annonce: updated });
  } catch (err) {
    console.error('Erreur update annonce:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Delete annonce
exports.deleteAnnonce = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Annonce.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Annonce non trouvée' });
    return res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    console.error('Erreur suppression annonce:', err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
