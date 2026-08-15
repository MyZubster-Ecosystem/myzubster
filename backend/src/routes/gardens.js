const express = require('express');
const https = require('https');
const Garden = require('../models/Garden');

const router = express.Router();
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MyZubster/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Nominatim response parse error: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

async function geocodeAddress(query) {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`;
  const results = await httpsGet(url);
  if (!results || results.length === 0) return null;
  const r = results[0];
  return {
    lat: parseFloat(r.lat), lng: parseFloat(r.lon), displayName: r.display_name || '',
    osmId: r.osm_id ? String(r.osm_id) : '', osmType: r.osm_type || '',
    type: r.type || '', category: r.category || '', importance: r.importance || 0,
  };
}

async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`;
  const result = await httpsGet(url);
  if (!result || result.error) return null;
  return { displayName: result.display_name || '', address: result.display_name || '' };
}

function toGeoPoint(lat, lng) { return { type: 'Point', coordinates: [lng, lat] }; }

router.post('/', async (req, res) => {
  try {
    const { name, description, address, gps, size, ownerId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Il nome dell'orto è obbligatorio" });
    let lat = gps && gps.lat !== undefined ? parseFloat(gps.lat) : null;
    let lng = gps && gps.lng !== undefined ? parseFloat(gps.lng) : null;
    let geocodingMeta = {};
    if ((!lat || !lng) && address && address.trim()) {
      const geo = await geocodeAddress(address);
      if (geo) {
        lat = geo.lat; lng = geo.lng;
        geocodingMeta = { displayName: geo.displayName, type: geo.type, category: geo.category, osmId: geo.osmId, osmType: geo.osmType, importance: geo.importance };
      }
    }
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Impossibile determinare le coordinate. Fornisci un indirizzo valido o coordinate esplicite (gps.lat, gps.lng).' });
    const garden = await Garden.create({
      name: name.trim(), description: description ? description.trim() : '',
      address: address ? address.trim() : (geocodingMeta.displayName || ''),
      gps: toGeoPoint(lat, lng), geocoding: geocodingMeta, size: size || 'medium', ownerId: ownerId || null,
    });
    return res.status(201).json({ success: true, message: 'Orto creato con successo', data: garden });
  } catch (error) { return res.status(500).json({ success: false, message: 'Errore creazione orto', error: error.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { status, size, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (size) filter.size = size;
    const [gardens, total] = await Promise.all([
      Garden.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip)),
      Garden.countDocuments(filter),
    ]);
    return res.json({ success: true, total, gardens });
  } catch (error) { return res.status(500).json({ success: false, message: 'Errore recupero orti', error: error.message }); }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ success: false, message: 'Il parametro "q" è obbligatorio per la ricerca' });
    const textResults = await Garden.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(50);
    if (textResults.length > 0) return res.json({ success: true, query: q, mode: 'text', total: textResults.length, gardens: textResults });
    const geo = await geocodeAddress(q);
    if (!geo) return res.json({ success: true, query: q, mode: 'no_results', total: 0, gardens: [] });
    const nearbyGardens = await Garden.find({ gps: { $near: { $geometry: { type: 'Point', coordinates: [geo.lng, geo.lat] }, $maxDistance: 5000 } } }).limit(50);
    return res.json({ success: true, query: q, mode: 'geocoded_fallback', geocoding: { displayName: geo.displayName, lat: geo.lat, lng: geo.lng }, total: nearbyGardens.length, gardens: nearbyGardens });
  } catch (error) { return res.status(500).json({ success: false, message: 'Errore ricerca orti', error: error.message }); }
});

router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat), lng = parseFloat(req.query.lng), radius = parseInt(req.query.radius) || 5000;
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ success: false, message: 'Parametri "lat" e "lng" sono obbligatori e devono essere numerici' });
    const gardens = await Garden.find({ gps: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radius } } }).limit(100);
    let locationName = '';
    try { const rev = await reverseGeocode(lat, lng); if (rev) locationName = rev.displayName; } catch (_) {}
    return res.json({ success: true, center: { lat, lng }, locationName, radius, total: gardens.length, gardens });
  } catch (error) { return res.status(500).json({ success: false, message: 'Errore ricerca per coordinate', error: error.message }); }
});

router.get('/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ success: false, message: 'Il parametro "q" è obbligatorio' });
    const geo = await geocodeAddress(q);
    if (!geo) return res.status(404).json({ success: false, message: 'Nessun risultato per la query fornita' });
    return res.json({ success: true, query: q, data: geo });
  } catch (error) { return res.status(500).json({ success: false, message: 'Errore geocoding', error: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id);
    if (!garden) return res.status(404).json({ success: false, message: 'Orto non trovato' });
    return res.json({ success: true, data: garden });
  } catch (error) { return res.status(500).json({ success: false, message: 'Errore recupero orto', error: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id);
    if (!garden) return res.status(404).json({ success: false, message: 'Orto non trovato' });
    const { name, description, address, gps, size, status, ownerId } = req.body;
    if (name !== undefined) garden.name = name.trim();
    if (description !== undefined) garden.description = description.trim();
    if (size !== undefined) garden.size = size;
    if (status !== undefined) garden.status = status;
    if (ownerId !== undefined) garden.ownerId = ownerId;
    if (gps && gps.lat !== undefined && gps.lng !== undefined) garden.gps = toGeoPoint(parseFloat(gps.lat), parseFloat(gps.lng));
    if (address !== undefined) {
      garden.address = address.trim();
      if (!gps || gps.lat === undefined || gps.lng === undefined) {
        const geo = await geocodeAddress(address);
        if (geo) { garden.gps = toGeoPoint(geo.lat, geo.lng); garden.geocoding = { displayName: geo.displayName, type: geo.type, category: geo.category, osmId: geo.osmId, osmType: geo.osmType, importance: geo.importance }; }
      }
    }
    await garden.save();
    return res.json({ success: true, message: 'Orto aggiornato con successo', data: garden });
  } catch (error) { return res.status(500).json({ success: false, message: 'Errore aggiornamento orto', error: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const garden = await Garden.findByIdAndDelete(req.params.id);
    if (!garden) return res.status(404).json({ success: false, message: 'Orto non trovato' });
    return res.json({ success: true, message: 'Orto eliminato con successo' });
  } catch (error) { return res.status(500).json({ success: false, message: 'Errore eliminazione orto', error: error.message }); }
});

module.exports = router;
