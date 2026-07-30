const express = require('express');
<<<<<<< HEAD
const Garden = require('../models/Garden');
const { geocodeAddress, reverseGeocode } = require('../services/geocoding');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, description, address, ownerId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Il nome e obbligatorio' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'L indirizzo e obbligatorio' });
    }
    const geo = await geocodeAddress(address.trim());
    if (!geo) {
      return res.status(422).json({ success: false, message: 'Indirizzo non trovato' });
    }
    const garden = await Garden.create({
      name: name.trim(),
      description: (description || '').trim(),
      address: address.trim(),
      neighborhood: geo.neighborhood,
      city: geo.city,
      coordinates: { lat: geo.lat, lng: geo.lng },
      ownerId: (ownerId || '').trim(),
    });
    return res.status(201).json({ success: true, message: 'Orto registrato', data: garden });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore registrazione orto', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { q, city, neighborhood, lat, lng, radius } = req.query;
    const filter = { isActive: true };
    if (city) filter.city = new RegExp(city, 'i');
    if (neighborhood) filter.neighborhood = new RegExp(neighborhood, 'i');
    if (q) {
      filter.$text = { $search: q };
    }
    if (lat && lng) {
      const radiusKm = parseFloat(radius) || 10;
      const radiusRad = radiusKm / 6371;
      filter.coordinates = {
        $geoWithin: { $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusRad] },
      };
    }
    const gardens = await Garden.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, message: 'Orti recuperati', data: gardens });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore recupero orti', error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, lat, lng, radius } = req.query;
    if (!q && !lat) {
      return res.status(400).json({ success: false, message: 'Parametro q o lat/lng richiesto' });
    }
    if (q && !lat) {
      const geo = await geocodeAddress(q);
      if (!geo) {
        return res.status(422).json({ success: false, message: 'Luogo non trovato' });
      }
      const radiusKm = parseFloat(radius) || 10;
      const radiusRad = radiusKm / 6371;
      const gardens = await Garden.find({
        isActive: true,
        coordinates: { $geoWithin: { $centerSphere: [[geo.lng, geo.lat], radiusRad] } },
      }).sort({ createdAt: -1 }).limit(100);
      return res.json({
        success: true,
        message: 'Orti trovati vicino al luogo',
        searchCenter: { lat: geo.lat, lng: geo.lng, displayName: geo.displayName },
        data: gardens,
      });
    }
    if (lat && lng) {
      const radiusKm = parseFloat(radius) || 10;
      const radiusRad = radiusKm / 6371;
      const gardens = await Garden.find({
        isActive: true,
        coordinates: { $geoWithin: { $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusRad] } },
      }).sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, message: 'Orti trovati nelle vicinanze', data: gardens });
    }
    return res.status(400).json({ success: false, message: 'Parametri non validi' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore ricerca orti', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id);
    if (!garden) return res.status(404).json({ success: false, message: 'Orto non trovato' });
    return res.json({ success: true, message: 'Orto recuperato', data: garden });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore recupero orto', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, address, ownerId } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description.trim();
    if (ownerId !== undefined) update.ownerId = ownerId.trim();
    if (address !== undefined && address.trim()) {
      const geo = await geocodeAddress(address.trim());
      if (!geo) return res.status(422).json({ success: false, message: 'Nuovo indirizzo non trovato' });
      update.address = address.trim();
      update.neighborhood = geo.neighborhood;
      update.city = geo.city;
      update.coordinates = { lat: geo.lat, lng: geo.lng };
    }
    const garden = await Garden.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!garden) return res.status(404).json({ success: false, message: 'Orto non trovato' });
    return res.json({ success: true, message: 'Orto aggiornato', data: garden });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore aggiornamento orto', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const garden = await Garden.findByIdAndDelete(req.params.id);
    if (!garden) return res.status(404).json({ success: false, message: 'Orto non trovato' });
    return res.json({ success: true, message: 'Orto eliminato' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore eliminazione orto', error: error.message });
  }
});

