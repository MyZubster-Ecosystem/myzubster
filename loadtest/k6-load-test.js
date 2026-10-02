/**
 * k6 load test for the MyZubster API (issue #99).
 *
 * Run:
 *   k6 run loadtest/k6-load-test.js
 *   BASE_URL=https://api.myzubster.example k6 run loadtest/k6-load-test.js
 *
 * Traffic model: ramp to 50 VUs (warm-up), hold (steady state), spike to
 * 150 VUs (autoscaling check), soak, then ramp down.
 *
 * SLO thresholds enforced by k6:
 *   - p95 response time  < 400 ms
 *   - p99 response time  < 900 ms
 *   - HTTP error rate    < 1%
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Custom metrics reported alongside k6 built-ins.
const apiErrors = new Rate('api_errors');
const bountyLookup = new Trend('bounty_lookup_duration', true);

export const options = {
  scenarios: {
    api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // warm-up
        { duration: '5m', target: 50 },   // steady state
        { duration: '2m', target: 150 },  // spike (autoscaling check)
        { duration: '3m', target: 150 },  // soak at peak
        { duration: '2m', target: 0 },    // cool down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<900'],
    http_req_failed: ['rate<0.01'],
    api_errors: ['rate<0.01'],
    bounty_lookup_duration: ['p(95)<500'],
  },
};

export default function () {
  group('health check', () => {
    const res = http.get(`${BASE_URL}/health`, { tags: { name: 'health' } });
    const ok = check(res, { 'health status 200': (r) => r.status === 200 });
    apiErrors.add(!ok);
  });

  group('list bounties', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/bounties?limit=20`, {
      tags: { name: 'bounties' },
    });
    bountyLookup.add(Date.now() - start);
    const ok = check(res, {
      'bounties status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
    apiErrors.add(!ok);
  });

  group('metrics endpoint', () => {
    const res = http.get(`${BASE_URL}/metrics`, { tags: { name: 'metrics' } });
    const ok = check(res, { 'metrics scrapeable': (r) => r.status === 200 });
    apiErrors.add(!ok);
  });

  sleep(Math.random() * 2 + 1); // realistic think time
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    'loadtest-summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const m = data.metrics || {};
  const dur = (m.http_req_duration && m.http_req_duration.values) || {};
  const failed = (m.http_req_failed && m.http_req_failed.values) || {};
  const reqs = (m.http_reqs && m.http_reqs.values) || {};
  return [
    '',
    '=== MyZubster load test summary ===',
    `total requests : ${reqs.count || 0}`,
    `throughput     : ${(reqs.rate || 0).toFixed(1)} req/s`,
    `p95 latency    : ${dur['p(95)'] ? dur['p(95)'].toFixed(1) : '?'} ms`,
    `p99 latency    : ${dur['p(99)'] ? dur['p(99)'].toFixed(1) : '?'} ms`,
    `error rate     : ${failed.rate ? (failed.rate * 100).toFixed(2) : '0.00'}%`,
    '===================================',
    '',
  ].join('\n');
}
