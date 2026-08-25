const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY_VERSION = 'v1';
const DEFAULT_CONSENT_VERSION = 'location-privacy-v1';
const VISIBILITIES = new Set(['private', 'approximate', 'public']);

class LocationPrivacyError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'LocationPrivacyError';
    this.code = code;
  }
}

function parseEncryptionKey(rawKey = process.env.LOCATION_ENCRYPTION_KEY) {
  if (!rawKey) {
    throw new LocationPrivacyError(
      'LOCATION_ENCRYPTION_KEY is required when location data is stored',
      'LOCATION_KEY_MISSING'
    );
  }

  const key = /^[0-9a-f]{64}$/i.test(rawKey)
    ? Buffer.from(rawKey, 'hex')
    : Buffer.from(rawKey, 'base64');

  if (key.length !== 32) {
    throw new LocationPrivacyError(
      'LOCATION_ENCRYPTION_KEY must decode to exactly 32 bytes',
      'LOCATION_KEY_INVALID'
    );
  }

  return key;
}

function normalizeText(value, maxLength = 300) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function normalizeCoordinate(value, minimum, maximum, name) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new LocationPrivacyError(`${name} is outside its valid range`, 'LOCATION_COORDINATE_INVALID');
  }
  return parsed;
}

function roundCoordinate(value, decimals = 2) {
  if (value === undefined) return undefined;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeExactLocation(input) {
  const lat = normalizeCoordinate(input.lat ?? input.latitude, -90, 90, 'latitude');
  const lng = normalizeCoordinate(input.lng ?? input.longitude, -180, 180, 'longitude');

  if ((lat === undefined) !== (lng === undefined)) {
    throw new LocationPrivacyError(
      'latitude and longitude must be supplied together',
      'LOCATION_COORDINATE_PAIR_REQUIRED'
    );
  }

  return {
    lat,
    lng,
    address: normalizeText(input.address),
    city: normalizeText(input.city, 120),
    country: normalizeText(input.country, 120)
  };
}

function hasLocationData(location) {
  return Object.values(location).some(value => value !== undefined);
}

function encryptExactLocation(location, options = {}) {
  const key = options.key || parseEncryptionKey();
  const keyVersion = options.keyVersion || process.env.LOCATION_ENCRYPTION_KEY_VERSION || DEFAULT_KEY_VERSION;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const aad = Buffer.from(`myzubster-location:${keyVersion}`, 'utf8');
  cipher.setAAD(aad);

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(location), 'utf8'),
    cipher.final()
  ]);

  return {
    algorithm: ALGORITHM,
    keyVersion,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64')
  };
}

function decryptExactLocation(payload, options = {}) {
  if (!payload || !payload.ciphertext) return null;
  if (payload.algorithm !== ALGORITHM) {
    throw new LocationPrivacyError('Unsupported location encryption algorithm', 'LOCATION_ALGORITHM_INVALID');
  }

  const key = options.key || parseEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, 'base64'));
  decipher.setAAD(Buffer.from(`myzubster-location:${payload.keyVersion}`, 'utf8'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final()
  ]);

  return JSON.parse(plaintext.toString('utf8'));
}

function buildPublicLocation(exact, visibility, consent) {
  const common = {
    visibility,
    precision: visibility === 'public' ? 'exact' : visibility === 'approximate' ? 'approx-1km' : 'hidden',
    consentVersion: consent.version,
    consentedAt: consent.at
  };

  if (visibility === 'private') {
    return {
      ...common,
      country: exact.country
    };
  }

  if (visibility === 'approximate') {
    return {
      ...common,
      lat: roundCoordinate(exact.lat, 2),
      lng: roundCoordinate(exact.lng, 2),
      city: exact.city,
      country: exact.country
    };
  }

  return {
    ...common,
    ...exact
  };
}

function prepareLocation(input, options = {}) {
  if (input === undefined || input === null) {
    return { publicLocation: undefined, privateLocation: undefined };
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new LocationPrivacyError('location must be an object', 'LOCATION_PAYLOAD_INVALID');
  }

  const requestedVisibility = options.forcePrivate ? 'private' : (input.visibility || 'approximate');
  if (!VISIBILITIES.has(requestedVisibility)) {
    throw new LocationPrivacyError(
      'location visibility must be private, approximate or public',
      'LOCATION_VISIBILITY_INVALID'
    );
  }

  const exact = normalizeExactLocation(input);
  if (!hasLocationData(exact)) {
    return {
      publicLocation: { visibility: requestedVisibility, precision: 'hidden' },
      privateLocation: undefined
    };
  }

  if (input.consentGranted !== true && options.legacyMigration !== true) {
    throw new LocationPrivacyError(
      'explicit location consent is required',
      'LOCATION_CONSENT_REQUIRED'
    );
  }

  const consent = {
    version: options.legacyMigration
      ? 'legacy-unverified'
      : normalizeText(input.consentVersion, 80) || DEFAULT_CONSENT_VERSION,
    at: options.legacyMigration
      ? null
      : new Date().toISOString()
  };

  return {
    publicLocation: buildPublicLocation(exact, requestedVisibility, consent),
    privateLocation: encryptExactLocation(exact, options)
  };
}

function projectPublicLocation(location) {
  if (!location) return undefined;
  const source = typeof location.toObject === 'function' ? location.toObject() : { ...location };
  const visibility = VISIBILITIES.has(source.visibility) ? source.visibility : 'private';

  if (visibility === 'private') {
    return {
      visibility,
      precision: 'hidden',
      country: source.country
    };
  }

  if (visibility === 'approximate') {
    return {
      visibility,
      precision: 'approx-1km',
      lat: roundCoordinate(source.lat, 2),
      lng: roundCoordinate(source.lng, 2),
      city: source.city,
      country: source.country
    };
  }

  return {
    visibility,
    precision: 'exact',
    lat: source.lat,
    lng: source.lng,
    address: source.address,
    city: source.city,
    country: source.country
  };
}

function buildNftLocationMetadata(publicLocation, privateLocation) {
  const projected = projectPublicLocation(publicLocation) || { visibility: 'private', precision: 'hidden' };
  const metadata = {
    visibility: projected.visibility,
    city: projected.city,
    country: projected.country
  };

  if (privateLocation && privateLocation.ciphertext) {
    metadata.commitment = crypto
      .createHash('sha256')
      .update(`${privateLocation.ciphertext}.${privateLocation.authTag}`)
      .digest('hex');
  }

  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

module.exports = {
  LocationPrivacyError,
  prepareLocation,
  decryptExactLocation,
  projectPublicLocation,
  buildNftLocationMetadata,
  parseEncryptionKey
};
