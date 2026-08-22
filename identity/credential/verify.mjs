#!/usr/bin/env node
import fs from 'node:fs';

import { verifyCredential } from './lib.mjs';

const credentialFile = process.argv[2];
const registryFile = process.argv[3];
if (!credentialFile || !registryFile) {
  console.error('Usage: node identity/credential/verify.mjs <credential.json> <trusted-keys.json>');
  process.exit(2);
}

let result;
try {
  const credential = JSON.parse(fs.readFileSync(credentialFile, 'utf8'));
  const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  result = verifyCredential(credential, registry);
} catch {
  result = {
    verifier: 'myzubster-signed-credential-verifier/v1',
    ok: false,
    error: 'input_unreadable_or_invalid_json',
    scope: 'self-attested technical/project identity only; not legal identity certification',
  };
}

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
