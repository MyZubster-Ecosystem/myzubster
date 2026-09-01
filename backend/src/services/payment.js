const Payment = require('../models/Payment');
const { verifyXmrPayment } = require('./xmrVerifier');
const { paymentWebhooks } = require('./paymentWebhooks');

const PAYMENT_STATES = ['PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'CANCELLED'];

const VALID_TRANSITIONS = {
  PENDING: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['CONFIRMED', 'FAILED'],
  CONFIRMED: [],
  FAILED: [],
  CANCELLED: [],
};

const MYZ_METADATA = {
  network: 'Tari (project-specific internal accounting unit - not tokenized on-chain)',
  contract: null,
  decimals: null,
  transferMechanism: 'Internal platform ledger',
  explorer: null,
  walletFormat: 'Tari public address',
  verification: 'Internal ledger entry - no blockchain TXID available yet',
};

function isValidTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

async function createPayment(fields) {
  return Payment.create({
    issueId: fields.issueId,
    contributor: fields.contributor,
    amount: fields.amount,
    currency: fields.currency,
    kind: fields.kind || 'simulated',
    state: 'PENDING',
    address: fields.address || null,
    txid: null,
  });
}

async function submitPayment(id, txid) {
  const payment = await Payment.findById(id);
  if (!payment) throw new Error('Payment not found');
  if (!isValidTransition(payment.state, 'SUBMITTED')) {
    throw new Error('Cannot submit from state ' + payment.state);
  }
  payment.state = 'SUBMITTED';
  payment.txid = txid || null;
  await payment.save();
  return payment;
}

async function confirmPayment(id, txid, verifier = verifyXmrPayment, webhooks = paymentWebhooks) {
  const payment = await Payment.findById(id);
  if (!payment) throw new Error('Payment not found');
  if (payment.kind === 'simulated') {
    throw new Error('Simulated payments cannot be confirmed');
  }
  if (!txid) throw new Error('A transaction ID is required to confirm a real payment');
  if (!isValidTransition(payment.state, 'CONFIRMED')) {
    throw new Error('Cannot confirm from state ' + payment.state);
  }

  if (payment.currency !== 'XMR') {
    throw new Error('No independent verifier is configured for ' + payment.currency);
  }

  const verification = await verifier({
    txid,
    address: payment.address,
    amount: payment.amount,
    currency: payment.currency,
    issueId: payment.issueId,
  });

  if (!verification || verification.verified !== true) {
    throw new Error('Payment transaction could not be independently verified');
  }

  payment.state = 'CONFIRMED';
  payment.txid = txid;
  payment.metadata = Object.assign({}, payment.metadata || {}, {
    verification: {
      verified: true,
      confirmations: verification.confirmations,
      verifiedAt: new Date().toISOString(),
    },
  });
  await payment.save();
  await webhooks.paymentConfirmed({
    paymentId: String(payment._id || id),
    issueId: payment.issueId,
    contributor: payment.contributor,
    amount: payment.amount,
    currency: payment.currency,
    txid: payment.txid,
    state: payment.state,
  });
  return payment;
}

async function failPayment(id, reason) {
  const payment = await Payment.findById(id);
  if (!payment) throw new Error('Payment not found');
  if (!isValidTransition(payment.state, 'FAILED')) {
    throw new Error('Cannot fail from state ' + payment.state);
  }
  payment.state = 'FAILED';
  payment.metadata = Object.assign({}, payment.metadata || {}, { failureReason: reason || 'unknown' });
  await payment.save();
  return payment;
}

async function cancelPayment(id) {
  const payment = await Payment.findById(id);
  if (!payment) throw new Error('Payment not found');
  if (!isValidTransition(payment.state, 'CANCELLED')) {
    throw new Error('Cannot cancel from state ' + payment.state);
  }
  payment.state = 'CANCELLED';
  await payment.save();
  return payment;
}

async function getPayment(id) {
  return Payment.findById(id);
}

async function listPayments(filter) {
  return Payment.find(filter || {}).sort({ createdAt: -1 }).limit(200);
}

module.exports = {
  PAYMENT_STATES,
  MYZ_METADATA,
  createPayment,
  submitPayment,
  confirmPayment,
  failPayment,
  cancelPayment,
  getPayment,
  listPayments,
};
