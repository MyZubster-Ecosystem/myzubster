const express = require('express');
const axios = require('axios');
const router = express.Router();

// Endpoint di ricerca per prossimità (OSM Nominatim)
router.get('/', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing parameters: lat, lon' });
    }

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: `lat=${lat}&lon=${lon}`,
                format: 'json',
                limit: 10,
                addressdetails: 1
            }
        });
        res.json({ success: true, results: response.data });
    } catch (error) {
        console.error('OSM Nominatim error:', error.message);
        res.status(500).json({ error: 'Errore durante il recupero dei luoghi vicini' });
    }
});

module.exports = router;