router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'lat e lng sono obbligatori' });
    }
    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));
    if (!result) return res.status(422).json({ success: false, message: 'Nessun indirizzo trovato' });
    return res.json({ success: true, message: 'Indirizzo recuperato', data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore reverse geocoding', error: error.message });
=======
const https = require('https');
const Garden = require('../models/Garden');

const router = express.Router();

// ---------------------------------------------------------------------------
// Helper: geocode via OpenStreetMap Nominatim
// ---------------------------------------------------------------------------
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Esegue una chiamata HTTP(S) e restituisce il body JSON.
 * @param {string} url
 * @returns {Promise<any>}
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MyZubster/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Nominatim response parse error: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Geocodifica un indirizzo/testo in coordinate (lat, lng) + metadati.
 * @param {string} query - Indirizzo o nome del luogo
 * @returns {Promise<{lat:number, lng:number, displayName:string, osmId:string, osmType:string, type:string, category:string, importance:number}|null>}
 */
async function geocodeAddress(query) {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`;
  const results = await httpsGet(url);
  if (!results || results.length === 0) return null;
  const r = results[0];
  return {
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    displayName: r.display_name || '',
    osmId: r.osm_id ? String(r.osm_id) : '',
    osmType: r.osm_type || '',
    type: r.type || '',
    category: r.category || '',
    importance: r.importance || 0,
  };
}

/**
 * Esegue un reverse geocode (lat, lng → indirizzo).
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{displayName:string, address:string}|null>}
 */
async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`;
  const result = await httpsGet(url);
  if (!result || result.error) return null;
  return {
    displayName: result.display_name || '',
    address: result.display_name || '',
  };
}

/**
 * Converte coordinate {lat, lng} in GeoJSON Point
 * @param {number} lat
 * @param {number} lng
 * @returns {{type:'Point', coordinates:[number,number]}}
 */
function toGeoPoint(lat, lng) {
  return { type: 'Point', coordinates: [lng, lat] };
}

// ---------------------------------------------------------------------------
// Rotte
// ---------------------------------------------------------------------------

/**
 * POST /api/gardens
 * Crea un nuovo orto. Se viene fornito solo l'indirizzo senza coordinate
 * esplicite, viene eseguito il geocoding automatico tramite Nominatim.
 * Body: { name, description?, address?, gps?:{lat,lng}, size?, ownerId? }
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, address, gps, size, ownerId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Il nome dell\'orto è obbligatorio',
      });
    }

    let lat = gps && gps.lat ? parseFloat(gps.lat) : null;
    let lng = gps && gps.lng ? parseFloat(gps.lng) : null;
    let geocodingMeta = {};

    // Se non abbiamo coordinate ma abbiamo un indirizzo, geocodificalo
    if ((!lat || !lng) && address && address.trim()) {
      const geo = await geocodeAddress(address);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        geocodingMeta = {
          displayName: geo.displayName,
          type: geo.type,
          category: geo.category,
          osmId: geo.osmId,
          osmType: geo.osmType,
          importance: geo.importance,
        };
      }
    }

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Impossibile determinare le coordinate. Fornisci un indirizzo valido o coordinate esplicite (gps.lat, gps.lng).',
      });
    }

    const garden = await Garden.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      address: address ? address.trim() : (geocodingMeta.displayName || ''),
      gps: toGeoPoint(lat, lng),
      geocoding: geocodingMeta,
      size: size || 'medium',
      ownerId: ownerId || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Orto creato con successo',
      data: garden,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore creazione orto',
      error: error.message,
    });
  }
});

/**
 * GET /api/gardens
 * Elenco di tutti gli orti (con filtri opzionali).
 * Query: status, size, limit, skip
 */
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

    return res.json({
      success: true,
      total,
      gardens,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore recupero orti',
      error: error.message,
    });
  }
});

/**
 * GET /api/gardens/search?q=...
 * Ricerca testuale su nome, descrizione e indirizzo degli orti.
 * Se la query non produce risultati testuali, tenta il geocoding
 * con Nominatim per trovare orti nelle vicinanze del luogo cercato.
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Il parametro "q" è obbligatorio per la ricerca',
      });
    }

    // 1. Ricerca full‑text su MongoDB
    const textResults = await Garden.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(50);

    if (textResults.length > 0) {
      return res.json({
        success: true,
        query: q,
        mode: 'text',
        total: textResults.length,
        gardens: textResults,
      });
    }

    // 2. Fallback: geocoding della query e ricerca per prossimità
    const geo = await geocodeAddress(q);
    if (!geo) {
      return res.json({
        success: true,
        query: q,
        mode: 'no_results',
        total: 0,
        gardens: [],
      });
    }

    const nearbyGardens = await Garden.find({
      gps: {
        $near: {
          $geometry: { type: 'Point', coordinates: [geo.lng, geo.lat] },
          $maxDistance: 5000, // 5 km
        },
      },
    }).limit(50);

    return res.json({
      success: true,
      query: q,
      mode: 'geocoded_fallback',
      geocoding: {
        displayName: geo.displayName,
        lat: geo.lat,
        lng: geo.lng,
      },
      total: nearbyGardens.length,
      gardens: nearbyGardens,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore ricerca orti',
      error: error.message,
    });
  }
});

/**
 * GET /api/gardens/nearby?lat=...&lng=...&radius=... (metri, default 5000)
 * Ricerca per coordinate geografiche.
 */
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseInt(req.query.radius) || 5000;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Parametri "lat" e "lng" sono obbligatori e devono essere numerici',
      });
    }

    const gardens = await Garden.find({
      gps: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    }).limit(100);

    // Reverse geocode per arricchire la risposta con il nome del luogo
    let locationName = '';
    try {
      const rev = await reverseGeocode(lat, lng);
      if (rev) locationName = rev.displayName;
    } catch (_) {
      // silenzioso — il reverse geocode è solo decorativo
    }

    return res.json({
      success: true,
      center: { lat, lng },
      locationName,
      radius,
      total: gardens.length,
      gardens,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore ricerca per coordinate',
      error: error.message,
    });
  }
});

