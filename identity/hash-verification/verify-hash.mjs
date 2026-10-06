#!/usr/bin/env node
import fs from 'node:fs';
import { verifyDigest } from './hash.mjs';

const file = process.argv[2] || 'identity/MyZubster_Digital_Identity_Proof.json';

try {
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  const verification = verifyDigest(document);
  const result = {
    verifier: 'myzubster-independent-hash-check/v1',
    file,
    ...verification,
    canonicalization: 'omit sha256_canonical_payload; recursively sort object keys; preserve array order; compact JSON; UTF-8',
  };

  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  console.error(JSON.stringify({
    verifier: 'myzubster-independent-hash-check/v1',
    file,
    ok: false,
    error: 'The input could not be read as JSON.',
  }, null, 2));
  process.exitCode = 1;
}
