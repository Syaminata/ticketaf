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
  console.log('Type MIME reçu:', file.mimetype);
  console.log('Nom du fichier:', file.originalname);
  
  // Formats d'image supportés : JPEG, PNG, GIF, HEIC/HEIF, WebP, et formats bruts d'appareils photo
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', // Certains appareils utilisent jpg au lieu de jpeg
    'image/png',
    'image/gif',
    'image/heic',
    'image/heif',
    'image/webp',
    'image/x-canon-cr2',
    'image/x-nikon-nef',
    'image/x-sony-arw',
    'image/x-fuji-raf',
    'image/x-panasonic-rw2',
    'image/x-olympus-orf',
    'image/x-pentax-pef',
    'image/x-samsung-srw',
    // Types MIME spécifiques aux appareils Samsung
    'image/jpg',
    'image/jxr',
    'image/vnd.ms-photo',
    'image/vnd.samsung.samsungphoto',
    'image/vnd.samsung.samsung-image',
    // Types MIME génériques supplémentaires
    'image/*'  // Accepter tout type d'image (à utiliser avec prudence)
  ];
  
  // Vérifier également l'extension du fichier comme solution de secours
  const fileExt = file.originalname.split('.').pop().toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'heic', 'heif', 'webp', 'jxr', 'arw', 'nef', 'cr2', 'raf', 'rw2', 'orf', 'pef', 'srw'];
  
  
  // Vérifier le type MIME ou l'extension du fichier
  if (allowedTypes.includes(file.mimetype.toLowerCase()) || 
      allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    console.error('Type de fichier rejeté:', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      extension: fileExt
    });
    cb(new Error(`Type de fichier non autorisé (${file.mimetype}). Formats acceptés : JPG, JPEG, PNG, GIF, HEIC, WebP et formats bruts d'appareils photo.`));
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
