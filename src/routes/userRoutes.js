const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const characterProfileController = require('../controllers/characterProfileController');

router.get('/me/character', authenticate, characterProfileController.getMyCharacter);
router.put('/me/character', authenticate, characterProfileController.putMyCharacter);

module.exports = router;
