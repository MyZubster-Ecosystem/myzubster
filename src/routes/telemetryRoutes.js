const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

// POST /api/telemetry — submit a telemetry reading
router.post('/', telemetryController.submit);

// GET /api/telemetry — retrieve telemetry readings
// Query: ?robotId=&type=&status=&limit=50&skip=0
router.get('/', telemetryController.list);

module.exports = router;
