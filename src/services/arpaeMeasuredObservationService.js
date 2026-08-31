const https = require('https');
const { createEvidenceRecord } = require('./evidenceVerticalSliceService');

const ARPAE_DATASET_PAGE = 'https://dati.arpae.it/dataset/dati-dalle-stazioni-meteo-locali-della-rete-idrometeorologica-regionale';
const ARPAE_REALTIME_URL = 'https://dati-simc.arpae.it/opendata/osservati/meteo/realtime/realtime.jsonl';
const ARPAE_LICENSE = 'Creative Commons Attribution';
const DEFAULT_TARGET = Object.freeze({ lat: 44.0678, lon: 12.5695 });
const DEFAULT_STATION_NAMES = Object.freeze(['Rimini Urbana', 'Rimini']);

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function numericValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeTemperatureC(value) {
  let raw = numericValue(value);
  if (raw === null) return null;
  if (Math.abs(raw) > 1000) raw /= 100;
  const celsius = raw > 150 ? raw - 273.15 : raw;
  if (celsius < -80 || celsius > 90) return null;
  return Number(celsius.toFixed(2));
}

function decodeRelativeHumidity(value) {
  const raw = numericValue(value);
  if (raw === null || raw < 0 || raw > 100) return null;
  return Number(raw.toFixed(2));
}

function qualityAllows(variable) {
  if (!variable || typeof variable !== 'object') return false;
  const attrs = variable.a && typeof variable.a === 'object' ? variable.a : {};
  const manualInvalidation = attrs.B33196;
  return !(manualInvalidation === 1 || manualInvalidation === '1' || manualInvalidation === true);
}

function stationNameFromReport(report) {
  if (!report || !Array.isArray(report.data)) return null;
  for (const item of report.data) {
    if (!item || !item.vars || typeof item.vars !== 'object') continue;
    const candidate = item.vars.B01019;
    if (candidate && candidate.v !== undefined && candidate.v !== null) {
      return String(candidate.v).trim() || null;
    }
  }
  return null;
}

function isInstantaneous(item) {
  if (!item || !Array.isArray(item.timerange)) return true;
  return Number(item.timerange[0]) === 254 && Number(item.timerange[1] || 0) === 0 && Number(item.timerange[2] || 0) === 0;
}

function coordinatesFromReport(report) {
  const latRaw = numericValue(report && report.lat);
  const lonRaw = numericValue(report && report.lon);
  if (latRaw === null || lonRaw === null) return null;
  const lat = Math.abs(latRaw) > 90 ? latRaw / 100000 : latRaw;
  const lon = Math.abs(lonRaw) > 180 ? lonRaw / 100000 : lonRaw;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat: Number(lat.toFixed(5)), lon: Number(lon.toFixed(5)) };
}

function telemetryFromReport(report) {
  if (!report || !Array.isArray(report.data)) return {};
  const telemetry = {};

  for (const item of report.data) {
    if (!item || !item.vars || typeof item.vars !== 'object' || !isInstantaneous(item)) continue;

    const temperature = item.vars.B12101;
    if (telemetry.temperature_c === undefined && qualityAllows(temperature)) {
      const decoded = decodeTemperatureC(temperature.v);
      if (decoded !== null) telemetry.temperature_c = decoded;
    }

    const humidity = item.vars.B13003;
    if (telemetry.relative_humidity_pct === undefined && qualityAllows(humidity)) {
      const decoded = decodeRelativeHumidity(humidity.v);
      if (decoded !== null) telemetry.relative_humidity_pct = decoded;
    }
  }

  return telemetry;
}

function distanceSquared(a, b) {
  const dLat = a.lat - b.lat;
  const dLon = (a.lon - b.lon) * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return dLat * dLat + dLon * dLon;
}

function extractArpaeObservation(report, options = {}) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) return null;
  const observedAtRaw = report.date || report.datetime;
  const observedAt = new Date(observedAtRaw);
  if (!Number.isFinite(observedAt.getTime())) return null;

  const coordinates = coordinatesFromReport(report);
  if (!coordinates) return null;

  const telemetry = telemetryFromReport(report);
  if (Object.keys(telemetry).length === 0) return null;

  const stationName = stationNameFromReport(report) || 'ARPAE station';
  const network = String(report.network || 'unknown').trim().toLowerCase() || 'unknown';
  const preferredNames = (options.preferredStationNames || DEFAULT_STATION_NAMES).map(normalizeName);
  const normalizedStation = normalizeName(stationName);
  const preferredIndex = preferredNames.findIndex(name => normalizedStation === name || normalizedStation.includes(name));
  const target = options.target || DEFAULT_TARGET;

  return {
    station_name: stationName,
    network,
    coordinates,
    observed_at: observedAt.toISOString(),
    telemetry,
    preferred_index: preferredIndex,
    distance_score: distanceSquared(coordinates, target),
    source_report: report
  };
}

