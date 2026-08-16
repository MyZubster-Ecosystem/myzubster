const Payment = require('../models/Payment');

const PAYMENT_STATES = ['PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'CANCELLED'];

// A payment can only move forward through a strict, explicit state machine.
// Confirmed (paid) is a terminal state and requires a real transaction hash.
const VALID_TRANSITIONS = {
  PENDING: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['CONFIRMED', 'FAILED'],
  CONFIRMED: [],
  FAILED: [],
  CANCELLED: [],
};

// MYZ is currently a project-specific internal accounting unit. It is not yet
// tokenized on-chain. This metadata documents the payment rails explicitly so
// a MYZ payment is never mistaken for a settled blockchain transfer.
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

// A real payment is only CONFIRMED with a genuine transaction hash. Simulated
// payments can never be confirmed - this is the core integrity guarantee.
async function confirmPayment(id, txid) {
  const payment = await Payment.findById(id);
  if (!payment) throw new Error('Payment not found');
  if (payment.kind === 'simulated') {
    throw new Error('Simulated payments cannot be confirmed');
  }
  if (!txid) throw new Error('A transaction ID is required to confirm a real payment');
  if (!isValidTransition(payment.state, 'CONFIRMED')) {
    throw new Error('Cannot confirm from state ' + payment.state);
  }
  payment.state = 'CONFIRMED';
  payment.txid = txid;
  await payment.save();
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
