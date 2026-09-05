const express = require('express');
const router = express.Router();
const controller = require('../controllers/zorgaxCulturalController');
const { authenticate } = require('../middleware/auth');

router.post('/events', authenticate, controller.createEvent);
router.get('/events/:eventId', controller.getPublicEvent);
router.get('/events/:eventId/organizer', authenticate, controller.getOrganizerEvent);
router.patch('/events/:eventId', authenticate, controller.updateOrganizerEvent);
router.post('/events/:eventId/telegram', authenticate, controller.publishEventToTelegram);

router.put('/artists/me', authenticate, controller.upsertMyArtistProfile);
router.get('/artists/search', controller.searchArtists);
router.get('/artists/:profileId', controller.getArtistProfile);

module.exports = router;
