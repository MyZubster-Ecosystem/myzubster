const express = require('express');
const router = express.Router();
const bountySystemController = require('../controllers/bountySystemController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', bountySystemController.listBounties);
router.get('/stats', authenticate, isAdmin, bountySystemController.getStats);
router.get('/:issueNumber', bountySystemController.getBounty);
router.post('/', authenticate, isAdmin, bountySystemController.createBounty);
router.post('/webhook', bountySystemController.processMerge);

module.exports = router;
