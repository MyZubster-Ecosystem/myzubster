'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const TreasuryAccount = require('../src/models/treasuryAccountModel');
const TreasuryReservation = require('../src/models/treasuryReservationModel');
const { MongoTreasuryStore } = require('../src/services/mongoTreasuryStore');
const { createMongoTreasuryService } = require('../src/services/mongoTreasuryService');

async function main() {
  const uri = process.env.P0_TREASURY_MONGODB_URI;
  if (!uri) throw new Error('P0_TREASURY_MONGODB_URI is required');

  const stateFile = process.env.P0_TREASURY_CRASH_STATE || '.p0-treasury-crash-state.json';
  if (!fs.existsSync(stateFile)) throw new Error(`crash recovery state file not found: ${stateFile}`);
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  await mongoose.connect(uri, { dbName: state.dbName });
  try {
    const store = new MongoTreasuryStore();
    const treasury = createMongoTreasuryService({ store });

    const persisted = await store.getAccount({ asset: state.asset, network: state.network });
    if (!persisted || persisted.availableAtomic !== '30' || persisted.reservedAtomic !== '70' || persisted.settledAtomic !== '0') {
      throw new Error(`persistent reserved state was not recovered: ${JSON.stringify(persisted)}`);
    }

    const reservation = await store.getReservation(state.reservationId);
    if (!reservation || reservation.state !== 'RESERVED' || reservation.amountAtomic !== '70') {
      throw new Error(`persistent reservation was not recovered: ${JSON.stringify(reservation)}`);
    }

    const reconciliation = await treasury.reconcile({ reservationId: state.reservationId, externalState: 'confirmed' });
    if (reconciliation.replay === true) throw new Error('first post-restart settlement was unexpectedly treated as replay');

    const settled = await store.getAccount({ asset: state.asset, network: state.network });
    if (settled.availableAtomic !== '30' || settled.reservedAtomic !== '0' || settled.settledAtomic !== '70') {
      throw new Error(`unexpected recovered settlement accounting: ${JSON.stringify(settled)}`);
    }

    const replay = await treasury.reconcile({ reservationId: state.reservationId, externalState: 'confirmed' });
    if (replay.replay !== true) throw new Error('post-restart settlement replay was not idempotent');

    console.log(JSON.stringify({ ok: true, phase: 'recover', persisted, settled }, null, 2));
  } finally {
    if (mongoose.connection.readyState === 1) {
      await TreasuryReservation.deleteMany({ reservationId: state.reservationId });
      await TreasuryAccount.deleteMany({ asset: state.asset, network: state.network });
      await mongoose.disconnect();
    }
    if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
