function normalizeTelemetryPayload(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const latest = payload?.latest || rows[0] || null;
  return { latest, rows };
}

function metricPercent(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || max <= min) return 0;
  return Math.max(0, Math.min(100, ((numeric - min) / (max - min)) * 100));
}

module.exports = { metricPercent, normalizeTelemetryPayload };
