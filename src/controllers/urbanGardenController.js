const UrbanGarden = require('../models/urbanGardenModel');
const { randomUUID } = require('crypto');
const {
  LocationPrivacyError,
  prepareLocation,
  decryptExactLocation,
  projectPublicLocation
} = require('../services/locationPrivacyService');

function serializeGarden(garden) {
  const value = typeof garden.toObject === 'function' ? garden.toObject() : { ...garden };
  const location = projectPublicLocation(value.location);
  delete value.privateLocation;
  delete value.ownerId;
  return {
    ...value,
    location,
    id: value.gardenId || String(value._id || ''),
    address: location && location.visibility === 'public' ? location.address || '' : '',
    gps: location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
      ? { lat: location.lat, lng: location.lng }
      : null
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function haversineMeters(a, b) {
  const earthRadius = 6371000;
  const toRadians = degrees => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function locationInput(body) {
  const nested = body.location && typeof body.location === 'object' ? body.location : {};
  return {
    ...nested,
    lat: body.lat ?? nested.lat,
    lng: body.lng ?? nested.lng,
    address: body.address ?? nested.address,
    city: body.city ?? nested.city,
    country: body.country ?? nested.country,
    visibility: body.locationVisibility ?? nested.visibility,
    consentGranted: body.locationConsent === true || body.consentGranted === true || nested.consentGranted === true,
    consentVersion: body.locationConsentVersion ?? nested.consentVersion
  };
}

function sendError(res, error) {
  if (error instanceof LocationPrivacyError) {
    return res.status(400).json({ success: false, error: error.message, code: error.code });
  }
  return res.status(500).json({ success: false, error: 'Garden request failed' });
}

exports.createGarden = async (req, res) => {
  try {
    const { name, category, size } = req.body;
    if (!name || !category || !req.userId) {
      return res.status(400).json({ error: 'name and category are required' });
    }
    const prepared = prepareLocation(locationInput(req.body));
    const garden = new UrbanGarden({
      gardenId: randomUUID().substring(0, 12),
      name,
      ownerId: String(req.userId),
      category,
      location: prepared.publicLocation,
      privateLocation: prepared.privateLocation,
      size: size || 'small',
      isPublic: req.body.isPublic === true
    });
    await garden.save();
    return res.status(201).json({ message: 'Garden created', gardenId: garden.gardenId });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getGardens = async (req, res) => {
  try {
    const { category, status, size } = req.query;
    const filter = { isPublic: true };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (size) filter.size = size;
    const gardens = await UrbanGarden.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, total: gardens.length, count: gardens.length, gardens: gardens.map(serializeGarden) });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load gardens' });
  }
};

exports.searchGardens = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, error: 'Parametro q richiesto' });
    const pattern = new RegExp(escapeRegex(q), 'i');
    const gardens = await UrbanGarden.find({
      isPublic: true,
      $or: [{ name: pattern }, { 'location.address': pattern }, { category: pattern }]
    }).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, mode: 'text', total: gardens.length, gardens: gardens.map(serializeGarden) });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Garden search failed' });
  }
};

exports.nearbyGardens = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 5000);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0 || radius > 100000) {
      return res.status(400).json({ success: false, error: 'lat, lng e radius validi sono richiesti' });
    }
    const candidates = await UrbanGarden.findNearby(lat, lng, radius).sort({ createdAt: -1 }).limit(200);
    const gardens = candidates
      .filter(garden => Number.isFinite(garden.location?.lat) && Number.isFinite(garden.location?.lng))
      .filter(garden => haversineMeters({ lat, lng }, garden.location) <= radius)
      .map(serializeGarden);
    return res.json({ success: true, mode: 'nearby', radius, total: gardens.length, gardens });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Nearby search failed' });
  }
};

exports.getGarden = async (req, res) => {
  try {
    const garden = await UrbanGarden.findOne({ gardenId: req.params.gardenId, isPublic: true });
    if (!garden) return res.status(404).json({ error: 'Not found' });
    return res.json(serializeGarden(garden));
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load garden' });
  }
};

exports.getPrivateLocation = async (req, res) => {
  try {
    const garden = await UrbanGarden.findOne({ gardenId: req.params.gardenId }).select('+privateLocation');
    if (!garden) return res.status(404).json({ error: 'Not found' });
    if (String(garden.ownerId) !== String(req.userId) && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Garden ownership required' });
    }
    const payload = garden.privateLocation && typeof garden.privateLocation.toObject === 'function'
      ? garden.privateLocation.toObject()
      : garden.privateLocation;
    return res.json({
      success: true,
      location: payload ? decryptExactLocation(payload) : null,
      visibility: garden.location && garden.location.visibility
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.serializeGarden = serializeGarden;
