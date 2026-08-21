'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const PaymentAttempt = require('../src/models/paymentAttemptModel');
const TreasuryAccount = require('../src/models/treasuryAccountModel');
const TreasuryReservation = require('../src/models/treasuryReservationModel');
const { MongoTreasuryStore } = require('../src/services/mongoTreasuryStore');
const { createMongoTreasuryService } = require('../src/services/mongoTreasuryService');
const { MongoPaymentAttemptStore } = require('../src/services/mongoPaymentAttemptStore');
const { createDurablePaymentFlow } = require('../src/services/durablePaymentFlow');

async function main() {
  const uri = process.env.P0_TREASURY_MONGODB_URI;
  if (!uri) throw new Error('P0_TREASURY_MONGODB_URI is required');
  const caseFile = process.env.P0_PAYMENT_ATTEMPT_CASE_FILE || '/tmp/myzubster-p0-payment-attempt.json';
  if (!fs.existsSync(caseFile)) throw new Error(`payment attempt case file not found: ${caseFile}`);
  const testCase = JSON.parse(fs.readFileSync(caseFile, 'utf8'));
  const dbName = process.env.P0_TREASURY_TEST_DB || testCase.dbName || 'myzubster_p0_treasury_test';

  await mongoose.connect(uri, { dbName });
  try {
    const treasuryStore = new MongoTreasuryStore();
    const treasury = createMongoTreasuryService({ store: treasuryStore });
    const attempts = new MongoPaymentAttemptStore();
    const flow = createDurablePaymentFlow({ treasury, attempts });

    const before = await attempts.get(testCase.attemptId);
    if (!before || before.state !== 'SUBMITTING' || before.txId !== null) {
      throw new Error(`expected ambiguous SUBMITTING attempt after process restart: ${JSON.stringify(before)}`);
    }

    let submitCalls = 0;
    let recoveryCalls = 0;
    const recoveredTxId = `recovered-${testCase.idempotencyKey}`;
    const adapter = {
      async submit() {
        submitCalls += 1;
        throw new Error('unsafe duplicate submit was attempted');
      },
      async recoverSubmission(request) {
        recoveryCalls += 1;
        if (request.idempotencyKey !== testCase.idempotencyKey || request.attemptId !== testCase.attemptId) {
          throw new Error('recovery request lost durable idempotency identity');
        }
        return { txId: recoveredTxId };
      },
    };
    const verifier = {
      async verify(request) {
        return {
          valid: true,
          txId: request.txId,
          recipient: request.recipient,
          asset: request.asset,
          network: request.network,
          amount: request.amount,
          transactionStatus: 'confirmed',
          checks: { recipient: true, asset: true, network: true, amount: true, transactionStatus: true },
        };
      },
    };
    const bounty = {
      paymentStatus: 'PENDING',
      paymentRecipient: testCase.recipient,
      paymentAsset: testCase.asset,
      paymentNetwork: testCase.network,
      rewardAmount: testCase.rewardAmount,
      issueNumber: 9001,
      prNumber: 9002,
    };

    const result = await flow.execute({
      bounty,
      adapter,
      verifier,
      reservationId: testCase.reservationId,
      attemptId: testCase.attemptId,
      idempotencyKey: testCase.idempotencyKey,
      amountAtomic: '70',
    });

    if (submitCalls !== 0) throw new Error(`expected zero duplicate submits after restart, got ${submitCalls}`);
    if (recoveryCalls !== 1) throw new Error(`expected one provider recovery lookup, got ${recoveryCalls}`);
    if (result.state !== 'CONFIRMED' || result.attempt.state !== 'CONFIRMED' || result.attempt.txId !== recoveredTxId) {
      throw new Error(`unexpected recovered payment result: ${JSON.stringify(result)}`);
    }

    const account = await treasuryStore.getAccount({ asset: testCase.asset, network: testCase.network });
    if (account.availableAtomic !== '30' || account.reservedAtomic !== '0' || account.settledAtomic !== '70') {
      throw new Error(`unexpected Treasury accounting after recovery: ${JSON.stringify(account)}`);
    }

    console.log(JSON.stringify({ ok: true, phase: 'recovered-after-process-restart', submitCalls, recoveryCalls, attempt: result.attempt, account }, null, 2));
  } finally {
    await PaymentAttempt.deleteMany({ attemptId: testCase.attemptId });
    await TreasuryReservation.deleteMany({ reservationId: testCase.reservationId });
    await TreasuryAccount.deleteMany({ asset: testCase.asset, network: testCase.network });
    await mongoose.disconnect();
    try { fs.unlinkSync(caseFile); } catch (_) { /* cleanup best effort */ }
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
