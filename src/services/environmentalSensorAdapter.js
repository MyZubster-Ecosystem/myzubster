const SCHEMA_VERSION = 'environmental-reading/1.0';
const QUALITY_STATUSES = Object.freeze(['VALID', 'SUSPECT', 'INVALID']);

class SensorReadingValidationError extends Error {
  constructor(code, message, field) {
    super(message);
    this.name = 'SensorReadingValidationError';
    this.code = code;
    this.field = field;
  }
}

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new SensorReadingValidationError('MISSING_FIELD', `${field} is required`, field);
  }
  return value.trim();
}

function normalizeTimestamp(value) {
  const timestamp = requiredString(value, 'observedAt');
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp)) {
    throw new SensorReadingValidationError(
      'INVALID_TIMESTAMP',
      'observedAt must include a UTC offset',
      'observedAt'
    );
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    throw new SensorReadingValidationError('INVALID_TIMESTAMP', 'observedAt is invalid', 'observedAt');
  }
  return parsed.toISOString();
}

function normalizeUnits(units) {
  if (!units || typeof units !== 'object') {
    throw new TypeError('units definition is required');
  }

  const canonical = requiredString(units.canonical, 'units.canonical');
  const aliases = new Set([canonical, ...(units.aliases || [])].map(unit => String(unit).trim().toLowerCase()));
  return Object.freeze({ canonical, aliases });
}

function normalizeRange(range) {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) {
    throw new TypeError('range must provide finite min and max values');
  }
  return Object.freeze({ min: range.min, max: range.max });
}

function createSensorAdapter(definition) {
  if (!definition || typeof definition !== 'object') throw new TypeError('adapter definition is required');

  const id = requiredString(definition.id, 'adapter.id');
  const version = requiredString(definition.version, 'adapter.version');
  const sensorType = requiredString(definition.sensorType, 'adapter.sensorType');
  const units = normalizeUnits(definition.units);
  const range = normalizeRange(definition.range);
  if (typeof definition.map !== 'function') throw new TypeError('adapter map function is required');

  function normalize(payload) {
    const mapped = definition.map(payload);
    if (!mapped || typeof mapped !== 'object' || Array.isArray(mapped)) {
      throw new SensorReadingValidationError('MALFORMED_READING', 'adapter map must return an object');
    }

    const sourceId = requiredString(mapped.sourceId, 'sourceId');
    const deviceId = requiredString(mapped.deviceId, 'deviceId');
    const observedAt = normalizeTimestamp(mapped.observedAt);
    const rawUnit = requiredString(mapped.unit, 'unit');
    if (!units.aliases.has(rawUnit.toLowerCase())) {
      throw new SensorReadingValidationError(
        'UNSUPPORTED_UNIT',
        `unit ${rawUnit} is not supported by ${id}`,
        'unit'
      );
    }

    const value = Number(mapped.value);
    if (!Number.isFinite(value)) {
      throw new SensorReadingValidationError('INVALID_VALUE', 'value must be a finite number', 'value');
    }
    if (value < range.min || value > range.max) {
      throw new SensorReadingValidationError(
        'VALUE_OUT_OF_RANGE',
        `value must be between ${range.min} and ${range.max} ${units.canonical}`,
        'value'
      );
    }

    const qualityStatus = requiredString(mapped.qualityStatus, 'qualityStatus').toUpperCase();
    if (!QUALITY_STATUSES.includes(qualityStatus)) {
      throw new SensorReadingValidationError(
        'INVALID_QUALITY_STATUS',
        `qualityStatus must be one of ${QUALITY_STATUSES.join(', ')}`,
        'qualityStatus'
      );
    }

    const method = requiredString(mapped.method, 'provenance.method');
    return Object.freeze({
      schemaVersion: SCHEMA_VERSION,
      sensorType,
      observedAt,
      value,
      unit: units.canonical,
      source: Object.freeze({ sourceId, deviceId }),
      quality: Object.freeze({ status: qualityStatus }),
      provenance: Object.freeze({
        adapterId: id,
        adapterVersion: version,
        method,
        rawValue: mapped.value,
        rawUnit,
        metadata: Object.freeze({ ...(mapped.metadata || {}) })
      })
    });
  }

  return Object.freeze({ id, version, sensorType, normalize });
}

module.exports = {
  QUALITY_STATUSES,
  SCHEMA_VERSION,
  SensorReadingValidationError,
  createSensorAdapter
};
