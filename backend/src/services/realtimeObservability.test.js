const {
  RealtimeBackpressureError,
  adjustGauge,
  createBackpressureGate,
  incrementCounter,
  observeDuration,
  realtimeMetricsSnapshot,
  resetRealtimeObservability,
  traceRef,
} = require("./realtimeObservability");

describe("realtimeObservability", () => {
  beforeEach(() => resetRealtimeObservability());

  test("publishes aggregate counters, latency percentiles and SLO evaluations", () => {
    incrementCounter("connectionAttempts", 2);
    incrementCounter("connectionSuccesses", 2);
    incrementCounter("messageAttempts");
    incrementCounter("messagesPersisted");
    adjustGauge("activeConnections", 2);
    observeDuration("messageProcessingMs", 20);
    observeDuration("messageProcessingMs", 40);

    const snapshot = realtimeMetricsSnapshot();

    expect(snapshot.counters.connectionSuccesses).toBe(2);
    expect(snapshot.gauges.activeConnections).toBe(2);
    expect(snapshot.ratios.connectionSuccess).toBe(1);
    expect(snapshot.ratios.messagePersistence).toBe(1);
    expect(snapshot.latency.messageProcessingMs).toMatchObject({
      count: 2,
      p95Ms: 40,
    });
    expect(snapshot.slo.evaluations.connectionSuccess.met).toBe(true);
  });

  test("uses irreversible bounded references in structured traces", () => {
    const raw = "socket-session-secret-value";
    const ref = traceRef(raw);
    expect(ref).toMatch(/^[a-f0-9]{12}$/);
    expect(ref).not.toContain(raw);
    expect(traceRef(raw)).toBe(ref);
  });

  test("queues bounded work and rejects excess pressure", async () => {
    const gate = createBackpressureGate({ maxConcurrent: 1, maxQueued: 1 });
    let releaseFirst;
    const first = gate.run(
      () =>
        new Promise((resolve) => {
          releaseFirst = resolve;
        }),
    );
    const second = gate.run(async () => "second");

    await expect(gate.run(async () => "third")).rejects.toBeInstanceOf(
      RealtimeBackpressureError,
    );
    expect(gate.state()).toMatchObject({ active: 1, queued: 1 });

    releaseFirst("first");
    await expect(first).resolves.toBe("first");
    await expect(second).resolves.toBe("second");

    const snapshot = realtimeMetricsSnapshot();
    expect(snapshot.counters.backpressureQueued).toBe(1);
    expect(snapshot.counters.backpressureRejected).toBe(1);
    expect(snapshot.gauges.queuedOperations).toBe(0);
  });
});
