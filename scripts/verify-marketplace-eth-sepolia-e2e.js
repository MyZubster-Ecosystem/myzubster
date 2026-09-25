'use strict';

const fs = require('fs');
const crypto = require('crypto');
const { verifyEthereumSepoliaPayment } = require('../src/services/marketplaceChainVerifiers');

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}

function positiveInteger(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error('MIN_CONFIRMATIONS_INVALID');
  return parsed;
}

async function main() {
  const orderId = required('MYZ_E2E_ORDER_ID');
  const txHash = required('MYZ_E2E_TX_HASH');
  const expectedSender = required('MYZ_E2E_EXPECTED_SENDER');
  const expectedRecipient = required('MYZ_E2E_EXPECTED_RECIPIENT');
  const expectedAmountWei = required('MYZ_E2E_EXPECTED_AMOUNT_WEI');
  const minConfirmations = positiveInteger(process.env.MYZ_E2E_MIN_CONFIRMATIONS, 3);

  if (!/^\d+$/.test(expectedAmountWei) || BigInt(expectedAmountWei) <= 0n) {
    throw new Error('MYZ_E2E_EXPECTED_AMOUNT_WEI_INVALID');
  }

  const evidence = await verifyEthereumSepoliaPayment({
    txHash,
    expectedSender,
    expectedAddress:expectedRecipient,
    expectedAmountWei,
    minConfirmations
  });

  const payload = {
    schema:'myzubster.marketplace-eth-sepolia-e2e/v1',
    generatedAt:new Date().toISOString(),
    orderId,
    network:'sepolia',
    chainId:11155111,
    txHash,
    expected:{
      sender:expectedSender,
      recipient:expectedRecipient,
      amountWei:expectedAmountWei,
      minConfirmations
    },
    verification:evidence
  };

  const canonical = JSON.stringify(payload);
  const evidenceHash = crypto.createHash('sha256').update(canonical).digest('hex');
  const document = { ...payload, evidenceHash };

  fs.writeFileSync(
    'marketplace-eth-sepolia-e2e-evidence.json',
    JSON.stringify(document, null, 2)
  );

  console.log(JSON.stringify({
    schema:document.schema,
    orderId,
    txHash,
    verified:Boolean(evidence.verified),
    reason:evidence.reason || null,
    confirmations:Number(evidence.confirmations || 0),
    evidenceHash
  }, null, 2));

  if (!evidence.verified) process.exit(2);
}

main().catch(error => {
  console.error(JSON.stringify({
    schema:'myzubster.marketplace-eth-sepolia-e2e/error-v1',
    error:error?.message || 'UNKNOWN_E2E_ERROR'
  }, null, 2));
  process.exit(1);
});
