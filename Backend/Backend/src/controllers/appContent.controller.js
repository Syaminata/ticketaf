const AppContent = require('../models/appContent.model');

// Récupérer un contenu par clé
const getContent = async (req, res) => {
  try {
    const { key } = req.params;
    
    // Valider que la clé est valide
    const validKeys = ['privacy_policy', 'terms_conditions', 'about_app', 'contact_info'];
    if (!validKeys.includes(key)) {
      return res.status(400).json({ message: 'Clé de contenu invalide' });
    }

    let content = await AppContent.findOne({ key });

    // Si le contenu n'existe pas, créer du contenu par défaut
    if (!content) {
      const defaultContents = {
        privacy_policy: {
          title: 'Politique de Confidentialité',
          content: 'Politique de confidentialité de Ticketaf - À compléter'
        },
        terms_conditions: {
          title: 'Conditions d\'Utilisation',
          content: 'Conditions d\'utilisation de Ticketaf - À compléter'
        },
        about_app: {
          title: 'À propos de l\'application',
          content: 'À propos de Ticketaf - À compléter'
        },
        contact_info: {
          title: 'Informations de Contact',
          content: 'Informations de contact de Ticketaf - À compléter'
        }
      };

      content = await AppContent.create({
        key,
        title: defaultContents[key].title,
        content: defaultContents[key].content
      });
    }

    res.json(content);

  } catch (err) {
    console.error('Erreur lors de la récupération du contenu:', err);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: err.message 
    });
  }
};

// Mettre à jour un contenu
const updateContent = async (req, res) => {
  try {
    const { key } = req.params;
    const { title, content } = req.body;

    // Valider que la clé est valide
    const validKeys = ['privacy_policy', 'terms_conditions', 'about_app', 'contact_info'];
    if (!validKeys.includes(key)) {
      return res.status(400).json({ message: 'Clé de contenu invalide' });
    }

    if (!title || !content) {
      return res.status(400).json({ message: 'Le titre et le contenu sont requis' });
    }

    let appContent = await AppContent.findOne({ key });

    if (!appContent) {
      appContent = await AppContent.create({
        key,
        title,
        content,
        lastUpdatedBy: req.user.id
      });
    } else {
      appContent.title = title;
      appContent.content = content;
      appContent.lastUpdatedBy = req.user.id;
      await appContent.save();
    }

    res.json({
      success: true,
      message: 'Contenu mis à jour avec succès',
      data: appContent
    });

  } catch (err) {
    console.error('Erreur lors de la mise à jour du contenu:', err);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: err.message 
    });
  }
};

// Récupérer tous les contenus
const getAllContents = async (req, res) => {
  try {
    const contents = await AppContent.find({});

    // Si aucun contenu n'existe, créer les contenus par défaut
    if (contents.length === 0) {
      const defaultContents = [
        {
          key: 'privacy_policy',
          title: 'Politique de Confidentialité',
          content: 'Politique de confidentialité de Ticketaf - À compléter'
        },
        {
          key: 'terms_conditions',
          title: 'Conditions d\'Utilisation',
          content: 'Conditions d\'utilisation de Ticketaf - À compléter'
        },
        {
          key: 'about_app',
          title: 'À propos de l\'application',
          content: 'À propos de Ticketaf - À compléter'
        },
        {
          key: 'contact_info',
          title: 'Informations de Contact',
          content: 'Informations de contact de Ticketaf - À compléter'
        }
      ];

      const created = await AppContent.insertMany(defaultContents);
      return res.json({
        success: true,
        data: created
      });
    }

    res.json({
      success: true,
      data: contents
    });

  } catch (err) {
    console.error('Erreur lors de la récupération des contenus:', err);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: err.message 
    });
  }
};

module.exports = {
  getContent,
  updateContent,
  getAllContents
};
