const express = require('express');
const {
  createPrivateGeolocationAttestation,
  verifyCircularGeofence
} = require('../services/privateGeolocationNftService');

const router = express.Router();

router.get('/schema', (_req, res) => {
  res.json({
    feature: 'private-geolocation-nft',
    version: 'v1',
    storesExactCoordinatesPublicly: false,
    disclosureScopes: ['verified-only', 'country', 'region', 'city'],
    endpoints: {
      verify: 'POST /api/nft/geolocation/verify',
      attest: 'POST /api/nft/geolocation/attest'
    }
  });
});

router.post('/verify', (req, res) => {
  try {
    const result = verifyCircularGeofence(req.body.location, req.body.geofence);
    res.json({
      locationVerified: result.verified,
      radiusMeters: result.radiusMeters
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/attest', (req, res) => {
  try {
    const result = createPrivateGeolocationAttestation(req.body);
    res.status(result.verified ? 201 : 422).json({
      success: result.verified,
      mintReady: result.verified,
      note: 'This endpoint creates privacy-preserving NFT metadata/attestation only; blockchain minting is handled separately.',
      metadata: result.metadata
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
