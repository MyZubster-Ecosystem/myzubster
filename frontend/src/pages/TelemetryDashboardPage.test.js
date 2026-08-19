import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { metricPercent, normalizeTelemetryPayload, TelemetryTable } from './TelemetryDashboardPage';

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
  const markup = renderToStaticMarkup(<TelemetryTable rows={[{
    robotId: attack,
    status: '<script>alert(1)</script>',
    temperature: 21,
    humidity: 50,
    battery: 80,
    timestamp: '2026-08-19T12:00:00Z',
  }]} />);
  expect(markup).toContain('&lt;img src=x onerror=alert(1)&gt;');
  expect(markup).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(markup).not.toContain('<script>');
});