/**
 * GET /api/gardens/geocode
 * Utility: geocodifica un indirizzo e restituisce le coordinate (non salva).
 * Query: q (indirizzo o nome luogo)
 */
router.get('/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Il parametro "q" è obbligatorio',
      });
    }

    const geo = await geocodeAddress(q);
    if (!geo) {
      return res.status(404).json({
        success: false,
        message: 'Nessun risultato per la query fornita',
      });
    }

    return res.json({
      success: true,
      query: q,
      data: geo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore geocoding',
      error: error.message,
    });
  }
});

/**
 * GET /api/gardens/:id
 * Dettaglio di un orto.
 */
router.get('/:id', async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id);
    if (!garden) {
      return res.status(404).json({
        success: false,
        message: 'Orto non trovato',
      });
    }
    return res.json({
      success: true,
      data: garden,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore recupero orto',
      error: error.message,
    });
  }
});

/**
 * PUT /api/gardens/:id
 * Aggiorna un orto. Se l'indirizzo cambia e non vengono fornite
 * coordinate esplicite, viene rieseguito il geocoding.
 */
router.put('/:id', async (req, res) => {
  try {
    const garden = await Garden.findById(req.params.id);
    if (!garden) {
      return res.status(404).json({
        success: false,
        message: 'Orto non trovato',
      });
    }

    const { name, description, address, gps, size, status, ownerId } = req.body;

    if (name !== undefined) garden.name = name.trim();
    if (description !== undefined) garden.description = description.trim();
    if (size !== undefined) garden.size = size;
    if (status !== undefined) garden.status = status;
    if (ownerId !== undefined) garden.ownerId = ownerId;

    // Aggiornamento coordinate (accetta {lat, lng} nel body, salva come GeoJSON)
    if (gps && gps.lat !== undefined && gps.lng !== undefined) {
      garden.gps = toGeoPoint(parseFloat(gps.lat), parseFloat(gps.lng));
    }

    // Se viene fornito un nuovo indirizzo (e non coordinate esplicite), geocodifica
    if (address !== undefined) {
      garden.address = address.trim();
      if (!gps || gps.lat === undefined || gps.lng === undefined) {
        const geo = await geocodeAddress(address);
        if (geo) {
          garden.gps = toGeoPoint(geo.lat, geo.lng);
          garden.geocoding = {
            displayName: geo.displayName,
            type: geo.type,
            category: geo.category,
            osmId: geo.osmId,
            osmType: geo.osmType,
            importance: geo.importance,
          };
        }
      }
    }

    await garden.save();

    return res.json({
      success: true,
      message: 'Orto aggiornato con successo',
      data: garden,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore aggiornamento orto',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/gardens/:id
 * Elimina un orto.
 */
router.delete('/:id', async (req, res) => {
  try {
    const garden = await Garden.findByIdAndDelete(req.params.id);
    if (!garden) {
      return res.status(404).json({
        success: false,
        message: 'Orto non trovato',
      });
    }
    return res.json({
      success: true,
      message: 'Orto eliminato con successo',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore eliminazione orto',
      error: error.message,
    });
>>>>>>> 6561d1d (feat: Geolocalizzazione bounty #17  Implementazione della funzionalità di geolocalizzazione per il bounty #17.  ## Novità - Modello Garden con indice 2dsphere (GeoJSON Point) e indice text - Integrazione OSM Nominatim per geocoding e reverse geocoding - Campo address per ogni garden - GET /api/gardens/search?q=... (ricerca testuale + fallback geocoding) - GET /api/gardens/nearby?lat=...&lng=...&radius=... (query geospaziali) - GET /api/gardens/geocode?q=... (utility di geocoding) - CRUD completo: POST, GET, GET/:id, PUT, DELETE /api/gardens - 36 test (coprono geocoding, search, nearby, CRUD, edge case)  Co-authored-by: CloudPaw-Master <cloud-orchestrator>)
  }
});

module.exports = router;
