const { spawnSync } = require('node:child_process');

const esmTests = [
  'identity/credential/credential.test.mjs',
  'identity/verifier/verify.test.mjs',
  'identity/hash-verification/verify-hash.test.mjs',
  'workshop/app/domain.test.mjs',
  'workshop/app/integrate.test.mjs'
];

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

const jestArgs = process.argv.slice(2).filter(
  (arg) => !arg.startsWith('--testPathIgnorePatterns=')
);

run(process.execPath, [
  require.resolve('jest/bin/jest'),
  ...jestArgs
]);

run(process.execPath, ['--test', ...esmTests]);
