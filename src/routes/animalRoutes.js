const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const { authenticate } = require('../middleware/auth');

// Route pubbliche
router.get('/', animalController.getAll);
router.get('/:id', animalController.getOne);

// Route protette
router.post('/register', authenticate, animalController.register);

module.exports = router;
