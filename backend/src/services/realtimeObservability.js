const crypto = require("crypto");

const SAMPLE_LIMIT = 2048;
const startedAt = new Date();

const counters = Object.create(null);
const gauges = Object.create(null);
const durationSamples = new Map();

function boundedNumber(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, minimum), maximum);
}

function incrementCounter(name, value = 1) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return;
  counters[name] = (counters[name] || 0) + amount;
}

function setGauge(name, value) {
  const amount = Number(value);
  gauges[name] = Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function adjustGauge(name, delta) {
  setGauge(name, (gauges[name] || 0) + Number(delta || 0));
}

function observeDuration(name, valueMs) {
  const value = Number(valueMs);
  if (!Number.isFinite(value) || value < 0) return;
  const samples = durationSamples.get(name) || [];
  samples.push(value);
  if (samples.length > SAMPLE_LIMIT)
    samples.splice(0, samples.length - SAMPLE_LIMIT);
  durationSamples.set(name, samples);
}

function percentile(sorted, ratio) {
  if (!sorted.length) return null;
  return sorted[
    Math.min(Math.ceil(sorted.length * ratio) - 1, sorted.length - 1)
  ];
}

function durationSummary(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    count: sorted.length,
    averageMs: sorted.length ? Number((sum / sorted.length).toFixed(2)) : null,
    p50Ms: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
    p99Ms: percentile(sorted, 0.99),
    maxMs: sorted.length ? sorted[sorted.length - 1] : null,
  };
}

function safeRatio(successes, attempts) {
  if (!attempts) return null;
  return Number((successes / attempts).toFixed(6));
}

function traceRef(value) {
  if (value === undefined || value === null || value === "") return null;
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex")
    .slice(0, 12);
}

const SAFE_LOG_FIELDS = new Set([
  "traceId",
  "socketRef",
  "channelRef",
  "sessionRef",
  "messageRef",
  "notificationRef",
  "operation",
  "status",
  "reason",
  "mode",
  "durationMs",
  "queuedMs",
  "recipientCount",
  "recovered",
]);

function logRealtimeEvent(event, fields = {}, level = "info") {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.REALTIME_STRUCTURED_LOGS === "false"
  )
    return;
  const payload = {
    timestamp: new Date().toISOString(),
    service: "myzubster-realtime",
    event: String(event || "realtime_event").slice(0, 100),
  };
  for (const [key, value] of Object.entries(fields)) {
    if (!SAFE_LOG_FIELDS.has(key) || value === undefined || value === null)
      continue;
    payload[key] = typeof value === "string" ? value.slice(0, 160) : value;
  }
  const logger =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  logger(JSON.stringify(payload));
}

