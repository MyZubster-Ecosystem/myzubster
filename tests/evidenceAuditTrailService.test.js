const {
  buildBaseline,
  buildZorgaxRecommendation,
  publicMeasurementView
} = require('../src/services/evidenceAuditTrailService');

function evidence(id, temperature, humidity, observedAt = '2026-08-31T07:30:00.000Z') {
  const kpis = [];
  if (temperature !== null && temperature !== undefined) {
    kpis.push({ key: 'temperature_c', value: temperature, unit: 'C' });
  }
  if (humidity !== null && humidity !== undefined) {
    kpis.push({ key: 'relative_humidity_pct', value: humidity, unit: 'pct' });
  }
  return {
    evidence_id: id,
    source_class: 'MEASURED',
    truth_label: 'MEASURED_HUMAN_REVIEWED',
    provenance: {
      source_id: 'arpae:test',
      observed_at: observedAt,
      received_at: observedAt
    },
    kpis,
    integrity: { digest_sha256: `digest-${id}` },
    human_review: {
      state: 'ACCEPTED',
      decision: 'ACCEPT',
      reviewed_at: observedAt
    }
  };
}

describe('evidence audit trail rules', () => {
  test('baseline remains blocked until enough accepted samples exist', () => {
    const baseline = buildBaseline([
      evidence('a', 20, 60),
      evidence('b', 21, 62)
    ]);

    expect(baseline.status).toBe('INSUFFICIENT_ACCEPTED_EVIDENCE');
    expect(baseline.accepted_sample_count).toBe(2);
    expect(baseline.metrics.temperature_c.ready).toBe(false);
  });

  test('builds bounded baseline from accepted evidence only', () => {
    const baseline = buildBaseline([
      evidence('a', 20, 60),
      evidence('b', 22, 64),
      evidence('c', 24, 68)
    ]);

    expect(baseline.status).toBe('READY');
    expect(baseline.metrics.temperature_c.average).toBe(22);
    expect(baseline.metrics.relative_humidity_pct.average).toBe(64);
    expect(baseline.metrics.temperature_c.count).toBe(3);
  });

  test('Zorgax prepares human attention when deviation exceeds threshold', () => {
    const baseline = buildBaseline([
      evidence('a', 20, 60),
      evidence('b', 21, 61),
      evidence('c', 22, 62)
    ]);
    const result = buildZorgaxRecommendation(evidence('d', 29, 80), baseline);

    expect(result.ok).toBe(true);
    expect(result.recommendation.classification).toBe('UPDATE_PREPARED');
    expect(result.recommendation.state).toBe('HUMAN_ATTENTION_SUGGESTED');
    expect(result.recommendation.reason_codes).toContain('TEMPERATURE_C_DEVIATION');
    expect(result.recommendation.reason_codes).toContain('RELATIVE_HUMIDITY_PCT_DEVIATION');
    expect(result.recommendation.automatic_action).toBe(false);
  });

  test('Zorgax returns NO_ACTION when accepted measurement stays in bounds', () => {
    const baseline = buildBaseline([
      evidence('a', 20, 60),
      evidence('b', 21, 61),
      evidence('c', 22, 62)
    ]);
    const result = buildZorgaxRecommendation(evidence('d', 23, 65), baseline);

    expect(result.ok).toBe(true);
    expect(result.recommendation.classification).toBe('NO_ACTION');
    expect(result.recommendation.automatic_action).toBe(false);
  });

  test('public timeline projection omits actor refs and review notes', () => {
    const measurement = {
      payload: {
        source: {
          provider: 'ARPAE Emilia-Romagna',
          dataset: 'Meteo - dati osservati',
          station_name: 'Rimini urbana',
          network: 'urbane',
          coordinates: { lat: 44.05, lon: 12.57 },
          license: 'Creative Commons Attribution',
          provider_quality_state: 'provisional'
        },
        evidence: evidence('a', 24.4, 67)
      }
    };
    const related = {
      review: {
        actorRef: 'private-reviewer',
        payload: {
          reviewed_evidence: {
            ...evidence('a', 24.4, 67),
            human_review: {
              state: 'ACCEPTED',
              decision: 'ACCEPT',
              reviewer_ref: 'private-reviewer',
              reviewed_at: '2026-08-31T08:00:00.000Z',
              note: 'private note'
            }
          }
        }
      }
    };

    const view = publicMeasurementView(measurement, related);
    expect(view.human_review.decision).toBe('ACCEPT');
    expect(view.human_review.reviewer_ref).toBeUndefined();
    expect(view.human_review.note).toBeUndefined();
  });
});
