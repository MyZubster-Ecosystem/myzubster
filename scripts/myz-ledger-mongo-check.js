'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const { createMongoConnector } = require('../src/services/mongoConnection');
const {
  MyzLedgerAccount,
  MyzLedgerEntry,
  MyzLedgerOperation,
  MyzLedgerTransfer
} = require('../src/models/MyzLedgerMongo');

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGODB_URI (or MONGO_URI) is required');

  const connectMongo = createMongoConnector({ mongoose, mongoUri, logger: console });
  await connectMongo();

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  const transactionCapable = Boolean(hello.setName || hello.msg === 'isdbgrid');
  if (!transactionCapable) {
    throw new Error('MongoDB topology does not advertise replica-set or mongos transaction semantics');
  }

  await Promise.all([
    MyzLedgerAccount.init(),
    MyzLedgerEntry.init(),
    MyzLedgerOperation.init(),
    MyzLedgerTransfer.init()
  ]);

  const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  const names = new Set(collections.map(item => item.name));
  const expected = ['myz_ledger_accounts', 'myz_ledger_entries', 'myz_ledger_operations', 'myz_ledger_transfers'];
  const missing = expected.filter(name => !names.has(name));

  console.log(JSON.stringify({
    ok: missing.length === 0,
    topology: hello.setName ? 'replicaSet' : 'mongos',
    setName: hello.setName || null,
    collections: expected,
    missing
  }, null, 2));

  if (missing.length) process.exitCode = 2;
}

main()
  .catch(error => {
    console.error('[myz-ledger-mongo-check]', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await mongoose.disconnect(); } catch (_) {}
  });
