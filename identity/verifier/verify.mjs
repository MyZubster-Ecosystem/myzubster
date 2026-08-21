#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  }
  return value;
}

function canonicalWithoutDigest(obj) {
  const copy = structuredClone(obj);
  delete copy.sha256_canonical_payload;
  return JSON.stringify(stable(copy));
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

const file = process.argv[2] || 'identity/MyZubster_Digital_Identity_Proof.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const calculated = sha256(canonicalWithoutDigest(data));
const expected = data.sha256_canonical_payload;

const checks = {
  schema_readable: typeof data === 'object' && data !== null,
  project_is_myzubster: data.project === 'MyZubster',
  legal_identity_claim_disabled: data.legal_identity_document === false,
  subject_present: typeof data.name === 'string' && data.name.length > 0,
  github_org_present: typeof data.github_organization === 'string' && data.github_organization.includes('github.com/MyZubster-Ecosystem'),
  digest_present: typeof expected === 'string' && /^[a-f0-9]{64}$/.test(expected),
  digest_matches: expected === calculated
};

const ok = Object.values(checks).every(Boolean);
const result = {
  verifier: 'myzubster-identity-verifier/v0.1',
  file,
  ok,
  subject: data.name,
  project: data.project,
  expected_sha256: expected,
  calculated_sha256: calculated,
  checks,
  scope: 'technical/project identity verification only; not legal identity verification'
};

console.log(JSON.stringify(result, null, 2));
process.exit(ok ? 0 : 1);
