const fs = require('fs');
const path = require('path');
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

test('API-controlled text stays in React text nodes', () => {
  const attack = '<img src=x onerror=alert(1)>';
  expect(normalizeTelemetryPayload({ data: [{ robotId: attack }] }).rows[0].robotId).toBe(attack);
  const component = fs.readFileSync(path.join(__dirname, 'TelemetryDashboardPage.js'), 'utf8');
  expect(component).not.toContain('dangerouslySetInnerHTML');
  expect(component).not.toContain('innerHTML');
  expect(component).toContain("<td>{String(row.robotId ?? 'Unknown')}</td>");
});
