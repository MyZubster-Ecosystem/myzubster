const {
  createEvidenceRecord,
  reviewEvidenceRecord,
  verifyEvidenceIntegrity
} = require('../src/services/evidenceVerticalSliceService');

describe('evidence vertical slice', () => {
  const observedAt = '2026-08-31T07:30:00.000Z';
  const now = new Date('2026-08-31T07:31:00.000Z');

  test('keeps synthetic telemetry explicitly simulated', () => {
    const result = createEvidenceRecord({
      source_class: 'SIMULATED',
      provenance: { source_id: 'EVA-IONI:simulation', observed_at: observedAt },
      telemetry: { temperature_c: 22.5, soil_moisture_pct: 47 }
    }, { now });

    expect(result.ok).toBe(true);
    expect(result.record.truth_label).toBe('SIMULATED_PENDING_HUMAN_REVIEW');
    expect(result.record.claims.simulated).toBe(true);
    expect(result.record.claims.measured).toBe(false);
    expect(result.record.claims.verified).toBe(false);
    expect(verifyEvidenceIntegrity(result.record)).toBe(true);
  });

  test('rejects measured evidence without explicit authorization', () => {
    const result = createEvidenceRecord({
      source_class: 'MEASURED',
      provenance: { source_id: 'sensor-001', observed_at: observedAt },
      telemetry: { relative_humidity_pct: 61 }
    }, { now });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/authorization\.confirmed/);
  });

  test('accepts bounded measured evidence but leaves verification pending', () => {
    const result = createEvidenceRecord({
      source_class: 'MEASURED',
      provenance: { source_id: 'sensor-001', observed_at: observedAt },
      authorization: {
        confirmed: true,
        scope: 'Environmental sensor pilot observation only',
        reference: 'AUTH-TEST-001'
      },
      telemetry: { temperature_c: 21.2, relative_humidity_pct: 63, soil_moisture_pct: 52 }
    }, { now });

    expect(result.ok).toBe(true);
    expect(result.record.truth_label).toBe('MEASURED_PENDING_HUMAN_REVIEW');
    expect(result.record.claims.measured).toBe(true);
    expect(result.record.claims.verified).toBe(false);
  });

  test('human acceptance does not turn simulated evidence into measured or independently verified evidence', () => {
    const prepared = createEvidenceRecord({
      source_class: 'SIMULATED',
      provenance: { source_id: 'EVA-IONI:simulation', observed_at: observedAt },
      telemetry: { temperature_c: 22.5 }
    }, { now });

    const reviewed = reviewEvidenceRecord(prepared.record, {
      decision: 'ACCEPT',
      reviewer_ref: 'maintainer:test',
      note: 'Accepted as a simulation demonstration.'
    }, { now: new Date('2026-08-31T07:32:00.000Z') });

    expect(reviewed.ok).toBe(true);
    expect(reviewed.record.truth_label).toBe('SIMULATED_HUMAN_REVIEWED');
    expect(reviewed.record.claims.human_reviewed).toBe(true);
    expect(reviewed.record.claims.measured).toBe(false);
    expect(reviewed.record.claims.verified).toBe(false);
    expect(verifyEvidenceIntegrity(reviewed.record)).toBe(true);
  });

  test('rejects tampered evidence before human review', () => {
    const prepared = createEvidenceRecord({
      source_class: 'SIMULATED',
      provenance: { source_id: 'EVA-IONI:simulation', observed_at: observedAt },
      telemetry: { temperature_c: 22.5 }
    }, { now });

    prepared.record.kpis[0].value = 79;
    const reviewed = reviewEvidenceRecord(prepared.record, {
      decision: 'ACCEPT',
      reviewer_ref: 'maintainer:test'
    }, { now });

    expect(reviewed.ok).toBe(false);
    expect(reviewed.error).toMatch(/integrity/);
  });

  test('rejects out-of-range environmental values', () => {
    const result = createEvidenceRecord({
      source_class: 'SIMULATED',
      provenance: { source_id: 'bad-sim', observed_at: observedAt },
      telemetry: { soil_moisture_pct: 150 }
    }, { now });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/outside supported range/);
  });
});
