const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration des dossiers
const driversDir = path.join(__dirname, '../../uploads/drivers');
const colisDir = path.join(__dirname, '../../uploads/colis');

// Créer les dossiers s'ils n'existent pas
[driversDir, colisDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration du stockage pour les fichiers des conducteurs
const driverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, driversDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'driver-' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configuration du stockage pour les images de colis
const colisStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, colisDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'colis-' + uniqueSuffix + ext);
  },
});

// Filtre pour les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  // Autoriser les images et les PDF
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers images et PDF sont autorisés'), false);
  }
};

// Filtre pour les types de fichiers autorisés
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les JPEG, PNG et GIF sont acceptés.'));
  }
};

// Configuration de multer pour les conducteurs
const uploadDriver = multer({
  storage: driverStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Configuration de multer pour les colis
const uploadColis = multer({
  storage: colisStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Middleware pour l'upload des fichiers du driver
const uploadDriverFiles = uploadDriver.fields([
  { name: 'permis', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);

// Middleware pour l'upload d'images de colis
const uploadColisImage = uploadColis.single('image');

// Fonction pour supprimer une image de colis
const deleteColisImage = (filename) => {
  if (!filename) return;
  const filePath = path.join(colisDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  uploadDriverFiles,
  uploadColisImage,
  deleteColisImage
};
