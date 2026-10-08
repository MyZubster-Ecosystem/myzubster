'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020').default;

const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'docs/infrastructure/external-project-verification.schema.json');
const registryPath = path.join(root, 'docs/infrastructure/external-project-verification-registry.json');
const manifestsDir = path.join(root, 'docs/infrastructure/external-projects');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false, formats: {
  'date-time': {
    type: 'string',
    validate: value => !Number.isNaN(Date.parse(value))
  }
}});
const validate = ajv.compile(schema);

let failed = false;
const manifests = new Map();

for (const name of fs.readdirSync(manifestsDir).filter(n => n.endsWith('.json')).sort()) {
  const full = path.join(manifestsDir, name);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (error) {
    failed = true;
    console.error(`${name}: invalid JSON: ${error.message}`);
    continue;
  }

  if (!validate(data)) {
    failed = true;
    console.error(`${name}: schema validation failed`);
    for (const error of validate.errors || []) {
      console.error(`  ${error.instancePath || '/'} ${error.message}`);
    }
    continue;
  }

  if (manifests.has(data.id)) {
    failed = true;
    console.error(`${name}: duplicate id ${data.id}`);
    continue;
  }

  if (data.status === 'READY' && data.result.outcome !== 'NOT_RUN') {
    failed = true;
    console.error(`${name}: READY must still be NOT_RUN`);
  }

  if (data.status === 'PROPOSED' && data.result.outcome !== 'NOT_RUN') {
    failed = true;
    console.error(`${name}: PROPOSED must be NOT_RUN`);
  }

  manifests.set(data.id, { name, data });
  console.log(`${name}: PASS (${data.status})`);
}

if (registry.schema !== 'myzubster.external-project-verification-registry.v1') {
  failed = true;
  console.error('registry: unexpected schema');
}

const indexed = new Set();
for (const entry of registry.entries || []) {
  if (indexed.has(entry.id)) {
    failed = true;
    console.error(`registry: duplicate id ${entry.id}`);
    continue;
  }
  indexed.add(entry.id);

  const found = manifests.get(entry.id);
  if (!found) {
    failed = true;
    console.error(`registry: missing manifest for ${entry.id}`);
    continue;
  }

  const expectedPath = `docs/infrastructure/external-projects/${found.name}`;
  if (entry.manifest !== expectedPath) {
    failed = true;
    console.error(`registry: path mismatch for ${entry.id}`);
  }

  if (entry.status !== found.data.status) {
    failed = true;
    console.error(`registry: status mismatch for ${entry.id}`);
  }
}

for (const id of manifests.keys()) {
  if (!indexed.has(id)) {
    failed = true;
    console.error(`registry: manifest ${id} is not indexed`);
  }
}

if (failed) process.exit(1);
