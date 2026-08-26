const fs = require('fs');
const path = require('path');
const {
  processBatch,
  review,
  validate,
  makeReportable
} = require('../../src/services/zorgaxLifeEvidenceService');

const datasetPath = path.join(__dirname, 'synthetic-water.json');
const records = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

console.log('Zorgax LIFE Automation v1 — synthetic vertical slice');
console.log(`Input records: ${records.length}`);

const ingested = processBatch(records);
const reportable = [];

for (const original of ingested) {
  console.log(`\n${original.recordId || 'no-record-id'}: ${original.state}`);
  if (original.state !== 'DRAFT_EVIDENCE') continue;

  let item = review(original, {
    gate: 'technical',
    actor: 'life-technical-data-validator',
    approved: true,
    reason: 'synthetic demo technical review'
  });

  item = review(item, {
    gate: 'scientific',
    actor: 'life-scientific-coordinator',
    approved: true,
    reason: 'synthetic demo scientific review'
  });

  item = validate(item, {
    actor: 'authorized_human',
    reason: 'synthetic demo human validation'
  });

  item = makeReportable(item);
  reportable.push(item);
  console.log(`  -> ${item.state}`);
}

const output = {
  generatedAt: new Date().toISOString(),
  dataPolicy: 'synthetic_only',
  inputCount: records.length,
  reportableCount: reportable.length,
  records: reportable
};

const outPath = path.join(__dirname, 'output.reportable.json');
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`\nReportable export written to ${outPath}`);
console.log(`REPORTABLE: ${reportable.length}/${records.length}`);