function realtimeMetricsSnapshot() {
  const connectionAttempts = counters.connectionAttempts || 0;
  const messageAttempts = counters.messageAttempts || 0;
  const notificationAttempts = counters.notificationAttempts || 0;
  const resumeAttempts = counters.resumeAttempts || 0;
  const messageFailures = counters.messageFailures || 0;
  const notificationFailures = counters.notificationFailures || 0;
  const ratios = {
    connectionSuccess: safeRatio(
      counters.connectionSuccesses || 0,
      connectionAttempts,
    ),
    resumeSuccess: safeRatio(counters.resumeSuccesses || 0, resumeAttempts),
    messagePersistence: safeRatio(
      messageAttempts - messageFailures,
      messageAttempts,
    ),
    notificationPersistence: safeRatio(
      notificationAttempts - notificationFailures,
      notificationAttempts,
    ),
  };
  const latency = Object.fromEntries(
    [...durationSamples.entries()].map(([name, samples]) => [
      name,
      durationSummary(samples),
    ]),
  );
  const targets = {
    connectionSuccess: boundedNumber(
      process.env.REALTIME_SLO_CONNECTION_SUCCESS,
      0.995,
      0,
      1,
    ),
    resumeSuccess: boundedNumber(
      process.env.REALTIME_SLO_RESUME_SUCCESS,
      0.99,
      0,
      1,
    ),
    messagePersistence: boundedNumber(
      process.env.REALTIME_SLO_MESSAGE_PERSISTENCE,
      0.999,
      0,
      1,
    ),
    notificationPersistence: boundedNumber(
      process.env.REALTIME_SLO_NOTIFICATION_PERSISTENCE,
      0.999,
      0,
      1,
    ),
    messageP95Ms: boundedNumber(
      process.env.REALTIME_SLO_MESSAGE_P95_MS,
      500,
      1,
      60000,
    ),
  };
  const evaluations = {
    connectionSuccess: {
      target: targets.connectionSuccess,
      actual: ratios.connectionSuccess,
    },
    resumeSuccess: {
      target: targets.resumeSuccess,
      actual: ratios.resumeSuccess,
    },
    messagePersistence: {
      target: targets.messagePersistence,
      actual: ratios.messagePersistence,
    },
    notificationPersistence: {
      target: targets.notificationPersistence,
      actual: ratios.notificationPersistence,
    },
    messageP95Ms: {
      target: targets.messageP95Ms,
      actual: latency.messageProcessingMs?.p95Ms ?? null,
      comparator: "<=",
    },
  };
  for (const [name, evaluation] of Object.entries(evaluations)) {
    evaluation.met =
      evaluation.actual === null
        ? null
        : name === "messageP95Ms"
          ? evaluation.actual <= evaluation.target
          : evaluation.actual >= evaluation.target;
  }
  const alerts = Object.entries(evaluations)
    .filter(([, evaluation]) => evaluation.met === false)
    .map(([metric, evaluation]) => ({
      metric,
      actual: evaluation.actual,
      target: evaluation.target,
    }));
  if ((counters.redisFailures || 0) > 0)
    alerts.push({
      metric: "redisFailures",
      actual: counters.redisFailures,
      target: 0,
    });
  if ((counters.backpressureRejected || 0) > 0)
    alerts.push({
      metric: "backpressureRejected",
      actual: counters.backpressureRejected,
      target: 0,
    });

  return {
    startedAt: startedAt.toISOString(),
    generatedAt: new Date().toISOString(),
    counters: { ...counters },
    gauges: { ...gauges },
    latency,
    ratios,
    slo: { targets, evaluations },
    alerts,
  };
}

class RealtimeBackpressureError extends Error {
  constructor() {
    super("Realtime queue is full");
    this.name = "RealtimeBackpressureError";
    this.code = "REALTIME_BACKPRESSURE";
  }
}

function createBackpressureGate(options = {}) {
  const maxConcurrent = boundedNumber(
    options.maxConcurrent ?? process.env.REALTIME_MAX_CONCURRENT_OPERATIONS,
    64,
    1,
    10000,
  );
  const maxQueued = boundedNumber(
    options.maxQueued ?? process.env.REALTIME_MAX_QUEUED_OPERATIONS,
    256,
    0,
    50000,
  );
  let active = 0;
  const queue = [];

  function updateGauges() {
    setGauge("inflightOperations", active);
    setGauge("queuedOperations", queue.length);
  }

  function scheduleNext() {
    while (active < maxConcurrent && queue.length) {
      const item = queue.shift();
      observeDuration("queueWaitMs", Date.now() - item.queuedAt);
      start(item);
    }
    updateGauges();
  }

  function start(item) {
    active += 1;
    updateGauges();
    Promise.resolve()
      .then(item.task)
      .then(item.resolve, item.reject)
      .finally(() => {
        active -= 1;
        scheduleNext();
      });
  }

  function run(task) {
    return new Promise((resolve, reject) => {
      const item = { task, resolve, reject, queuedAt: Date.now() };
      if (active < maxConcurrent) {
        start(item);
        return;
      }
      if (queue.length >= maxQueued) {
        incrementCounter("backpressureRejected");
        reject(new RealtimeBackpressureError());
        return;
      }
      incrementCounter("backpressureQueued");
      queue.push(item);
      updateGauges();
    });
  }

  return {
    run,
    state: () => ({ active, queued: queue.length, maxConcurrent, maxQueued }),
  };
}

function resetRealtimeObservability() {
  for (const key of Object.keys(counters)) delete counters[key];
  for (const key of Object.keys(gauges)) delete gauges[key];
  durationSamples.clear();
}

module.exports = {
  RealtimeBackpressureError,
  adjustGauge,
  createBackpressureGate,
  incrementCounter,
  logRealtimeEvent,
  observeDuration,
  realtimeMetricsSnapshot,
  resetRealtimeObservability,
  setGauge,
  traceRef,
};
