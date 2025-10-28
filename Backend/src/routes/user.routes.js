const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/user.controller');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, getAllUsers);
router.post('/', auth, adminAuth, createUser); 
router.get('/:id', auth, adminAuth, getUserById);
router.put('/:id', auth, adminAuth, updateUser);
router.delete('/:id', auth, adminAuth, deleteUser);

module.exports = router;
