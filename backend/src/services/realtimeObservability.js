const startedAt = Date.now();

const counters = new Map();
const gauges = new Map();
const histograms = new Map();

function labelKey(labels = {}) {
  const pairs = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  return pairs.map(([key, value]) => `${key}=${String(value)}`).join(',');
}

function metricKey(name, labels = {}) {
  const labelsPart = labelKey(labels);
  return labelsPart ? `${name}{${labelsPart}}` : name;
}

function increment(name, labels = {}, amount = 1) {
  const key = metricKey(name, labels);
  counters.set(key, (counters.get(key) || 0) + amount);
}

function setGauge(name, value, labels = {}) {
  gauges.set(metricKey(name, labels), Number(value) || 0);
}

function observe(name, value, labels = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return;
  const key = metricKey(name, labels);
  const row = histograms.get(key) || { count: 0, sum: 0, min: numeric, max: numeric };
  row.count += 1;
  row.sum += numeric;
  row.min = Math.min(row.min, numeric);
  row.max = Math.max(row.max, numeric);
  histograms.set(key, row);
}

function structuredLog(event, fields = {}) {
  const safe = {
    ts: new Date().toISOString(),
    event: String(event),
    connectionId: fields.connectionId || undefined,
    correlationId: fields.correlationId || undefined,
    channel: fields.channel || undefined,
    messageId: fields.messageId || undefined,
    notificationId: fields.notificationId || undefined,
    outcome: fields.outcome || undefined,
    reason: fields.reason || undefined,
    latencyMs: Number.isFinite(fields.latencyMs) ? fields.latencyMs : undefined
  };
  console.log(JSON.stringify(safe));
}

function snapshot() {
  const histogramSnapshot = {};
  for (const [key, row] of histograms.entries()) {
    histogramSnapshot[key] = {
      count: row.count,
      sum: row.sum,
      min: row.min,
      max: row.max,
      avg: row.count ? row.sum / row.count : 0
    };
  }
  return {
    uptimeMs: Date.now() - startedAt,
    counters: Object.fromEntries(counters.entries()),
    gauges: Object.fromEntries(gauges.entries()),
    histograms: histogramSnapshot,
    slo: {
      connectionSuccessTarget: 0.99,
      messagePersistSuccessTarget: 0.99,
      notificationPersistSuccessTarget: 0.99,
      reconnectRestoreSuccessTarget: 0.98
    }
  };
}

function resetForTests() {
  counters.clear();
  gauges.clear();
  histograms.clear();
}

module.exports = {
  increment,
  setGauge,
  observe,
  structuredLog,
  snapshot,
  resetForTests
};
