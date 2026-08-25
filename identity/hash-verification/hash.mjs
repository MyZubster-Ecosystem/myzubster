import crypto from 'node:crypto';

export function sortRecursively(value) {
  if (Array.isArray(value)) return value.map(sortRecursively);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortRecursively(value[key])]),
    );
  }
  return value;
}

export function canonicalPayload(document) {
  const payload = structuredClone(document);
  delete payload.sha256_canonical_payload;
  return JSON.stringify(sortRecursively(payload));
}

export function calculateDigest(document) {
  return crypto
    .createHash('sha256')
    .update(canonicalPayload(document), 'utf8')
    .digest('hex');
}

export function verifyDigest(document) {
  const expected = document?.sha256_canonical_payload;
  const calculated = calculateDigest(document);
  const expectedIsSha256 = typeof expected === 'string' && /^[a-f0-9]{64}$/.test(expected);

  return {
    ok: expectedIsSha256 && expected === calculated,
    expected_sha256: expectedIsSha256 ? expected : null,
    calculated_sha256: calculated,
  };
}
