#!/usr/bin/env node
import fs from 'node:fs';
import { VERIFIER_VERSION, verifyIdentityJson } from './lib.mjs';

const file = process.argv[2] || 'identity/MyZubster_Digital_Identity_Proof.json';
let result;
try {
  result = verifyIdentityJson(fs.readFileSync(file, 'utf8'), file);
} catch {
  result = {
    verifier: VERIFIER_VERSION,
    file,
    ok: false,
    error: 'file_unreadable',
    checks: { schema_readable: false },
    scope: 'technical/project identity verification only; not legal identity verification',
  };
}

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
