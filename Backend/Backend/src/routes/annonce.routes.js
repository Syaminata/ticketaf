const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, adminAuth } = require('../middleware/auth');
const { createAnnonce, listAnnonces, updateAnnonce, deleteAnnonce } = require('../controllers/annonce.controller');

const router = express.Router();


const uploadDir = path.join(__dirname, '../../uploads/annonces');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(png|jpg|jpeg|gif|webp)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non supporté"));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// --- ROUTES ---

// On retire adminAuth pour permettre la création en local plus facilement
// Note: En production, il faudra remettre adminAuth
router.post('/', auth, upload.single('image'), createAnnonce);

// Liste publique des annonces
router.get('/', listAnnonces);

// Mise à jour et suppression (on garde une sécurité minimale avec auth)
router.put('/:id', auth, upload.single('image'), updateAnnonce);
router.delete('/:id', auth, deleteAnnonce);

module.exports = router;