function betterCandidate(candidate, current) {
  if (!current) return true;
  const candidatePreferred = candidate.preferred_index >= 0;
  const currentPreferred = current.preferred_index >= 0;
  if (candidatePreferred !== currentPreferred) return candidatePreferred;
  if (candidatePreferred && candidate.preferred_index !== current.preferred_index) {
    return candidate.preferred_index < current.preferred_index;
  }
  if (candidate.distance_score !== current.distance_score) return candidate.distance_score < current.distance_score;
  return candidate.observed_at > current.observed_at;
}

function fetchLatestArpaeObservation(options = {}) {
  const url = options.url || ARPAE_REALTIME_URL;
  const timeoutMs = options.timeoutMs || 12000;
  const maxBytes = options.maxBytes || 12 * 1024 * 1024;

  return new Promise((resolve, reject) => {
    let settled = false;
    let buffer = '';
    let bytes = 0;
    let best = null;

    const request = https.get(url, {
      headers: {
        accept: 'application/x-ndjson, application/json, text/plain;q=0.9',
        'user-agent': 'MyZubster-evidence-source/1.0 (+https://github.com/MyZubster-Ecosystem/myzubster)'
      }
    }, response => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        return reject(new Error(`ARPAE source HTTP ${response.statusCode}`));
      }

      response.setEncoding('utf8');
      response.on('data', chunk => {
        if (settled) return;
        bytes += Buffer.byteLength(chunk);
        if (bytes > maxBytes) {
          settled = true;
          request.destroy();
          return reject(new Error('ARPAE source exceeded bounded fetch size'));
        }

        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let parsed;
          try {
            parsed = JSON.parse(line);
          } catch (_error) {
            continue;
          }
          const candidate = extractArpaeObservation(parsed, options);
          if (!candidate) continue;
          if (betterCandidate(candidate, best)) best = candidate;

          if (candidate.preferred_index === 0) {
            settled = true;
            response.destroy();
            return resolve(candidate);
          }
        }
      });

      response.on('end', () => {
        if (settled) return;
        settled = true;
        if (buffer.trim()) {
          try {
            const candidate = extractArpaeObservation(JSON.parse(buffer), options);
            if (candidate && betterCandidate(candidate, best)) best = candidate;
          } catch (_error) {}
        }
        if (!best) return reject(new Error('No compatible ARPAE observation found'));
        return resolve(best);
      });
    });

    request.setTimeout(timeoutMs, () => {
      if (settled) return;
      settled = true;
      request.destroy(new Error('ARPAE source timeout'));
    });

    request.on('error', error => {
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
}

function createArpaeEvidenceRecord(observation, options = {}) {
  if (!observation) return { ok: false, error: 'ARPAE observation required' };
  const sourceId = [
    'arpae',
    observation.network,
    observation.station_name.replace(/\s+/g, '-').toLowerCase(),
    observation.coordinates.lat,
    observation.coordinates.lon
  ].join(':');

  return createEvidenceRecord({
    source_class: 'MEASURED',
    context: `ARPAE observed meteorological data from ${observation.station_name}. Open data under ${ARPAE_LICENSE}; near-real-time observations remain provisional and may change after later validation.`,
    provenance: {
      source_id: sourceId,
      observed_at: observation.observed_at
    },
    authorization: {
      confirmed: true,
      scope: `Reuse of ARPAE observed meteorological open data under ${ARPAE_LICENSE} with attribution; no partnership or endorsement inferred.`,
      reference: ARPAE_DATASET_PAGE
    },
    telemetry: observation.telemetry
  }, options);
}

async function fetchArpaeMeasuredEvidence(options = {}) {
  const observation = await fetchLatestArpaeObservation(options);
  const prepared = createArpaeEvidenceRecord(observation, options);
  if (!prepared.ok) return prepared;
  return {
    ok: true,
    source: {
      provider: 'ARPAE Emilia-Romagna',
      dataset: 'Meteo - dati osservati',
      license: ARPAE_LICENSE,
      dataset_url: ARPAE_DATASET_PAGE,
      feed_url: ARPAE_REALTIME_URL,
      station_name: observation.station_name,
      network: observation.network,
      coordinates: observation.coordinates,
      provider_quality_state: 'near-real-time / provisional; subject to later validation'
    },
    evidence: prepared.record
  };
}

module.exports = {
  ARPAE_DATASET_PAGE,
  ARPAE_REALTIME_URL,
  ARPAE_LICENSE,
  DEFAULT_TARGET,
  DEFAULT_STATION_NAMES,
  decodeTemperatureC,
  decodeRelativeHumidity,
  qualityAllows,
  stationNameFromReport,
  coordinatesFromReport,
  telemetryFromReport,
  extractArpaeObservation,
  createArpaeEvidenceRecord,
  fetchLatestArpaeObservation,
  fetchArpaeMeasuredEvidence
};
