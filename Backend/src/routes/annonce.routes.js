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

/**
 * @swagger
 * /annonces:
 *   post:
 *     summary: Créer une nouvelle annonce
 *     tags: [Annonces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - image
 *               - datePublication
 *               - dateFin
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre de l'annonce
 *               description:
 *                 type: string
 *                 description: Description de l'annonce
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image de l'annonce (max 5MB)
 *               datePublication:
 *                 type: string
 *                 format: date-time
 *                 description: Date de publication
 *               dateFin:
 *                 type: string
 *                 format: date-time
 *                 description: Date de fin de publication
 *               published:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Annonce créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Annonce'
 *       400:
 *         description: Erreur de validation
 */
router.post('/', auth, adminAuth, upload.single('image'), createAnnonce);

/**
 * @swagger
 * /annonces:
 *   get:
 *     summary: Récupérer toutes les annonces
 *     tags: [Annonces]
 *     responses:
 *       200:
 *         description: Liste des annonces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Annonce'
 */
router.get('/', listAnnonces);

/**
 * @swagger
 * /annonces/{id}:
 *   put:
 *     summary: Mettre à jour une annonce
 *     tags: [Annonces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'annonce
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               datePublication:
 *                 type: string
 *                 format: date-time
 *               dateFin:
 *                 type: string
 *                 format: date-time
 *               published:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Annonce mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Annonce'
 *       404:
 *         description: Annonce non trouvée
 */
router.put('/:id', auth, adminAuth, upload.single('image'), updateAnnonce);

/**
 * @swagger
 * /annonces/{id}:
 *   delete:
 *     summary: Supprimer une annonce
 *     tags: [Annonces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'annonce
 *     responses:
 *       200:
 *         description: Annonce supprimée avec succès
 *       404:
 *         description: Annonce non trouvée
 */
router.delete('/:id', auth, adminAuth, deleteAnnonce);

module.exports = router;
