const express = require('express');
const router = express.Router();
const gardenActivityController = require('../controllers/gardenActivityController');

// Garden Activity Feed (#92)
router.get('/activity', gardenActivityController.listActivity);
router.get('/activity/filters', gardenActivityController.getFilters);
router.get('/activity/stream', gardenActivityController.streamActivity);

module.exports = router;
