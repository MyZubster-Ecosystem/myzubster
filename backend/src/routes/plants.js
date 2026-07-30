const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const { geocode, reverseGeocode, extractAddress } = require('../services/geocoding');

/**
 * GET /api/plants
 * Recupera piante con filtri e ricerca testuale.
 * Query params:
 *   - species, size, status: filtri esatti
 *   - search: ricerca testuale per indirizzo/quartiere/città
 *   - lat, lng, radius: ricerca geospaziale (in metri)
 *   - page, limit: paginazione
 */
router.get('/', async (req, res) => {
  try {
    const { species, size, status, search, lat, lng, radius, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (species) filter.species = { $regex: species, $options: 'i' };
    if (size) filter.size = size;
    if (status) filter.status = status;

    // Ricerca geospaziale per vicinanza
    if (lat && lng) {
      const radiusMeters = parseInt(radius) || 10000; // default 10km
      filter.gps = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusMeters
        }
      };
    }

    // Ricerca testuale integrata
    if (search && search.trim()) {
      // Usa text search di MongoDB se disponibile, altrimenti regex
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { 'indirizzo.quartiere': searchRegex },
        { 'indirizzo.citta': searchRegex },
        { 'indirizzo.via': searchRegex },
        { 'indirizzo.regione': searchRegex },
        { species: searchRegex },
        { commonName: searchRegex },
        { 'indirizzo.formatted': searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const plants = await Plant.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Plant.countDocuments(filter);

    res.json({
      success: true,
      plants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore recupero piante',
      error: error.message
    });
  }
});

/**
 * GET /api/plants/geocode
 * Geocodifica un indirizzo testuale (senza salvare).
 */
router.get('/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: 'Parametro q richiesto' });
    }
    const results = await geocode(q.trim());
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore geocodifica',
      error: error.message
    });
  }
});

/**
 * GET /api/plants/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, message: 'Pianta non trovata' });
    }
    res.json({ success: true, plant });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore recupero pianta',
      error: error.message
    });
  }
});

/**
 * POST /api/plants/register
 * Registra una nuova pianta con geocodifica automatica se non ci sono coordinate.
 */
router.post('/register', async (req, res) => {
  try {
    const { species, commonName, indirizzo, gps, size, age, photos, description } = req.body;

    if (!species || !species.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Specie obbligatoria'
      });
    }

    let finalGps = gps || {};
    let finalIndirizzo = indirizzo || {};

    // Geocodifica automatica: indirizzo testuale → GPS
    if ((!finalGps.lat || !finalGps.lng) && (indirizzo?.formatted || indirizzo?.via)) {
      try {
        const query = indirizzo.formatted || 
          [indirizzo.via, indirizzo.citta, indirizzo.cap].filter(Boolean).join(', ');
        const geocodeResults = await geocode(query, { limit: 1 });
        if (geocodeResults.length > 0) {
          finalGps = { lat: geocodeResults[0].lat, lng: geocodeResults[0].lng };
          finalIndirizzo = {
            ...finalIndirizzo,
            ...extractAddress(geocodeResults[0].address),
            formatted: geocodeResults[0].display_name
          };
        }
      } catch (geoErr) {
        console.warn('Geocoding fallita, proseguo senza GPS:', geoErr.message);
      }
    }

    // Reverse geocoding: GPS → indirizzo
    if (finalGps.lat && finalGps.lng && (!finalIndirizzo.formatted || !finalIndirizzo.citta)) {
      try {
        const reverseResult = await reverseGeocode(finalGps.lat, finalGps.lng);
        if (reverseResult) {
          finalIndirizzo = {
            ...finalIndirizzo,
            ...extractAddress(reverseResult.address),
            formatted: reverseResult.display_name
          };
        }
      } catch (geoErr) {
        console.warn('Reverse geocoding fallita:', geoErr.message);
      }
    }

    const plant = await Plant.create({
      species: species.trim(),
      commonName: commonName?.trim(),
      indirizzo: finalIndirizzo,
      gps: finalGps,
      size: size || 'small',
      age: age || null,
      photos: photos || [],
      description: description?.trim(),
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Pianta registrata con successo',
      plant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore registrazione pianta',
      error: error.message
    });
  }
});

/**
 * GET /api/plants/search/area
 * Ricerca piante in un'area testuale.
 * Es: "Orto vicino a Roma", "Quartiere Trastevere"
 */
router.get('/search/area', async (req, res) => {
  try {
    const { q, radius = 10000 } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: 'Parametro q richiesto' });
    }

    // 1. Geocodifica la query testuale
    const geocodeResults = await geocode(q.trim(), { limit: 1 });
    
    if (geocodeResults.length === 0) {
      // Fallback: ricerca testuale senza geocodifica
      const searchRegex = new RegExp(q.trim(), 'i');
      const plants = await Plant.find({
        $or: [
          { 'indirizzo.formatted': searchRegex },
          { 'indirizzo.citta': searchRegex },
          { 'indirizzo.quartiere': searchRegex }
        ]
      }).limit(50);

      return res.json({
        success: true,
        mode: 'text-search',
        query: q,
        plants,
        total: plants.length
      });
    }

    const center = geocodeResults[0];

    // 2. Ricerca geospaziale attorno alle coordinate trovate
    const plants = await Plant.find({
      gps: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [center.lng, center.lat]
          },
          $maxDistance: parseInt(radius)
        }
      }
    }).limit(50);

    res.json({
      success: true,
      mode: 'geospatial',
      query: q,
      center: {
        lat: center.lat,
        lng: center.lng,
        display_name: center.display_name
      },
      radius: parseInt(radius),
      plants,
      total: plants.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore ricerca area',
      error: error.message
    });
  }
});

module.exports = router;
