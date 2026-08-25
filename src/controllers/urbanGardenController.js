const UrbanGarden = require('../models/urbanGardenModel');
const { randomUUID } = require('crypto');

function serializeGarden(garden) {
  const value = typeof garden.toObject === 'function' ? garden.toObject() : garden;
  const lat = value.location?.lat;
  const lng = value.location?.lng;
  return {
    ...value,
    id: value.gardenId || String(value._id || ''),
    address: value.location?.address || '',
    gps: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
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

exports.createGarden = async (req, res) => {
  try {
    const {name, ownerId, category, lat, lng, address, size} = req.body;
    if (!name || !ownerId || !category || lat === undefined || lng === undefined)
      return res.status(400).json({error: 'name, ownerId, category, lat, lng required'});
    const g = new UrbanGarden({gardenId: randomUUID().substring(0,12), name, ownerId, category, location: {lat, lng, address}, size: size||'small'});
    await g.save();
    res.status(201).json({message: 'Garden created', gardenId: g.gardenId});
  } catch (e) { res.status(500).json({error: e.message}); }
};

exports.getGardens = async (req, res) => {
  try {
    const {category, status, size} = req.query;
    const filter = {isPublic: true};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (size) filter.size = size;
    const query = UrbanGarden.find(filter);
    const gardens = await query.sort({createdAt: -1}).limit(100);
    res.json({success: true, total: gardens.length, count: gardens.length, gardens: gardens.map(serializeGarden)});
  } catch (e) { res.status(500).json({error: e.message}); }
};

exports.searchGardens = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({success: false, error: 'Parametro q richiesto'});
    const pattern = new RegExp(escapeRegex(q), 'i');
    const gardens = await UrbanGarden.find({
      isPublic: true,
      $or: [{name: pattern}, {'location.address': pattern}, {category: pattern}],
    }).sort({createdAt: -1}).limit(100);
    return res.json({success: true, mode: 'text', total: gardens.length, gardens: gardens.map(serializeGarden)});
  } catch (e) { return res.status(500).json({success: false, error: e.message}); }
};

exports.nearbyGardens = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 5000);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0 || radius > 100000) {
      return res.status(400).json({success: false, error: 'lat, lng e radius validi sono richiesti'});
    }
    const candidates = await UrbanGarden.findNearby(lat, lng, radius).sort({createdAt: -1}).limit(200);
    const gardens = candidates
      .filter(garden => Number.isFinite(garden.location?.lat) && Number.isFinite(garden.location?.lng))
      .filter(garden => haversineMeters({lat, lng}, garden.location) <= radius)
      .map(serializeGarden);
    return res.json({success: true, mode: 'nearby', center: {lat, lng}, radius, total: gardens.length, gardens});
  } catch (e) { return res.status(500).json({success: false, error: e.message}); }
};

exports.getGarden = async (req, res) => {
  try {
    const g = await UrbanGarden.findOne({gardenId: req.params.gardenId});
    if (!g) return res.status(404).json({error: 'Not found'});
    res.json(serializeGarden(g));
  } catch (e) { res.status(500).json({error: e.message}); }
};

exports.serializeGarden = serializeGarden;
