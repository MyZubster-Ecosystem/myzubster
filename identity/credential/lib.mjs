import crypto from 'node:crypto';

export const SCHEMA_VERSION = 'myzubster-technical-identity/v1';

export function parseJsonNoDuplicateKeys(text) {
  if (typeof text !== 'string') throw new TypeError('JSON input must be text');
  let position = 0;

  function skipWhitespace() {
    while (position < text.length && /\s/.test(text[position])) position += 1;
  }

  function readString() {
    if (text[position] !== '"') throw new SyntaxError('expected JSON string');
    const start = position;
    position += 1;
    while (position < text.length) {
      const character = text[position];
      if (character === '"') {
        position += 1;
        return JSON.parse(text.slice(start, position));
      }
      if (character === '\\') position += 1;
      position += 1;
    }
    throw new SyntaxError('unterminated JSON string');
  }

  function readValue() {
    skipWhitespace();
    const character = text[position];
    if (character === '"') return readString();
    if (character === '{') return readObject();
    if (character === '[') return readArray();
    for (const [literal, value] of [['true', true], ['false', false], ['null', null]]) {
      if (text.startsWith(literal, position)) {
        position += literal.length;
        return value;
      }
    }
    const match = text.slice(position).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) throw new SyntaxError('invalid JSON value');
    position += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new SyntaxError('JSON number must be finite');
    return value;
  }

  function readArray() {
    position += 1;
    const result = [];
    skipWhitespace();
    if (text[position] === ']') {
      position += 1;
      return result;
    }
    while (true) {
      result.push(readValue());
      skipWhitespace();
      if (text[position] === ']') {
        position += 1;
        return result;
      }
      if (text[position] !== ',') throw new SyntaxError('expected comma in JSON array');
      position += 1;
    }
  }

  function readObject() {
    position += 1;
    const result = {};
    const keys = new Set();
    skipWhitespace();
    if (text[position] === '}') {
      position += 1;
      return result;
    }
    while (true) {
      skipWhitespace();
      const key = readString();
      if (keys.has(key)) throw new SyntaxError('duplicate JSON object key: ' + key);
      keys.add(key);
      skipWhitespace();
      if (text[position] !== ':') throw new SyntaxError('expected colon in JSON object');
      position += 1;
      result[key] = readValue();
      skipWhitespace();
      if (text[position] === '}') {
        position += 1;
        return result;
      }
      if (text[position] !== ',') throw new SyntaxError('expected comma in JSON object');
      position += 1;
    }
  }

  const result = readValue();
  skipWhitespace();
  if (position !== text.length) throw new SyntaxError('unexpected trailing JSON content');
  return result;
}

function hasLoneSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function assertJsonValue(value, path = '$') {
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'string') {
    if (hasLoneSurrogate(value)) throw new TypeError(path + ' must contain valid Unicode');
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(path + ' must contain a finite JSON number');
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertJsonValue(entry, path + '[' + index + ']'));
    return;
  }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    for (const [key, entry] of Object.entries(value)) {
      if (hasLoneSurrogate(key)) throw new TypeError(path + ' must contain valid Unicode property names');
      assertJsonValue(entry, path + '.' + key);
    }
    return;
  }
  throw new TypeError(path + ' must contain only JSON-compatible values');
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return Object.is(value, -0) ? 0 : value;
}

export function canonicalCredential(credential) {
  const payload = structuredClone(credential);
  delete payload.signature;
  assertJsonValue(payload);
  return JSON.stringify(stable(payload));
}

export function publicKeyId(publicKey) {
  const key = publicKey instanceof crypto.KeyObject
    ? (publicKey.type === 'private' ? crypto.createPublicKey(publicKey) : publicKey)
    : crypto.createPublicKey(publicKey);
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('public key must be Ed25519');
  const digest = crypto.createHash('sha256').update(key.export({ type: 'spki', format: 'der' })).digest('base64url');
  return `ed25519:${digest}`;
}

export function signCredential(unsignedCredential, privateKey) {
  const key = privateKey instanceof crypto.KeyObject ? privateKey : crypto.createPrivateKey(privateKey);
  if (key.type !== 'private') throw new Error('signing key must be private');
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('private key must be Ed25519');
  const keyId = publicKeyId(crypto.createPublicKey(key));
  if (unsignedCredential.key_id !== keyId) throw new Error('credential key_id does not match signing key');
  const signature = crypto.sign(null, Buffer.from(canonicalCredential(unsignedCredential)), key).toString('base64');
  return { ...structuredClone(unsignedCredential), signature };
}

