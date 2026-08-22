import crypto from 'node:crypto';

export const SCHEMA_VERSION = 'myzubster-technical-identity/v1';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function canonicalCredential(credential) {
  const payload = structuredClone(credential);
  delete payload.signature;
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

function validDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
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
  const keys = Array.isArray(registry?.keys) ? registry.keys : [];
  const trustedKey = objectReadable ? keys.find((entry) => entry.id === credential.key_id) : undefined;
  let fingerprintMatches = false;
  let signatureValid = false;

  if (trustedKey?.public_key_pem) {
    try {
      fingerprintMatches = publicKeyId(trustedKey.public_key_pem) === trustedKey.id;
      const signature = typeof credential.signature === 'string'
        ? Buffer.from(credential.signature, 'base64')
        : Buffer.alloc(0);
      signatureValid = fingerprintMatches
        && signature.length === 64
        && crypto.verify(null, Buffer.from(canonicalCredential(credential)), trustedKey.public_key_pem, signature);
    } catch {
      fingerprintMatches = false;
      signatureValid = false;
    }
  }

  const issued = objectReadable && validDate(credential.issued_at) ? Date.parse(credential.issued_at) : NaN;
  const expires = objectReadable && validDate(credential.expires_at) ? Date.parse(credential.expires_at) : NaN;
  const timestamp = now.getTime();
  const revokedIds = Array.isArray(registry?.revoked_key_ids) ? registry.revoked_key_ids : [];
  const checks = {
    schema_readable: objectReadable,
    schema_version_supported: objectReadable && credential.schema_version === SCHEMA_VERSION,
    project_is_myzubster: objectReadable && credential.subject?.project === 'MyZubster',
    legal_identity_claim_disabled: objectReadable && credential.claims?.legal_identity_document === false,
    github_org_present: objectReadable && trustedOrganization(credential.subject?.github_organization),
    validity_window_well_formed: Number.isFinite(issued) && Number.isFinite(expires) && issued < expires,
    currently_valid: Number.isFinite(issued) && Number.isFinite(expires) && issued <= timestamp && timestamp <= expires,
    key_trusted: Boolean(trustedKey),
    key_algorithm_ed25519: trustedKey?.algorithm === 'Ed25519',
    key_active: trustedKey?.status === 'active',
    key_not_revoked: objectReadable && !revokedIds.includes(credential.key_id),
    key_fingerprint_matches: fingerprintMatches,
    signature_valid: signatureValid,
  };

  return {
    verifier: 'myzubster-signed-credential-verifier/v1',
    ok: Object.values(checks).every(Boolean),
    credential_id: objectReadable && typeof credential.credential_id === 'string' ? credential.credential_id : null,
    key_id: objectReadable && typeof credential.key_id === 'string' ? credential.key_id : null,
    checks,
    scope: 'self-attested technical/project identity only; not legal identity certification',
  };
}
