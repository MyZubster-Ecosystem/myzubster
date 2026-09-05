const express = require('express');
const router = express.Router();
const controller = require('../controllers/urbanGardenController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, controller.createGarden);
router.get('/', controller.getGardens);
router.get('/search', controller.searchGardens);
router.get('/nearby', controller.nearbyGardens);
router.get('/:gardenId/location/private', authenticate, controller.getPrivateLocation);
router.get('/:gardenId', controller.getGarden);

module.exports = router;
