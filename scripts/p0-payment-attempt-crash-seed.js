'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const { MongoTreasuryStore } = require('../src/services/mongoTreasuryStore');
const { createMongoTreasuryService } = require('../src/services/mongoTreasuryService');
const { MongoPaymentAttemptStore } = require('../src/services/mongoPaymentAttemptStore');

async function main() {
  const uri = process.env.P0_TREASURY_MONGODB_URI;
  if (!uri) throw new Error('P0_TREASURY_MONGODB_URI is required');
  const dbName = process.env.P0_TREASURY_TEST_DB || 'myzubster_p0_treasury_test';
  const caseFile = process.env.P0_PAYMENT_ATTEMPT_CASE_FILE || '/tmp/myzubster-p0-payment-attempt.json';
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const asset = `PAYTEST-${suffix}`;
  const network = 'integration';
  const reservationId = `reservation-${suffix}`;
  const attemptId = `attempt-${suffix}`;
  const idempotencyKey = `payment-${suffix}`;

  await mongoose.connect(uri, { dbName });
  try {
    const treasuryStore = new MongoTreasuryStore();
    const treasury = createMongoTreasuryService({ store: treasuryStore });
    const attempts = new MongoPaymentAttemptStore();

    await treasuryStore.configureAccount({ asset, network, balanceAtomic: '100' });
    await treasury.reserve({ reservationId, asset, network, amountAtomic: '70', reference: { test: 'payment-attempt-crash-seed' } });

    const request = {
      recipient: `recipient-${suffix}`,
      asset,
      network,
      amount: 70,
      issueNumber: 9001,
      prNumber: 9002,
    };
    await attempts.prepare({ attemptId, reservationId, idempotencyKey, request });
    const submitting = await attempts.markSubmitting({ attemptId });
    if (submitting.attempt.state !== 'SUBMITTING' || submitting.attempt.txId !== null) {
      throw new Error(`unexpected durable pre-crash state: ${JSON.stringify(submitting.attempt)}`);
    }

    const account = await treasuryStore.getAccount({ asset, network });
    if (account.availableAtomic !== '30' || account.reservedAtomic !== '70') {
      throw new Error(`unexpected reserved accounting before crash: ${JSON.stringify(account)}`);
    }

    fs.writeFileSync(caseFile, JSON.stringify({
      dbName, asset, network, reservationId, attemptId, idempotencyKey,
      recipient: request.recipient, rewardAmount: request.amount,
    }));
    console.log(JSON.stringify({ ok: true, phase: 'seeded-submitting', caseFile, attempt: submitting.attempt, account }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
