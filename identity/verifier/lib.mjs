import crypto from 'node:crypto';

export const VERIFIER_VERSION = 'myzubster-identity-verifier/v0.2';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function canonicalWithoutDigest(value) {
  const copy = structuredClone(value);
  delete copy.sha256_canonical_payload;
  return JSON.stringify(stable(copy));
}

export function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function isMyZubsterOrganization(value) {
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

export function verifyIdentityProof(data, file = '') {
  const schemaReadable = data !== null && typeof data === 'object' && !Array.isArray(data);
  const expected = schemaReadable ? data.sha256_canonical_payload : undefined;
  const calculated = schemaReadable ? sha256(canonicalWithoutDigest(data)) : null;
  const checks = {
    schema_readable: schemaReadable,
    project_is_myzubster: schemaReadable && data.project === 'MyZubster',
    legal_identity_claim_disabled: schemaReadable && data.legal_identity_document === false,
    subject_present: schemaReadable && typeof data.name === 'string' && data.name.trim().length > 0,
    github_org_present: schemaReadable && isMyZubsterOrganization(data.github_organization),
    digest_present: typeof expected === 'string' && /^[a-f0-9]{64}$/.test(expected),
    digest_matches: typeof expected === 'string' && expected === calculated,
  };

  return {
    verifier: VERIFIER_VERSION,
    file,
    ok: Object.values(checks).every(Boolean),
    subject: schemaReadable && typeof data.name === 'string' ? data.name : null,
    project: schemaReadable && typeof data.project === 'string' ? data.project : null,
    expected_sha256: typeof expected === 'string' ? expected : null,
    calculated_sha256: calculated,
    checks,
    scope: 'technical/project identity verification only; not legal identity verification',
  };
}

export function verifyIdentityJson(text, file = '') {
  try {
    return verifyIdentityProof(JSON.parse(text), file);
  } catch {
    return {
      verifier: VERIFIER_VERSION,
      file,
      ok: false,
      error: 'invalid_json',
      checks: { schema_readable: false },
      scope: 'technical/project identity verification only; not legal identity verification',
    };
  }
}
