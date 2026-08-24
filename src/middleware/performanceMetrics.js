/**
 * Zero-dependency performance instrumentation for any Express service (issue #99).
 *
 * Tracks response times, throughput, in-flight requests and error rates and
 * exposes them in two formats:
 *
 *   GET /metrics       -> Prometheus text exposition format (scrape target)
 *   GET /perf-summary  -> JSON summary (response times, throughput, errors)
 *
 * Integration (two lines in any Express app):
 *
 *   const { metricsMiddleware, metricsEndpoint } = require('./src/middleware/performanceMetrics');
 *   app.use(metricsMiddleware);   // count and time every request
 *   app.use(metricsEndpoint);     // serve /metrics and /perf-summary
 *
 * No new npm dependencies are introduced.
 */
'use strict';

const HISTOGRAM_BUCKETS_MS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
const MAX_SERIES = 1000; // bound label cardinality / memory usage

const requestsTotal = new Map(); // "METHOD|route|statusClass" -> count
const durations = new Map();     // "METHOD|route" -> { count, sum, buckets[] }
let inFlight = 0;
const startedAt = Date.now();

function routeLabel(req) {
  // Prefer the matched route template ("/bounties/:id") over the raw URL so
  // label cardinality stays bounded.
  if (req.route && req.route.path) return req.route.path;
  const raw = (req.baseUrl || '') + (req.path || '');
  return raw || 'unknown';
}

function bumpRequest(method, route, statusCode) {
  const statusClass = `${Math.floor(statusCode / 100)}xx`;
  const key = `${method}|${route}|${statusClass}`;
  requestsTotal.set(key, (requestsTotal.get(key) || 0) + 1);
  if (requestsTotal.size > MAX_SERIES) {
    requestsTotal.delete(requestsTotal.keys().next().value);
  }
}

function observeDuration(method, route, ms) {
  const key = `${method}|${route}`;
  let entry = durations.get(key);
  if (!entry) {
    if (durations.size >= MAX_SERIES) return; // memory protection
    entry = { count: 0, sum: 0, buckets: HISTOGRAM_BUCKETS_MS.map(() => 0) };
    durations.set(key, entry);
  }
  entry.count += 1;
  entry.sum += ms;
  for (let i = 0; i < HISTOGRAM_BUCKETS_MS.length; i += 1) {
    if (ms <= HISTOGRAM_BUCKETS_MS[i]) {
      entry.buckets[i] += 1;
      break;
    }
  }
}

/** Express middleware: measure every request. Mount before your routes. */
function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  inFlight += 1;
  res.on('finish', () => {
    inFlight -= 1;
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const route = routeLabel(req);
    bumpRequest(req.method, route, res.statusCode);
    observeDuration(req.method, route, ms);
  });
  next();
}

function escapeLabel(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/** Prometheus text exposition format (text/plain; version=0.0.4). */
function renderPrometheus() {
  const lines = [];

  lines.push('# HELP http_requests_total Total number of HTTP requests handled.');
  lines.push('# TYPE http_requests_total counter');
  for (const [key, value] of requestsTotal) {
    const [method, route, status] = key.split('|');
    lines.push(
      `http_requests_total{method="${escapeLabel(method)}",route="${escapeLabel(route)}",status="${status}"} ${value}`
    );
  }

  lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds.');
  lines.push('# TYPE http_request_duration_ms histogram');
  for (const [key, entry] of durations) {
    const [method, route] = key.split('|');
    const labels = `method="${escapeLabel(method)}",route="${escapeLabel(route)}"`;
    let cumulative = 0;
    for (let i = 0; i < HISTOGRAM_BUCKETS_MS.length; i += 1) {
      cumulative += entry.buckets[i];
      lines.push(`http_request_duration_ms_bucket{${labels},le="${HISTOGRAM_BUCKETS_MS[i]}"} ${cumulative}`);
    }
    lines.push(`http_request_duration_ms_bucket{${labels},le="+Inf"} ${entry.count}`);
    lines.push(`http_request_duration_ms_sum{${labels}} ${entry.sum.toFixed(3)}`);
    lines.push(`http_request_duration_ms_count{${labels}} ${entry.count}`);
  }

  lines.push('# HELP http_requests_in_flight Number of requests currently being handled.');
  lines.push('# TYPE http_requests_in_flight gauge');
  lines.push(`http_requests_in_flight ${inFlight}`);

  lines.push('# HELP process_uptime_seconds Seconds since the process started.');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${((Date.now() - startedAt) / 1000).toFixed(1)}`);

  return `${lines.join('\n')}\n`;
}

/** JSON summary: response times, throughput, errors (issue #99 metrics). */
function summary() {
  let total = 0;
  let errors5xx = 0;
  for (const [key, value] of requestsTotal) {
    total += value;
    if (key.split('|')[2] === '5xx') errors5xx += value;
  }

  let measured = 0;
  let sumMs = 0;
  let slowest = { route: null, avgMs: 0 };
  for (const [key, entry] of durations) {
    measured += entry.count;
    sumMs += entry.sum;
    const avgMs = entry.count ? entry.sum / entry.count : 0;
    if (avgMs > slowest.avgMs) slowest = { route: key, avgMs };
  }

  const uptimeSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  return {
    uptimeSeconds,
    requestsTotal: total,
    errors5xx,
    errorRate: total ? Number((errors5xx / total).toFixed(4)) : 0,
    throughputPerSecond: Number((total / uptimeSeconds).toFixed(2)),
    avgResponseTimeMs: measured ? Number((sumMs / measured).toFixed(2)) : 0,
    slowestRoute: slowest.route,
    slowestRouteAvgMs: Number(slowest.avgMs.toFixed(2)),
    inFlight,
  };
}

/** Express middleware: serves GET /metrics and GET /perf-summary. */
function metricsEndpoint(req, res, next) {
  const path = typeof req.path === 'string' ? req.path : (req.url || '/').split('?')[0];
  if (req.method === 'GET' && path === '/metrics') {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return res.end(renderPrometheus());
  }
  if (req.method === 'GET' && path === '/perf-summary') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(summary(), null, 2));
  }
  return next();
}

/** Test helper. */
function resetMetrics() {
  requestsTotal.clear();
  durations.clear();
  inFlight = 0;
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  renderPrometheus,
  summary,
  resetMetrics,
};
