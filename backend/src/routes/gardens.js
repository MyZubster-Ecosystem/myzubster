const express = require('express');
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
  }
});

module.exports = router;
