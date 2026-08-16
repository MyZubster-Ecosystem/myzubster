const express = require('express');
const Garden = require('../models/Garden');
const { geocodeAddress, reverseGeocode } = require('../services/geocoding');
const router = express.Router();

// GET /api/gardens - Elenco di tutti gli orti
router.get('/', async (req, res) => {
  try {
    const gardens = await Garden.find();
    res.json(gardens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gardens/search?q=... - Ricerca testuale e geocoding
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  try {
    const gardens = await Garden.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } }
      ]
    });
    if (gardens.length === 0) {
      try {
        const coords = await geocodeAddress(q);
        if (coords) {
          const nearby = await Garden.find({
            location: {
              $near: {
                $geometry: { type: 'Point', coordinates: [coords.lng, coords.lat] },
                $maxDistance: 5000
              }
            }
          });
          return res.json(nearby);
        }
      } catch (geocodeErr) {}
      return res.json([]);
    }
    res.json(gardens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gardens/nearby?lat=...&lng=...&radius=...
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 1000 } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ error: 'Latitude and longitude must be numbers' });
  }
  try {
    const gardens = await Garden.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lngNum, latNum] },
          $maxDistance: parseInt(radius, 10)
        }
      }
    });
    res.json(gardens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gardens/geocode?q=...
router.get('/geocode', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  try {
    const coords = await geocodeAddress(q);
    if (!coords) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json(coords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gardens
router.post('/', async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!address && (latitude === undefined || longitude === undefined)) {
      return res.status(400).json({ error: 'Either address or coordinates must be provided' });
    }
    let location = null;
    if (latitude !== undefined && longitude !== undefined) {
      location = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
    } else if (address) {
      const coords = await geocodeAddress(address);
      if (coords) {
        location = { type: 'Point', coordinates: [coords.lng, coords.lat] };
      } else {
        return res.status(400).json({ error: 'Unable to geocode address' });
      }
    }
    const garden = new Garden({
      name,
      address,
      location,
      description: req.body.description || '',
      size: req.body.size || 'medium',
      status: req.body.status || 'active'
    });
    await garden.save();
    res.status(201).json(garden);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/gardens/:id
router.get('/:id', async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id);
    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }
    res.json(garden);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/gardens/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, address, latitude, longitude, description, size, status } = req.body;
    const updateData = { name, address, description, size, status };
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
    } else if (address) {
      const coords = await geocodeAddress(address);
      if (coords) {
        updateData.location = { type: 'Point', coordinates: [coords.lng, coords.lat] };
      }
    }
    const garden = await Garden.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }
    res.json(garden);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/gardens/:id
router.delete('/:id', async (req, res) => {
  try {
    const garden = await Garden.findByIdAndDelete(req.params.id);
    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }
    res.json({ message: 'Garden deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
