const { increment, setGauge, observe, snapshot, resetForTests } = require('./realtimeObservability');

describe('realtimeObservability', () => {
  beforeEach(() => resetForTests());

  test('records counters, gauges and latency aggregates', () => {
    increment('connections', { outcome: 'success' });
    increment('connections', { outcome: 'success' });
    setGauge('active', 3);
    observe('latency_ms', 10);
    observe('latency_ms', 30);

    const state = snapshot();
    expect(state.counters['connections{outcome=success}']).toBe(2);
    expect(state.gauges.active).toBe(3);
    expect(state.histograms.latency_ms.count).toBe(2);
    expect(state.histograms.latency_ms.avg).toBe(20);
  });
});
