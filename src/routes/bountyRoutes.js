const express = require('express');
const router = express.Router();
const bountyController = require('../controllers/bountyController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Route pubbliche
router.get('/', bountyController.getAll);
router.get('/stats', bountyController.getStats);
router.get('/:id', bountyController.getOne);

// Route protette (autenticazione richiesta)
router.post('/:id/claim', authenticate, bountyController.claim);

// Route admin
router.post('/create', authenticate, isAdmin, bountyController.create);
router.patch('/:id/complete', authenticate, isAdmin, bountyController.complete);
router.patch('/:id/cancel', authenticate, isAdmin, bountyController.cancel);

module.exports = router;
