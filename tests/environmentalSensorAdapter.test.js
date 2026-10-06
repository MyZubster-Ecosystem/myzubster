const {
  QUALITY_STATUSES,
  SCHEMA_VERSION,
  SensorReadingValidationError,
  createSensorAdapter
} = require('../src/services/environmentalSensorAdapter');

function moistureAdapter() {
  return createSensorAdapter({
    id: 'synthetic-moisture-json',
    version: '1.0.0',
    sensorType: 'soil-moisture',
    units: { canonical: '%', aliases: ['percent'] },
    range: { min: 0, max: 100 },
    map: payload => ({
      sourceId: payload.source,
      deviceId: payload.device,
      observedAt: payload.timestamp,
      value: payload.moisture,
      unit: payload.unit,
      qualityStatus: payload.quality,
      method: 'synthetic-json',
      metadata: { sequence: payload.sequence }
    })
  });
}

const validPayload = {
  source: 'pilot-alpha-bed-3',
  device: 'moisture-probe-7',
  timestamp: '2026-08-30T14:00:00+02:00',
  moisture: 42.5,
  unit: 'percent',
  quality: 'valid',
  sequence: 18
};

describe('environmental sensor adapter contract', () => {
  test('normalizes a reading and preserves provenance end to end', () => {
    const reading = moistureAdapter().normalize(validPayload);

    expect(reading).toEqual({
      schemaVersion: SCHEMA_VERSION,
      sensorType: 'soil-moisture',
      observedAt: '2026-08-30T12:00:00.000Z',
      value: 42.5,
      unit: '%',
      source: {
        sourceId: 'pilot-alpha-bed-3',
        deviceId: 'moisture-probe-7'
      },
      quality: { status: 'VALID' },
      provenance: {
        adapterId: 'synthetic-moisture-json',
        adapterVersion: '1.0.0',
        method: 'synthetic-json',
        rawValue: 42.5,
        rawUnit: 'percent',
        metadata: { sequence: 18 }
      }
    });
    expect(Object.isFrozen(reading)).toBe(true);
    expect(Object.isFrozen(reading.provenance)).toBe(true);
  });

  test('supports a new sensor type without changing core normalization logic', () => {
    const waterUse = createSensorAdapter({
      id: 'pulse-counter',
      version: '2.1.0',
      sensorType: 'water-use',
      units: { canonical: 'L', aliases: ['litre'] },
      range: { min: 0, max: 10000 },
      map: payload => ({ ...payload, method: 'pulse-count' })
    });

    const reading = waterUse.normalize({
      sourceId: 'irrigation-zone-2',
      deviceId: 'flow-meter-4',
      observedAt: '2026-08-30T12:00:00Z',
      value: 17.2,
      unit: 'litre',
      qualityStatus: 'SUSPECT'
    });

    expect(reading.sensorType).toBe('water-use');
    expect(reading.unit).toBe('L');
    expect(reading.quality.status).toBe('SUSPECT');
    expect(reading.provenance.method).toBe('pulse-count');
  });

  test.each([
    ['source ID', { source: '' }, 'MISSING_FIELD', 'sourceId'],
    ['device ID', { device: undefined }, 'MISSING_FIELD', 'deviceId'],
    ['missing timestamp', { timestamp: undefined }, 'MISSING_FIELD', 'observedAt'],
    ['timestamp', { timestamp: '2026-08-30 12:00:00' }, 'INVALID_TIMESTAMP', 'observedAt'],
    ['unit', { unit: 'kg' }, 'UNSUPPORTED_UNIT', 'unit'],
    ['finite value', { moisture: 'not-a-number' }, 'INVALID_VALUE', 'value'],
    ['physical range', { moisture: 101 }, 'VALUE_OUT_OF_RANGE', 'value'],
    ['quality status', { quality: 'unchecked' }, 'INVALID_QUALITY_STATUS', 'qualityStatus']
  ])('rejects an invalid %s', (_label, patch, code, field) => {
    expect.assertions(3);
    try {
      moistureAdapter().normalize({ ...validPayload, ...patch });
    } catch (error) {
      expect(error).toBeInstanceOf(SensorReadingValidationError);
      expect(error.code).toBe(code);
      expect(error.field).toBe(field);
    }
  });

  test('rejects malformed adapter output', () => {
    const adapter = createSensorAdapter({
      id: 'malformed-adapter',
      version: '1.0.0',
      sensorType: 'temperature',
      units: { canonical: 'C' },
      range: { min: -50, max: 80 },
      map: () => null
    });

    expect(() => adapter.normalize({})).toThrow('adapter map must return an object');
  });

  test('publishes the allowed quality statuses as an immutable contract', () => {
    expect(QUALITY_STATUSES).toEqual(['VALID', 'SUSPECT', 'INVALID']);
    expect(Object.isFrozen(QUALITY_STATUSES)).toBe(true);
  });
});
