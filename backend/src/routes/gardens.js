const express = require('express');
const Garden = require('../models/Garden');
const { geocodeAddress } = require('../services/geocoding');

const router = express.Router();

function serializeGarden(garden) {
  return garden?.toJSON ? garden.toJSON() : garden;
}

function normalizeGps(body) {
  if (body?.gps?.lat != null && body?.gps?.lng != null) {
    return { type: 'Point', coordinates: [Number(body.gps.lng), Number(body.gps.lat)] };
  }
  if (body?.latitude != null && body?.longitude != null) {
    return { type: 'Point', coordinates: [Number(body.longitude), Number(body.latitude)] };
  }
  return null;
}

function geocodingPayload(coords) {
  if (!coords) return null;
  return {
    displayName: coords.displayName || '',
    lat: coords.lat,
    lng: coords.lng,
    osmId: coords.osmId || null,
    osmType: coords.osmType || null,
    neighborhood: coords.neighborhood || '',
    city: coords.city || '',
  };
}

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.size) filter.size = req.query.size;
    const gardens = await Garden.find(filter).sort({ createdAt: 1 });
    res.json({ success: true, total: gardens.length, gardens: gardens.map(serializeGarden) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
  try {
    const gardens = await Garden.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
      ],
    });
    if (gardens.length) {
      return res.json({ success: true, mode: 'text', total: gardens.length, gardens: gardens.map(serializeGarden) });
    }
    const coords = await geocodeAddress(q);
    if (!coords) return res.json({ success: true, mode: 'no_results', total: 0, gardens: [] });
    const gardensNear = await Garden.find({
      gps: { $near: { $geometry: { type: 'Point', coordinates: [coords.lng, coords.lat] }, $maxDistance: 5000 } },
    });
    return res.json({ success: true, mode: 'geocoded_fallback', total: gardensNear.length, gardens: gardensNear.map(serializeGarden), geocoding: geocodingPayload(coords) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/nearby', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius || 1000);
  if (req.query.lat == null || req.query.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude are required and must be numbers' });
  }
  if (!Number.isFinite(radius) || radius < 0) return res.status(400).json({ success: false, message: 'Radius must be a non-negative number' });
  try {
    const gardens = await Garden.find({ gps: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radius } } });
    res.json({ success: true, center: { lat, lng }, radius, total: gardens.length, gardens: gardens.map(serializeGarden) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/geocode', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
  try {
    const coords = await geocodeAddress(q);
    if (!coords) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, data: geocodingPayload(coords) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address = '', description = '', size = 'medium', status = 'active', ownerId = '' } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    let gps = normalizeGps(req.body);
    let geocoding;
    if (!gps && address) {
      const coords = await geocodeAddress(address);
      if (coords) {
        gps = { type: 'Point', coordinates: [coords.lng, coords.lat] };
        geocoding = geocodingPayload(coords);
      }
    }
    if (!gps) return res.status(400).json({ success: false, message: 'Impossibile determinare le coordinate: fornire gps o un indirizzo valido' });
    const garden = await Garden.create({ name, address, description, gps, size, status, ownerId, geocoding });
    res.status(201).json({ success: true, data: serializeGarden(garden) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id);
    if (!garden) return res.status(404).json({ success: false, message: 'Garden not found' });
    res.json({ success: true, data: serializeGarden(garden) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id);
    if (!garden) return res.status(404).json({ success: false, message: 'Garden not found' });
    const { name, address, description, size, status, ownerId } = req.body || {};
    if (name !== undefined) garden.name = name;
    if (address !== undefined) garden.address = address;
    if (description !== undefined) garden.description = description;
    if (size !== undefined) garden.size = size;
    if (status !== undefined) garden.status = status;
    if (ownerId !== undefined) garden.ownerId = ownerId;
    const gps = normalizeGps(req.body);
    if (gps) {
      garden.gps = gps;
    } else if (address) {
      const coords = await geocodeAddress(address);
      if (!coords) return res.status(400).json({ success: false, message: 'Impossibile determinare le coordinate per il nuovo indirizzo' });
      garden.gps = { type: 'Point', coordinates: [coords.lng, coords.lat] };
      garden.geocoding = geocodingPayload(coords);
    }
    await garden.save();
    res.json({ success: true, data: serializeGarden(garden) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const garden = await Garden.findByIdAndDelete(req.params.id);
    if (!garden) return res.status(404).json({ success: false, message: 'Garden not found' });
    res.json({ success: true, message: 'Garden deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
