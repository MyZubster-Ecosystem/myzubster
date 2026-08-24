'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const { MongoTreasuryStore } = require('../src/services/mongoTreasuryStore');
const { createMongoTreasuryService } = require('../src/services/mongoTreasuryService');

async function main() {
  const uri = process.env.P0_TREASURY_MONGODB_URI;
  if (!uri) throw new Error('P0_TREASURY_MONGODB_URI is required');

  const dbName = process.env.P0_TREASURY_TEST_DB || 'myzubster_p0_treasury_crash_test';
  const stateFile = process.env.P0_TREASURY_CRASH_STATE || '.p0-treasury-crash-state.json';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const asset = `CRASH-${suffix}`;
  const network = 'integration';
  const reservationId = `crash-reservation-${suffix}`;

  await mongoose.connect(uri, { dbName });
  try {
    const store = new MongoTreasuryStore();
    const treasury = createMongoTreasuryService({ store });

    await store.configureAccount({ asset, network, balanceAtomic: '100' });
    await treasury.reserve({
      reservationId,
      asset,
      network,
      amountAtomic: '70',
      reference: { test: 'separate-process-crash-recovery' },
    });

    const account = await store.getAccount({ asset, network });
    if (account.availableAtomic !== '30' || account.reservedAtomic !== '70' || account.settledAtomic !== '0') {
      throw new Error(`unexpected seeded accounting: ${JSON.stringify(account)}`);
    }

    fs.writeFileSync(stateFile, JSON.stringify({ dbName, asset, network, reservationId }, null, 2));
    console.log(JSON.stringify({ ok: true, phase: 'seed', stateFile, account }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
