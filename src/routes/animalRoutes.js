const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const { authenticate } = require('../middleware/auth');

router.get('/', animalController.getAll);
router.get('/:id/location/private', authenticate, animalController.getPrivateLocation);
router.get('/:id', animalController.getOne);
router.post('/register', authenticate, animalController.register);

module.exports = router;
