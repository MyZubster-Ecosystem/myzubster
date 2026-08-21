#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const labelIndex = args.indexOf('--label');
const sourceIndex = args.indexOf('--source');

if (inputIndex === -1 || !args[inputIndex + 1]) {
  console.error('Usage: node scripts/time-machine-create-snapshot.js --input <state.json> [--label <label>] [--source <source>]');
  process.exit(1);
}

const inputPath = path.resolve(args[inputIndex + 1]);
const state = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const snapshotsPath = path.resolve(__dirname, '..', 'data', 'time-machine', 'snapshots.json');
const snapshots = JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));

const snapshot = {
  schemaVersion: '1.0.0',
  id: `tm-${randomUUID()}`,
  recordedAt: new Date().toISOString(),
  label: labelIndex !== -1 ? args[labelIndex + 1] : path.basename(inputPath),
  classification: 'recorded-public-state',
  provenance: {
    source: sourceIndex !== -1 ? args[sourceIndex + 1] : inputPath,
    generatedBy: 'scripts/time-machine-create-snapshot.js'
  },
  state,
  integrity: {
    algorithm: 'sha256'
  }
};

const canonical = JSON.stringify(snapshot);
snapshot.integrity.sha256 = crypto.createHash('sha256').update(canonical).digest('hex');

snapshots.push(snapshot);
fs.writeFileSync(snapshotsPath, `${JSON.stringify(snapshots, null, 2)}\n`);

console.log(JSON.stringify({ id: snapshot.id, recordedAt: snapshot.recordedAt, sha256: snapshot.integrity.sha256 }, null, 2));
