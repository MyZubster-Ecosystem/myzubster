const {
  decodeTemperatureC,
  extractArpaeObservation,
  createArpaeEvidenceRecord
} = require('../src/services/arpaeMeasuredObservationService');

function sampleReport(overrides = {}) {
  return {
    ident: null,
    network: 'rer',
    lon: 1256950,
    lat: 4406780,
    date: '2026-08-31T07:30:00Z',
    data: [
      {
        vars: {
          B01019: { v: 'Rimini Urbana' },
          B07030: { v: 5 }
        }
      },
      {
        timerange: [254, 0, 0],
        level: [103, 2000, null, null],
        vars: {
          B12101: { v: 297.15, a: {} },
          B13003: { v: 58, a: {} }
        }
      }
    ],
    ...overrides
  };
}

describe('ARPAE measured observation adapter', () => {
  test('decodes RMAP dry-bulb temperature from Kelvin to Celsius', () => {
    expect(decodeTemperatureC(297.15)).toBe(24);
    expect(decodeTemperatureC('29715')).toBe(24);
  });

  test('extracts Rimini observed temperature and humidity with provenance coordinates', () => {
    const observation = extractArpaeObservation(sampleReport());
    expect(observation).not.toBeNull();
    expect(observation.station_name).toBe('Rimini Urbana');
    expect(observation.preferred_index).toBe(0);
    expect(observation.coordinates).toEqual({ lat: 44.0678, lon: 12.5695 });
    expect(observation.telemetry).toEqual({ temperature_c: 24, relative_humidity_pct: 58 });
    expect(observation.observed_at).toBe('2026-08-31T07:30:00.000Z');
  });

  test('does not promote manually invalidated temperature into KPI telemetry', () => {
    const report = sampleReport();
    report.data[1].vars.B12101.a.B33196 = 1;
    const observation = extractArpaeObservation(report);
    expect(observation.telemetry.temperature_c).toBeUndefined();
    expect(observation.telemetry.relative_humidity_pct).toBe(58);
  });

  test('creates a measured evidence record with open-data authorization and no verification claim', () => {
    const observation = extractArpaeObservation(sampleReport());
    const result = createArpaeEvidenceRecord(observation, {
      now: new Date('2026-08-31T07:31:00.000Z')
    });

    expect(result.ok).toBe(true);
    expect(result.record.source_class).toBe('MEASURED');
    expect(result.record.truth_label).toBe('MEASURED_PENDING_HUMAN_REVIEW');
    expect(result.record.authorization.confirmed).toBe(true);
    expect(result.record.authorization.scope).toMatch(/Creative Commons Attribution/);
    expect(result.record.authorization.reference).toMatch(/dati\.arpae\.it/);
    expect(result.record.claims.measured).toBe(true);
    expect(result.record.claims.verified).toBe(false);
    expect(result.record.human_review.state).toBe('PENDING');
  });

  test('rejects reports with no supported usable measurement', () => {
    const report = sampleReport();
    report.data[1].vars.B12101.a.B33196 = 1;
    report.data[1].vars.B13003.a.B33196 = 1;
    expect(extractArpaeObservation(report)).toBeNull();
  });
});
