const crypto = require('crypto');

const FORBIDDEN_KEYS = new Set([
  'token', 'accesstoken', 'apikey', 'secret', 'privatekey',
  'seed', 'password', 'webhooksecret', 'credentials'
]);

const PUBLIC_KEYS = new Set([
  'botId', 'name', 'softwareVersion', 'repositoryUrl',
  'releaseHash', 'capabilities', 'status', 'createdAt',
  'updatedAt', 'revokedAt'
]);

const CREATE_INPUT_KEYS = new Set([
  'name', 'softwareVersion', 'repositoryUrl', 'releaseHash', 'capabilities'
]);

function assertAllowedCreateInput(input = {}) {
  for (const key of Object.keys(input)) {
    if (!CREATE_INPUT_KEYS.has(key)) {
      const error = new Error(`Unsupported field: ${key}`);
      error.statusCode = 400;
      throw error;
    }
  }
}

function assertNoSecrets(input = {}) {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      const error = new Error(`Forbidden field: ${key}`);
      error.statusCode = 400;
      throw error;
    }
  }
}

function normalizeRepositoryUrl(value) {
  if (value === undefined || value === null || value === '') return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    const error = new Error('repositoryUrl must be a valid HTTPS URL');
    error.statusCode = 400;
    throw error;
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    const error = new Error('repositoryUrl must be a credential-free HTTPS URL');
    error.statusCode = 400;
    throw error;
  }

  return url.toString();
}

function createBotPassportInput(input = {}) {
  assertNoSecrets(input);
  assertAllowedCreateInput(input);

  const name = String(input.name || '').trim();
  const softwareVersion = String(input.softwareVersion || '').trim();
  const releaseHash = String(input.releaseHash || '').trim().toLowerCase();
  const capabilities = Array.isArray(input.capabilities)
    ? [...new Set(input.capabilities.map(value => String(value).trim()).filter(Boolean))]
    : [];

  if (!name || name.length > 80) throw badRequest('name is required and must be at most 80 characters');
  if (!softwareVersion || softwareVersion.length > 80) throw badRequest('softwareVersion is required and must be at most 80 characters');
  if (!/^[a-f0-9]{64}$/.test(releaseHash)) throw badRequest('releaseHash must be a SHA-256 hex digest');
  if (capabilities.length > 16 || capabilities.some(value => value.length > 64)) {
    throw badRequest('capabilities must contain at most 16 items of 64 characters');
  }

  return {
    botId: crypto.randomUUID(),
    name,
    softwareVersion,
    repositoryUrl: normalizeRepositoryUrl(input.repositoryUrl),
    releaseHash,
    capabilities
  };
}

function publicBotPassport(passport) {
  const source = passport && typeof passport.toObject === 'function'
    ? passport.toObject()
    : passport || {};

  return Object.fromEntries(
    Object.entries(source).filter(([key]) => PUBLIC_KEYS.has(key))
  );
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  createBotPassportInput,
  publicBotPassport,
  assertNoSecrets
};
