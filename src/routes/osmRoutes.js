// OpenStreetMap API Routes
// /api/osm/* endpoints

const express = require('express');
const router = express.Router();
const osmService = require('../services/osmService');

// ── Rate Limiting ──
const rateLimit = require('express-rate-limit');

const osmLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: 'Too many requests to OSM API, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(osmLimiter);

// ── Geocoding ──
// GET /api/osm/geocode?q=query&limit=5
router.get('/geocode', async (req, res) => {
  try {
    const { q, limit, viewbox, countrycodes } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await osmService.geocode(q, {
      limit: parseInt(limit) || 5,
      viewbox,
      countrycodes,
    });

    res.json({
      query: q,
      results: results.map(r => ({
        name: r.namedetails?.name || r.display_name,
        displayName: r.display_name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        type: r.type,
        category: r.class,
        importance: r.importance,
        address: r.address,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Reverse Geocoding ──
// GET /api/osm/reverse?lat=xx&lon=xx
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon parameters are required' });
    }

    const result = await osmService.reverseGeocode(lat, lon);

    res.json({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      name: result.namedetails?.name || result.display_name,
      displayName: result.display_name,
      address: result.address,
      type: result.type,
      category: result.class,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Search Gardens ──
// GET /api/osm/gardens?q=query&lat=xx&lon=xx
router.get('/gardens', async (req, res) => {
  try {
    const { q, lat, lon } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const options = {};
    if (lat && lon) {
      options.viewbox = `${parseFloat(lon)-0.1},${parseFloat(lat)+0.1},${parseFloat(lon)+0.1},${parseFloat(lat)-0.1}`;
    }

    const results = await osmService.searchGardens(q, options);

    res.json({
      query: q,
      count: results.length,
      gardens: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Search Nurseries ──
// GET /api/osm/nurseries?south=&west=&north=&east=
router.get('/nurseries', async (req, res) => {
  try {
    const { south, west, north, east } = req.query;
    
    if (!south || !west || !north || !east) {
      return res.status(400).json({ 
        error: 'Bounding box parameters (south, west, north, east) are required' 
      });
    }

    const bounds = [south, west, north, east].map(parseFloat);
    const results = await osmService.searchNurseries(bounds);

    res.json({
      bounds: { south, west, north, east },
      count: results.length,
      nurseries: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Search Markets ──
// GET /api/osm/markets?south=&west=&north=&east=
router.get('/markets', async (req, res) => {
  try {
    const { south, west, north, east } = req.query;
    
    if (!south || !west || !north || !east) {
      return res.status(400).json({ 
        error: 'Bounding box parameters (south, west, north, east) are required' 
      });
    }

    const bounds = [south, west, north, east].map(parseFloat);
    const results = await osmService.searchMarkets(bounds);

    res.json({
      bounds: { south, west, north, east },
      count: results.length,
      markets: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POI Search ──
// GET /api/osm/poi?category=shop&tag=garden_centre&south=&west=&north=&east=
router.get('/poi', async (req, res) => {
  try {
    const { category, tag, south, west, north, east } = req.query;
    
    if (!category || !tag || !south || !west || !north || !east) {
      return res.status(400).json({ 
        error: 'category, tag, and bounding box parameters are required' 
      });
    }

    const bounds = [south, west, north, east].map(parseFloat);
    const query = `${category}=${tag}`;
    const results = await osmService.searchPOI(bounds, query);

    res.json({
      query,
      bounds: { south, west, north, east },
      count: results.length,
      pois: results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Routing ──
// GET /api/osm/route?from=lat,lon&to=lat,lon&profile=foot
router.get('/route', async (req, res) => {
  try {
    const { from, to, profile } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ 
        error: 'from and to parameters (lat,lon) are required' 
      });
    }

    const [fromLat, fromLon] = from.split(',').map(parseFloat);
    const [toLat, toLon] = to.split(',').map(parseFloat);

    if (isNaN(fromLat) || isNaN(fromLon) || isNaN(toLat) || isNaN(toLon)) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    const route = await osmService.getRoute(
      [
        { lat: fromLat, lon: fromLon },
        { lat: toLat, lon: toLon },
      ],
      { profile: profile || 'foot' }
    );

    res.json({
      from: { lat: fromLat, lon: fromLon },
      to: { lat: toLat, lon: toLon },
      profile: profile || 'foot',
      distance: route.distance,
      duration: route.duration,
      distanceKm: (route.distance / 1000).toFixed(2),
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry,
      steps: route.steps,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Multi-waypoint Route ──
// POST /api/osm/route/multi
router.post('/route/multi', async (req, res) => {
  try {
    const { waypoints, profile } = req.body;
    
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({ 
        error: 'waypoints array with at least 2 points is required' 
      });
    }

    const route = await osmService.getRoute(waypoints, { 
      profile: profile || 'foot',
      roundtrip: false,
    });

    res.json({
      waypointCount: waypoints.length,
      profile: profile || 'foot',
      distance: route.distance,
      duration: route.duration,
      distanceKm: (route.distance / 1000).toFixed(2),
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry,
      steps: route.steps,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Garden Boundaries ──
// GET /api/osm/boundaries?id=osm_relation_id
router.get('/boundaries', async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'id parameter is required' });
    }

    const boundaries = await osmService.getGardenBoundaries(parseInt(id));

    res.json({
      osmId: parseInt(id),
      type: 'FeatureCollection',
      features: boundaries,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Cache Stats ──
// GET /api/osm/cache/stats
router.get('/cache/stats', (req, res) => {
  res.json(osmService.getCacheStats());
});

module.exports = router;
