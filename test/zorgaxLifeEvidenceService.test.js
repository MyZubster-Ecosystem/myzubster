const {
  processBatch, processRecord, review, validate, makeReportable
} = require('../src/services/zorgaxLifeEvidenceService');

const base = {
  sourceId: 'synthetic-water-001',
  observationTimestamp: '2027-01-15T10:00:00Z',
  variable: 'nitrate',
  rawValue: 1200,
  unit: 'ug/L',
  assetRef: 'synthetic://pilot/water/001',
  accessClass: 'public'
};

describe('Zorgax LIFE evidence Phase 1', () => {
  test('happy path reaches REPORTABLE only after both human review gates', () => {
    let item = processRecord(base);
    expect(item.state).toBe('DRAFT_EVIDENCE');
    expect(item.normalizedValue).toBe(1.2);
    expect(item.unit).toBe('mg/L');
    item = review(item, { gate: 'technical', actor: 'life-technical-data-validator', approved: true });
    item = review(item, { gate: 'scientific', actor: 'life-scientific-coordinator', approved: true });
    item = validate(item, { actor: 'authorized_human' });
    item = makeReportable(item);
    expect(item.state).toBe('REPORTABLE');
    expect(item.reportable).toBe(true);
    expect(item.auditEvents.every(event => event.actor && event.timestamp && event.ruleVersion && event.reason)).toBe(true);
  });

  test('duplicate fingerprint does not create second evidence entry', () => {
    const [first, duplicate] = processBatch([base, { ...base }]);
    expect(first.state).toBe('DRAFT_EVIDENCE');
    expect(duplicate.state).toBe('SUPERSEDED');
    expect(duplicate.duplicate).toBe(true);
  });

  test('missing required field routes to MISSING_CONTEXT', () => {
    const item = processRecord({ ...base, assetRef: undefined });
    expect(item.state).toBe('MISSING_CONTEXT');
    expect(item.missingFields).toContain('assetRef');
  });

  test('anomaly blocks downstream validation', () => {
    const item = processRecord({ ...base, variable: 'ph', rawValue: 20, unit: 'pH' });
    expect(item.state).toBe('ANOMALY_REVIEW');
    expect(() => review(item, { gate: 'technical', actor: 'life-technical-data-validator', approved: true })).toThrow();
  });

  test('restricted evidence cannot become reportable', () => {
    let item = processRecord({ ...base, accessClass: 'restricted' });
    item = review(item, { gate: 'technical', actor: 'life-technical-data-validator', approved: true });
    item = review(item, { gate: 'scientific', actor: 'life-scientific-coordinator', approved: true });
    item = validate(item);
    expect(() => makeReportable(item)).toThrow('Restricted records cannot become REPORTABLE');
  });
});
