'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020').default;

const root = path.resolve(__dirname, '..');
const capabilityDir = path.join(root, 'docs/zorgax/capabilities');
const schemaPath = path.join(capabilityDir, 'capability.schema.json');
const registryPath = path.join(root, 'docs/zorgax/zorgax-capability-registry.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const files = fs.readdirSync(capabilityDir)
  .filter(name => name.endsWith('.json') && name !== 'capability.schema.json')
  .sort();

if (!files.length) {
  console.error('No Zorgax capability JSON files found.');
  process.exit(1);
}

const byId = new Map();
let failed = false;

for (const file of files) {
  const fullPath = path.join(capabilityDir, file);
  let data;

  try {
    data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    failed = true;
    console.error(`${file}: invalid JSON: ${error.message}`);
    continue;
  }

  if (!validate(data)) {
    failed = true;
    console.error(`${file}: schema validation failed`);
    for (const error of validate.errors || []) {
      console.error(`  ${error.instancePath || '/'} ${error.message}`);
    }
    continue;
  }

  if (byId.has(data.id)) {
    failed = true;
    console.error(`${file}: duplicate capability id ${data.id}`);
    continue;
  }

  if (data.status === 'TESTED' && data.evidenceRequirements.requiresBoundedTest !== true) {
    failed = true;
    console.error(`${file}: TESTED capability must require a bounded test`);
    continue;
  }

  if (data.status === 'TESTED') {
    const hasTestedCheckpoint = (data.linkedEvidence || []).some(
      item => item.kind === 'checkpoint' && item.state === 'TESTED'
    );
    if (!hasTestedCheckpoint) {
      failed = true;
      console.error(`${file}: TESTED capability requires linked TESTED checkpoint evidence`);
      continue;
    }
  }

  byId.set(data.id, { file, data });
  console.log(`${file}: PASS (${data.status})`);
}

if (registry.schema !== 'myzubster.zorgax-capability-registry.v1') {
  failed = true;
  console.error('registry: unexpected schema');
}

const registryIds = new Set();
for (const entry of registry.capabilities || []) {
  if (registryIds.has(entry.id)) {
    failed = true;
    console.error(`registry: duplicate capability id ${entry.id}`);
    continue;
  }
  registryIds.add(entry.id);

  const found = byId.get(entry.id);
  if (!found) {
    failed = true;
    console.error(`registry: missing capability file for ${entry.id}`);
    continue;
  }

  const expectedPath = `docs/zorgax/capabilities/${found.file}`;
  if (entry.path !== expectedPath) {
    failed = true;
    console.error(`registry: path mismatch for ${entry.id}: expected ${expectedPath}`);
  }

  if (entry.status !== found.data.status) {
    failed = true;
    console.error(`registry: status mismatch for ${entry.id}`);
  }
}

for (const id of byId.keys()) {
  if (!registryIds.has(id)) {
    failed = true;
    console.error(`registry: capability ${id} is not indexed`);
  }
}

if (failed) process.exit(1);
