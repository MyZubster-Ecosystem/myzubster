const express = require('express');
const router = express.Router();
const votingController = require('../controllers/votingController');
const { authenticate } = require('../middleware/auth');

router.get('/history', votingController.getHistory);
router.get('/', votingController.getPolls);
router.get('/:id', votingController.getPoll);
router.get('/:id/results', votingController.getResults);
router.post('/', authenticate, votingController.createPoll);
router.post('/:id/vote', authenticate, votingController.vote);
router.patch('/:id/close', authenticate, votingController.closePoll);

module.exports = router;
