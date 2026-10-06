const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Route pubbliche
router.get('/', plantController.getAll);
router.get('/stats', plantController.getStats);
router.get('/:id/location/private', authenticate, plantController.getPrivateLocation);
router.get('/:id', plantController.getOne);

// Route protette (autenticazione richiesta)
router.post('/register', authenticate, plantController.register);
router.put('/:id', authenticate, plantController.update);
router.delete('/:id', authenticate, plantController.delete);

// Route admin
router.patch('/:id/verify', authenticate, isAdmin, plantController.verify);

module.exports = router;
