const crypto = require('crypto');

const VERIFICATION_VERSION = 'private-geolocation-v1';
const ALLOWED_SCOPES = new Set(['verified-only', 'country', 'region', 'city']);

function assertCoordinate(value, name, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < min || value > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}`);
  }
}

function validatePoint(point) {
  if (!point || typeof point !== 'object') throw new Error('location is required');
  assertCoordinate(point.latitude, 'latitude', -90, 90);
  assertCoordinate(point.longitude, 'longitude', -180, 180);
}

function toRadians(value) {
  return value * Math.PI / 180;
}

function distanceMeters(a, b) {
  validatePoint(a);
  validatePoint(b);

  const earthRadius = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function verifyCircularGeofence(location, geofence) {
  validatePoint(location);
  if (!geofence || typeof geofence !== 'object') throw new Error('geofence is required');
  validatePoint(geofence.center);
  if (typeof geofence.radiusMeters !== 'number' || geofence.radiusMeters <= 0) {
    throw new Error('geofence.radiusMeters must be greater than zero');
  }

  const distance = distanceMeters(location, geofence.center);
  return {
    verified: distance <= geofence.radiusMeters,
    distanceMeters: Math.round(distance),
    radiusMeters: geofence.radiusMeters
  };
}

function evidenceHash({ location, timestamp, nonce, evidenceId }) {
  validatePoint(location);
  if (typeof nonce !== 'string' || nonce.length < 16) {
    throw new Error('nonce must be at least 16 characters');
  }
  if (!timestamp) throw new Error('timestamp is required');

  const canonical = JSON.stringify({
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: new Date(timestamp).toISOString(),
    nonce,
    evidenceId: evidenceId || null
  });

  return `sha256:${crypto.createHash('sha256').update(canonical).digest('hex')}`;
}

function publicLocationMetadata(scope, labels = {}) {
  if (!ALLOWED_SCOPES.has(scope)) throw new Error('unsupported disclosure scope');

  const metadata = {
    locationVerified: true,
    locationScope: scope
  };

  if (scope === 'country' && labels.country) metadata.country = labels.country;
  if (scope === 'region') {
    if (labels.country) metadata.country = labels.country;
    if (labels.region) metadata.region = labels.region;
  }
  if (scope === 'city') {
    if (labels.country) metadata.country = labels.country;
    if (labels.region) metadata.region = labels.region;
    if (labels.city) metadata.city = labels.city;
  }

  return metadata;
}

function createPrivateGeolocationAttestation(input) {
  const {
    location,
    geofence,
    timestamp,
    nonce,
    evidenceId,
    disclosureScope = 'verified-only',
    labels = {},
    activityType = 'real-world-activity'
  } = input || {};

  const geofenceResult = verifyCircularGeofence(location, geofence);
  const hash = evidenceHash({ location, timestamp, nonce, evidenceId });

  const metadata = {
    type: 'myzubster-private-geolocation-attestation',
    activityType,
    verificationVersion: VERIFICATION_VERSION,
    ...publicLocationMetadata(disclosureScope, labels),
    locationVerified: geofenceResult.verified,
    evidenceHash: hash,
    geofence: {
      verified: geofenceResult.verified,
      radiusMeters: geofenceResult.radiusMeters
    },
    verifiedAt: new Date(timestamp).toISOString()
  };

  return {
    verified: geofenceResult.verified,
    metadata
  };
}

module.exports = {
  VERIFICATION_VERSION,
  distanceMeters,
  verifyCircularGeofence,
  evidenceHash,
  publicLocationMetadata,
  createPrivateGeolocationAttestation
};
