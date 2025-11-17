const multer = require('multer');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads/drivers');

// s'assurer que le dossier existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);              // chemin ABSOLU vers Backend/uploads/drivers
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

// Middleware pour l'upload des fichiers du driver
const uploadDriverFiles = upload.fields([
  { name: 'permis', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);

module.exports = {
  uploadDriverFiles
};
