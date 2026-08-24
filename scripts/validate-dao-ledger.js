const { registry, validateRegistry } = require('../src/services/decentralizedDaoService');

const result = validateRegistry(registry);

if (!result.valid) {
  console.error('DAO ledger non valido. Il merge deve essere bloccato:');
  for (const error of result.errors) {
    console.error(`- ${error.code}: ${error.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log('DAO ledger valido.');
  console.log(JSON.stringify(result.summary, null, 2));
}
