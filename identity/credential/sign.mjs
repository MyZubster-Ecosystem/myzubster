#!/usr/bin/env node
import fs from 'node:fs';

import { signCredential } from './lib.mjs';

const inputFile = process.argv[2];
const privateKeyFile = process.argv[3];
const outputFile = process.argv[4];
if (!inputFile || !privateKeyFile || !outputFile) {
  console.error('Usage: node identity/credential/sign.mjs <unsigned.json> <private-key.pem> <output.json>');
  process.exit(2);
}

if (outputFile === privateKeyFile) throw new Error('output must not overwrite the private key');
const unsignedCredential = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const privateKey = fs.readFileSync(privateKeyFile, 'utf8');
const signed = signCredential(unsignedCredential, privateKey);
fs.writeFileSync(outputFile, `${JSON.stringify(signed, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log(`Signed credential written to ${outputFile}; private key material was not copied.`);
