const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// Registra una tratta completata
router.post('/complete', tripController.completeTrip);

// Ottieni lo storico tratte di un utente
router.get('/user/:userId', tripController.getUserTrips);

// Ottieni le statistiche di un utente
router.get('/stats/:userId', tripController.getUserStats);

// Webhook GPS (per ricevere dati dal monopattino)
router.post('/gps-webhook', tripController.gpsWebhook);

// Classifica (leaderboard)
router.get('/leaderboard', tripController.getLeaderboard);

module.exports = router;
