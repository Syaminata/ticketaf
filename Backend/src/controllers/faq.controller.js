const Faq = require('../models/faq.model');

// GET /api/faqs — public, retourne uniquement les actifs triés par order
// ?audience=client|conducteur filtre par public cible (ou retourne all + audience)
const getAllFaqs = async (req, res) => {
  try {
    const { audience } = req.query;
    const query = { isActive: true };
    if (audience === 'client' || audience === 'conducteur') {
      query.targetAudience = { $in: ['all', audience] };
    }
    const faqs = await Faq.find(query).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: faqs });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET /api/faqs/admin — admin, retourne tous (actifs + inactifs)
const getAllFaqsAdmin = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: faqs });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// POST /api/faqs — admin, créer une FAQ
const createFaq = async (req, res) => {
  try {
    const { question, answer, isActive, targetAudience } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ message: 'La question et la réponse sont requises' });
    }
    const count = await Faq.countDocuments();
    const faq = await Faq.create({
      question: question.trim(),
      answer: answer.trim(),
      order: count,
      isActive: isActive !== false,
      targetAudience: targetAudience || 'all',
    });
    res.status(201).json({ success: true, data: faq });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// PUT /api/faqs/:id — admin, modifier une FAQ
const updateFaq = async (req, res) => {
  try {
    const { question, answer, isActive, order, targetAudience } = req.body;
    const faq = await Faq.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ introuvable' });

    if (question !== undefined) faq.question = question.trim();
    if (answer !== undefined) faq.answer = answer.trim();
    if (isActive !== undefined) faq.isActive = isActive;
    if (order !== undefined) faq.order = order;
    if (targetAudience !== undefined) faq.targetAudience = targetAudience;

    await faq.save();
    res.json({ success: true, data: faq });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// DELETE /api/faqs/:id — admin, supprimer une FAQ
const deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ introuvable' });
    res.json({ success: true, message: 'FAQ supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { getAllFaqs, getAllFaqsAdmin, createFaq, updateFaq, deleteFaq };