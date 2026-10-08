const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020').default;
const addFormats = (() => {
  try { return require('ajv-formats'); } catch (_) { return null; }
})();

const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'docs/contributors/interoperability-checkpoint.schema.json');
const examplesDir = path.join(root, 'docs/contributors/interoperability-checkpoints');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });

if (addFormats) addFormats(ajv);
else {
  ajv.addFormat('date-time', {
    type: 'string',
    validate: (value) => !Number.isNaN(Date.parse(value))
  });
}

const validate = ajv.compile(schema);
const files = fs.existsSync(examplesDir)
  ? fs.readdirSync(examplesDir).filter((name) => name.endsWith('.json')).sort()
  : [];

if (!files.length) {
  console.error('No interoperability checkpoint JSON files found.');
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const fullPath = path.join(examplesDir, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    failed = true;
    console.error(`${file}: invalid JSON: ${error.message}`);
    continue;
  }

  const ok = validate(data);
  if (!ok) {
    failed = true;
    console.error(`${file}: schema validation failed`);
    for (const error of validate.errors || []) {
      console.error(`  ${error.instancePath || '/'} ${error.message}`);
    }
    continue;
  }

  console.log(`${file}: PASS (${data.evidenceState})`);
}

if (failed) process.exit(1);
