// k6 Test Scenarios Configuration
// Run specific scenarios: k6 run --env SCENARIO=stress load-test.js

export const scenarios = {
  // Smoke test: minimal load
  smoke: {
    executor: 'constant-vus',
    vus: 2,
    duration: '30s',
  },
  
  // Load test: normal traffic
  load: {
    executor: 'ramping-vus',
    stages: [
      { duration: '30s', target: 10 },
      { duration: '2m', target: 10 },
      { duration: '30s', target: 0 },
    ],
  },
  
  // Stress test: beyond normal capacity
  stress: {
    executor: 'ramping-vus',
    stages: [
      { duration: '30s', target: 20 },
      { duration: '1m', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 0 },
    ],
  },
  
  // Spike test: sudden traffic burst
  spike: {
    executor: 'ramping-vus',
    stages: [
      { duration: '10s', target: 5 },
      { duration: '5s', target: 100 },   // Spike!
      { duration: '30s', target: 100 },
      { duration: '5s', target: 5 },     // Drop
      { duration: '30s', target: 5 },
    ],
  },
  
  // Soak test: prolonged load
  soak: {
    executor: 'ramping-vus',
    stages: [
      { duration: '1m', target: 20 },
      { duration: '4m', target: 20 },    // 5 min sustained
      { duration: '1m', target: 0 },
    ],
  },
};

// Select scenario from environment
const scenarioName = __ENV.SCENARIO || 'load';
export default scenarios[scenarioName] || scenarios.load;
