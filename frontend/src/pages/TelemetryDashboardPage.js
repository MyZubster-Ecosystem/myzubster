import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './TelemetryDashboardPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const REFRESH_INTERVAL_MS = 15000;

export function normalizeTelemetryPayload(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const latest = payload?.latest || rows[0] || null;
  return { latest, rows };
}

export function metricPercent(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || max <= min) return 0;
  return Math.max(0, Math.min(100, ((numeric - min) / (max - min)) * 100));
}

function numberLabel(value, suffix) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(1)}${suffix}` : 'Unavailable';
}

function timeLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
}

function Metric({ label, value, suffix, percent, tone }) {
  return (
    <section className="telemetry-metric" aria-label={label}>
      <span>{label}</span>
      <strong>{numberLabel(value, suffix)}</strong>
      <div className="telemetry-meter" role="meter" aria-label={`${label} level`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(percent)}>
        <span className={`telemetry-meter-fill telemetry-meter-${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}

export function TelemetryTable({ rows }) {
  return (
    <table>
      <thead>
        <tr><th>Device</th><th>Status</th><th>Temperature</th><th>Humidity</th><th>Battery</th><th>Timestamp</th></tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row._id || `${row.robotId}-${row.timestamp}-${index}`}>
            <td>{String(row.robotId ?? 'Unknown')}</td>
            <td><span className="telemetry-status">{String(row.status ?? 'unknown')}</span></td>
            <td>{numberLabel(row.temperature, ' °C')}</td>
            <td>{numberLabel(row.humidity, '%')}</td>
            <td>{numberLabel(row.battery, '%')}</td>
            <td>{timeLabel(row.timestamp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TelemetryDashboardPage() {
  const [telemetry, setTelemetry] = useState({ latest: null, rows: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadTelemetry = useCallback(async (signal) => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/telemetry?limit=50&sort=desc`, { signal });
      if (!response.ok) throw new Error(`Telemetry API returned ${response.status}`);
      const payload = await response.json();
      if (payload?.success === false) throw new Error(payload.error || 'Telemetry API rejected the request');
      setTelemetry(normalizeTelemetryPayload(payload));
      setLastUpdated(new Date());
      setError('');
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message || 'Unable to retrieve telemetry');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadTelemetry(controller.signal);
    const interval = setInterval(() => loadTelemetry(controller.signal), REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [loadTelemetry]);

  const latest = telemetry.latest;
  const deviceCount = useMemo(() => new Set(telemetry.rows.map((row) => String(row.robotId))).size, [telemetry.rows]);

  return (
    <main className="telemetry-page">
      <header className="telemetry-header">
        <div>
          <p className="telemetry-kicker">SPACE STATION / LIVE TELEMETRY</p>
          <h1>Mission systems</h1>
          <p className="telemetry-subtitle">{deviceCount} devices in the latest {telemetry.rows.length} samples</p>
        </div>
        <div className="telemetry-refresh">
          <span aria-live="polite">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Awaiting first update'}</span>
          <button type="button" onClick={() => loadTelemetry()} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && (
        <div className="telemetry-error" role="alert">
          <strong>Telemetry link unavailable.</strong>
          <span>{error}</span>
          <button type="button" onClick={() => loadTelemetry()} disabled={refreshing}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="telemetry-state" aria-live="polite">Connecting to the telemetry API...</div>
      ) : !latest ? (
        <div className="telemetry-state">The API is online, but no telemetry samples have arrived yet.</div>
      ) : (
        <>
          <section className="telemetry-overview" aria-label="Current telemetry">
            <div className="telemetry-identity">
              <span>ACTIVE DEVICE</span>
              <strong>{String(latest.robotId ?? 'Unknown device')}</strong>
              <small>{String(latest.status ?? 'unknown')} · {timeLabel(latest.timestamp)}</small>
            </div>
            <Metric label="Temperature" value={latest.temperature} suffix=" °C" percent={metricPercent(latest.temperature, -50, 150)} tone="temperature" />
            <Metric label="Humidity" value={latest.humidity} suffix="%" percent={metricPercent(latest.humidity, 0, 100)} tone="humidity" />
            <Metric label="Battery" value={latest.battery} suffix="%" percent={metricPercent(latest.battery, 0, 100)} tone="battery" />
          </section>

          <section className="telemetry-history" aria-labelledby="telemetry-history-title">
            <div className="telemetry-section-title">
              <div>
                <p>RECENT SIGNAL</p>
                <h2 id="telemetry-history-title">Telemetry history</h2>
              </div>
              <span>Auto-refreshes every 15 seconds</span>
            </div>
            <div className="telemetry-table-wrap">
              <TelemetryTable rows={telemetry.rows} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
