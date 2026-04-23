const express = require('express');
const router = express.Router();
const { getAllFaqs, getAllFaqsAdmin, createFaq, updateFaq, deleteFaq } = require('../controllers/faq.controller');
const { adminAuth } = require('../middleware/auth');

// Public
router.get('/', getAllFaqs);

// Admin
router.get('/admin', adminAuth, getAllFaqsAdmin);
router.post('/', adminAuth, createFaq);
router.put('/:id', adminAuth, updateFaq);
router.delete('/:id', adminAuth, deleteFaq);

module.exports = router;