function parseCanonicalTimestamp(value) {
  if (typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return NaN;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return NaN;
  const canonical = new Date(timestamp).toISOString();
  return value === canonical || value === canonical.replace('.000Z', 'Z') ? timestamp : NaN;
}

function decodeBase64(value) {
  if (typeof value !== 'string' || value.length % 4 !== 0
    || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return null;
  const decoded = Buffer.from(value, 'base64');
  return decoded.toString('base64') === value ? decoded : null;
}

function inspectRegistry(registry) {
  const objectReadable = registry !== null && typeof registry === 'object' && !Array.isArray(registry);
  const keys = objectReadable && Array.isArray(registry.keys) ? registry.keys : [];
  const revoked = objectReadable && Array.isArray(registry.revoked_key_ids) ? registry.revoked_key_ids : [];
  const entriesWellFormed = keys.every((entry) => entry !== null
    && typeof entry === 'object'
    && !Array.isArray(entry)
    && typeof entry.id === 'string'
    && typeof entry.algorithm === 'string'
    && typeof entry.status === 'string'
    && typeof entry.public_key_pem === 'string');
  const revokedWellFormed = revoked.every((id) => typeof id === 'string');
  const ids = entriesWellFormed ? keys.map((entry) => entry.id) : [];
  return {
    keys,
    revoked,
    wellFormed: objectReadable && Array.isArray(registry.keys)
      && Array.isArray(registry.revoked_key_ids) && entriesWellFormed && revokedWellFormed,
    uniqueIds: entriesWellFormed && new Set(ids).size === ids.length,
  };
}

function trustedOrganization(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'github.com'
      && url.pathname.replace(/\/$/, '') === '/MyZubster-Ecosystem';
  } catch {
    return false;
  }
}

export function verifyCredential(credential, registry, now = new Date()) {
  const objectReadable = credential !== null && typeof credential === 'object' && !Array.isArray(credential);
  const registryInspection = inspectRegistry(registry);
  const trustedKey = objectReadable && registryInspection.wellFormed && registryInspection.uniqueIds
    ? registryInspection.keys.find((entry) => entry.id === credential.key_id)
    : undefined;
  let fingerprintMatches = false;
  let signatureValid = false;

  if (trustedKey?.public_key_pem) {
    try {
      fingerprintMatches = publicKeyId(trustedKey.public_key_pem) === trustedKey.id;
      const signature = decodeBase64(credential.signature);
      signatureValid = fingerprintMatches
        && signature?.length === 64
        && crypto.verify(null, Buffer.from(canonicalCredential(credential)), trustedKey.public_key_pem, signature);
    } catch {
      fingerprintMatches = false;
      signatureValid = false;
    }
  }

  const issued = objectReadable ? parseCanonicalTimestamp(credential.issued_at) : NaN;
  const expires = objectReadable ? parseCanonicalTimestamp(credential.expires_at) : NaN;
  const timestamp = now.getTime();
  const checks = {
    schema_readable: objectReadable,
    schema_version_supported: objectReadable && credential.schema_version === SCHEMA_VERSION,
    project_is_myzubster: objectReadable && credential.subject?.project === 'MyZubster',
    legal_identity_claim_disabled: objectReadable && credential.claims?.legal_identity_document === false,
    github_org_present: objectReadable && trustedOrganization(credential.subject?.github_organization),
    validity_window_well_formed: Number.isFinite(issued) && Number.isFinite(expires) && issued < expires,
    issued_not_in_future: Number.isFinite(issued) && issued <= timestamp,
    currently_valid: Number.isFinite(issued) && Number.isFinite(expires) && issued <= timestamp && timestamp <= expires,
    registry_well_formed: registryInspection.wellFormed,
    registry_key_ids_unique: registryInspection.uniqueIds,
    key_trusted: Boolean(trustedKey),
    key_algorithm_ed25519: trustedKey?.algorithm === 'Ed25519',
    key_active: trustedKey?.status === 'active',
    key_not_revoked: objectReadable && registryInspection.wellFormed
      && !registryInspection.revoked.includes(credential.key_id),
    key_fingerprint_matches: fingerprintMatches,
    signature_valid: signatureValid,
  };

  return {
    verifier: 'myzubster-signed-credential-verifier/v1',
    ok: Object.values(checks).every(Boolean),
    credential_id: objectReadable && typeof credential.credential_id === 'string' ? credential.credential_id : null,
    key_id: objectReadable && typeof credential.key_id === 'string' ? credential.key_id : null,
    checks,
    registry_freshness: 'not_evaluated; caller must authenticate and refresh the registry source',
    scope: 'self-attested technical/project identity only; not legal identity certification',
  };
}
