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

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Routes
router.post('/', auth, adminAuth, upload.single('image'), createAnnonce);
router.get('/', auth, listAnnonces);
router.put('/:id', auth, adminAuth, upload.single('image'), updateAnnonce);
router.delete('/:id', auth, adminAuth, deleteAnnonce);

module.exports = router;
