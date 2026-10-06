'use strict';

const { validPayload } = require('../src/routes/onionTelemetryRoutes');

const valid = {
  schema: 1,
  kind: 'onion_instance_heartbeat',
  release: '2026.09.04',
  runtime: 'docker',
  bucket: '0123456789abcdef0123456789abcdef'
};

describe('Onion telemetry privacy contract', () => {
  test('accepts the minimal allowlisted heartbeat', () => {
    expect(validPayload(valid)).toBe(true);
  });

  test.each([
    ['onion_hostname', 'example.onion'],
    ['hostname', 'host'],
    ['ip', '127.0.0.1'],
    ['userAgent', 'browser'],
    ['userId', '123'],
    ['containerId', 'abc'],
    ['installationId', 'stable-id'],
    ['privateKey', 'secret']
  ])('rejects forbidden identifier field %s', (key, value) => {
    expect(validPayload({ ...valid, [key]: value })).toBe(false);
  });

  test('rejects malformed and stable-looking unsupported payload shapes', () => {
    expect(validPayload({ ...valid, schema: 2 })).toBe(false);
    expect(validPayload({ ...valid, runtime: 'bare-metal' })).toBe(false);
    expect(validPayload({ ...valid, bucket: 'too-short' })).toBe(false);
    expect(validPayload({ ...valid, release: 'x'.repeat(65) })).toBe(false);
  });
});
