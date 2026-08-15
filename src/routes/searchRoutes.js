const express = require('express');
const axios = require('axios');
const router = express.Router();

// Endpoint di ricerca OSM Nominatim
router.get('/', async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Missing query parameter: q' });
    }

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: q,
                format: 'json',
                limit: 10,
                addressdetails: 1
            }
        });
        res.json({ success: true, results: response.data });
    } catch (error) {
        console.error('OSM Nominatim error:', error.message);
        res.status(500).json({ error: 'Errore durante la geocodifica' });
    }
});

module.exports = router;
