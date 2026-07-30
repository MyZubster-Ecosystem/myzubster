const express = require('express');
const router = express.Router();
const { searchPlaces } = require('../services/geocoding');
const Garden = require('../models/Garden');
const User = require('../models/User');
const Order = require('../models/Order');

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required',
      });
    }

    const places = await searchPlaces(q.trim());

    return res.json({
      success: true,
      query: q.trim(),
      results: places,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Geocoding error',
      error: error.message,
    });
  }
});

router.get('/gardens/nearby', async (req, res) => {
  try {
    const { lat, lng, radiusKm = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng query parameters are required',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = parseFloat(radiusKm) * 1000;

    if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radiusMeters)) {
      return res.status(400).json({
        success: false,
        message: 'lat, lng, and radiusKm must be valid numbers',
      });
    }

    const gardens = await Garden.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusMeters,
        },
      },
    });

    return res.json({
      success: true,
      center: { lat: latitude, lng: longitude },
      radiusKm: parseFloat(radiusKm),
      count: gardens.length,
      gardens,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error searching nearby gardens',
      error: error.message,
    });
  }
});

router.get('/users/nearby', async (req, res) => {
  try {
    const { lat, lng, radiusKm = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng query parameters are required',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = parseFloat(radiusKm) * 1000;

    if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radiusMeters)) {
      return res.status(400).json({
        success: false,
        message: 'lat, lng, and radiusKm must be valid numbers',
      });
    }

    const users = await User.find({
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null },
    });

    const R = 6371e3;
    const toRad = (deg) => (deg * Math.PI) / 180;

    const nearby = users
      .map((u) => {
        const dLat = toRad(u.location.lat - latitude);
        const dLng = toRad(u.location.lng - longitude);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(latitude)) *
            Math.cos(toRad(u.location.lat)) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return { ...u.toObject(), distanceMeters: d };
      })
      .filter((u) => u.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    return res.json({
      success: true,
      center: { lat: latitude, lng: longitude },
      radiusKm: parseFloat(radiusKm),
      count: nearby.length,
      users: nearby,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error searching nearby users',
      error: error.message,
    });
  }
});

module.exports = router;
