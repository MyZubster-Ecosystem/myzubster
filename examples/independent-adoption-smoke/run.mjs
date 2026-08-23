#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

function run(label, command, args) {
  process.stdout.write(`\n== ${label} ==\n$ ${command} ${args.join(' ')}\n`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(`${label}: unable to execute: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${label}: FAILED (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }

  console.log(`${label}: PASS`);
}

run('Canonical identity artifact verification', 'node', [
  'identity/verifier/verify.mjs',
  'identity/MyZubster_Digital_Identity_Proof.json',
]);

run('Signed technical credential test suite', 'node', [
  '--test',
  'identity/credential/credential.test.mjs',
]);

const gatewayBase = process.env.MYZUBSTER_GATEWAY_URL?.replace(/\/$/, '');

if (!gatewayBase) {
  console.log('\n== Optional Gateway check ==');
  console.log('SKIP: set MYZUBSTER_GATEWAY_URL to a Gateway base URL to test /api/health.');
} else {
  const url = `${gatewayBase}/api/health`;
  console.log(`\n== Optional Gateway check ==\nGET ${url}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Gateway health: FAILED (HTTP ${response.status})`);
      process.exit(1);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    console.log('Gateway health: PASS');
    console.log(typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body, null, 2));
  } catch (error) {
    console.error(`Gateway health: FAILED (${error.message})`);
    process.exit(1);
  }
}

console.log('\nIndependent smoke verification completed successfully.');
console.log('Boundary: these checks prove reproducible technical verification only; they do not prove legal identity, payment finality, partnership or commercial adoption.');
