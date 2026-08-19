const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { metricPercent, normalizeTelemetryPayload } = require('./telemetryUtils');

test('normalizes telemetry responses and falls back to the first row', () => {
  const row = { robotId: 'station-1', temperature: 22, humidity: 48, battery: 90 };
  expect(normalizeTelemetryPayload({ data: [row] })).toEqual({ latest: row, rows: [row] });
  expect(normalizeTelemetryPayload({ data: 'invalid' })).toEqual({ latest: null, rows: [] });
});

test('clamps visual metric values', () => {
  expect(metricPercent(50, 0, 100)).toBe(50);
  expect(metricPercent(200, 0, 100)).toBe(100);
  expect(metricPercent('invalid', 0, 100)).toBe(0);
});

test('API-controlled text is escaped by React', () => {
  const attack = '<img src=x onerror=alert(1)>';
  const markup = renderToStaticMarkup(React.createElement('td', null, attack));
  expect(markup).toContain('&lt;img src=x onerror=alert(1)&gt;');
  const component = fs.readFileSync(path.join(__dirname, 'TelemetryDashboardPage.js'), 'utf8');
  expect(component).not.toContain('dangerouslySetInnerHTML');
  expect(component).not.toContain('innerHTML');
});
