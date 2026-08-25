const request = require('supertest');
const app = require('../server');
const {
  verifyCircularGeofence,
  evidenceHash,
  createPrivateGeolocationAttestation
} = require('../src/services/privateGeolocationNftService');

describe('private geolocation NFT', () => {
  const location = { latitude: 44.4949, longitude: 11.3426 };
  const geofence = {
    center: { latitude: 44.4950, longitude: 11.3425 },
    radiusMeters: 250
  };
  const timestamp = '2026-08-25T00:00:00.000Z';
  const nonce = '0123456789abcdef0123456789abcdef';

  test('verifies a point inside a circular geofence', () => {
    const result = verifyCircularGeofence(location, geofence);
    expect(result.verified).toBe(true);
    expect(result.distanceMeters).toBeLessThanOrEqual(250);
  });

  test('hashes private evidence without exposing coordinates', () => {
    const hash = evidenceHash({ location, timestamp, nonce, evidenceId: 'obs-1' });
    expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hash).not.toContain(String(location.latitude));
    expect(hash).not.toContain(String(location.longitude));
  });

  test('creates public metadata without exact GPS', () => {
    const result = createPrivateGeolocationAttestation({
      location,
      geofence,
      timestamp,
      nonce,
      evidenceId: 'obs-1',
      disclosureScope: 'region',
      labels: { country: 'Italy', region: 'Emilia-Romagna' },
      activityType: 'permaculture-observation'
    });

    expect(result.verified).toBe(true);
    expect(result.metadata.locationVerified).toBe(true);
    expect(result.metadata.region).toBe('Emilia-Romagna');
    expect(result.metadata).not.toHaveProperty('latitude');
    expect(result.metadata).not.toHaveProperty('longitude');
    expect(JSON.stringify(result.metadata)).not.toContain('44.4949');
    expect(JSON.stringify(result.metadata)).not.toContain('11.3426');
  });

  test('API returns mint-ready metadata for verified location', async () => {
    const response = await request(app)
      .post('/api/nft/geolocation/attest')
      .send({
        location,
        geofence,
        timestamp,
        nonce,
        evidenceId: 'obs-1',
        disclosureScope: 'city',
        labels: { country: 'Italy', region: 'Emilia-Romagna', city: 'Bologna' }
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.mintReady).toBe(true);
    expect(response.body.metadata.city).toBe('Bologna');
    expect(response.body.metadata).not.toHaveProperty('latitude');
    expect(response.body.metadata).not.toHaveProperty('longitude');
  });

  test('API rejects weak nonces', async () => {
    const response = await request(app)
      .post('/api/nft/geolocation/attest')
      .send({ location, geofence, timestamp, nonce: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
