'use strict';

const mongoose = require('mongoose');
const TreasuryAccount = require('../src/models/treasuryAccountModel');
const TreasuryReservation = require('../src/models/treasuryReservationModel');
const { MongoTreasuryStore } = require('../src/services/mongoTreasuryStore');
const { createMongoTreasuryService } = require('../src/services/mongoTreasuryService');

async function main() {
  const uri = process.env.P0_TREASURY_MONGODB_URI;
  if (!uri) throw new Error('P0_TREASURY_MONGODB_URI is required');

  const dbName = process.env.P0_TREASURY_TEST_DB || 'myzubster_p0_treasury_test';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const asset = `TEST-${suffix}`;
  const network = 'integration';
  const reservationIds = [`a-${suffix}`, `b-${suffix}`];

  await mongoose.connect(uri, { dbName });
  let store = new MongoTreasuryStore();
  let treasury = createMongoTreasuryService({ store });

  try {
    await store.configureAccount({ asset, network, balanceAtomic: '100' });

    const attempts = await Promise.allSettled(reservationIds.map(reservationId => treasury.reserve({
      reservationId,
      asset,
      network,
      amountAtomic: '70',
      reference: { test: 'concurrent-reservation' },
    })));

    const successes = attempts.filter(result => result.status === 'fulfilled');
    const failures = attempts.filter(result => result.status === 'rejected');
    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(`expected one successful and one rejected concurrent reservation; got ${successes.length}/${failures.length}`);
    }

    const beforeRestart = await store.getAccount({ asset, network });
    if (beforeRestart.availableAtomic !== '30' || beforeRestart.reservedAtomic !== '70') {
      throw new Error(`unexpected pre-restart accounting: ${JSON.stringify(beforeRestart)}`);
    }

    await mongoose.disconnect();
    await mongoose.connect(uri, { dbName });
    store = new MongoTreasuryStore();
    treasury = createMongoTreasuryService({ store });

    const afterRestart = await store.getAccount({ asset, network });
    if (afterRestart.availableAtomic !== '30' || afterRestart.reservedAtomic !== '70') {
      throw new Error(`persistent state was not preserved across reconnect: ${JSON.stringify(afterRestart)}`);
    }

    const winningReservationId = successes[0].value.reservation.reservationId;
    await treasury.reconcile({ reservationId: winningReservationId, externalState: 'confirmed' });
    const settled = await store.getAccount({ asset, network });
    if (settled.availableAtomic !== '30' || settled.reservedAtomic !== '0' || settled.settledAtomic !== '70') {
      throw new Error(`unexpected settled accounting: ${JSON.stringify(settled)}`);
    }

    const replay = await treasury.reconcile({ reservationId: winningReservationId, externalState: 'confirmed' });
    if (replay.replay !== true) throw new Error('settlement replay was not idempotent');

    console.log(JSON.stringify({ ok: true, dbName, beforeRestart, afterRestart, settled }, null, 2));
  } finally {
    if (mongoose.connection.readyState === 1) {
      await TreasuryReservation.deleteMany({ reservationId: { $in: reservationIds } });
      await TreasuryAccount.deleteMany({ asset, network });
      await mongoose.disconnect();
    }
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
