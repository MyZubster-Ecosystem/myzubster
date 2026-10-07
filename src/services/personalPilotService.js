const PILOT_TYPES = new Set(['garden', 'kefir']);
const DEVICE_KINDS = new Set(['esp32', 'arduino', 'sensor_gateway', 'other']);
const SENSOR_TYPES = new Set(['temperature', 'humidity', 'ph', 'ec', 'soil_moisture', 'light', 'pressure']);

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function normalizePilot(input = {}) {
  const type = clean(input.type, 20);
  const title = clean(input.title, 160);
  if (!PILOT_TYPES.has(type)) throw new Error('Tipo pilot non valido');
  if (!title) throw new Error('Titolo obbligatorio');
  const pilot = {
    type,
    title,
    description: clean(input.description, 1000),
    locationLabel: clean(input.locationLabel, 120),
  };
  // Exact coordinates/addresses are deliberately not part of this schema.
  if (type === 'kefir') {
    pilot.cultureId = clean(input.cultureId, 100);
    pilot.sampleId = clean(input.sampleId, 100);
  }
  return pilot;
}

function normalizeDevice(input = {}) {
  const deviceId = clean(input.deviceId, 80);
  const label = clean(input.label, 120);
  const kind = clean(input.kind, 30);
  if (!deviceId || !/^[A-Za-z0-9._:-]+$/.test(deviceId)) throw new Error('deviceId non valido');
  if (!label) throw new Error('Nome dispositivo obbligatorio');
  if (!DEVICE_KINDS.has(kind)) throw new Error('Tipo dispositivo non valido');
  const sensors = [...new Set((Array.isArray(input.sensors) ? input.sensors : []).map(x => clean(x, 40)).filter(x => SENSOR_TYPES.has(x)))];
  if (!sensors.length) throw new Error('Seleziona almeno un sensore');
  return { deviceId, label, kind, sensors, evidenceState: 'DECLARED' };
}

module.exports = { PILOT_TYPES, DEVICE_KINDS, SENSOR_TYPES, normalizePilot, normalizeDevice };
