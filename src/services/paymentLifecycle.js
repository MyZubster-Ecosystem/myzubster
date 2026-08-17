const PAYMENT_STATES = Object.freeze({
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
});

const ALLOWED_TRANSITIONS = Object.freeze({
  PENDING: ['SUBMITTED', 'FAILED', 'CANCELLED'],
  SUBMITTED: ['CONFIRMED', 'FAILED', 'CANCELLED'],
  CONFIRMED: [],
  FAILED: ['SUBMITTED', 'CANCELLED'],
  CANCELLED: []
});

function transition(current, next) {
  if (current === next) return;
  if (!ALLOWED_TRANSITIONS[current]?.includes(next)) {
    throw new Error(`Invalid payment transition: ${current} -> ${next}`);
  }
}

function paymentRequest(bounty) {
  if (!bounty.paymentRecipient) throw new Error('payment recipient is required');
  return {
    amount: bounty.rewardAmount,
    asset: bounty.paymentAsset || bounty.currency,
    network: bounty.paymentNetwork,
    recipient: bounty.paymentRecipient,
    issueNumber: bounty.issueNumber,
    prNumber: bounty.prNumber
  };
}

function applyState(bounty, next, reason = null) {
  transition(bounty.paymentStatus || PAYMENT_STATES.PENDING, next);
  bounty.paymentStatus = next;
  bounty.paymentFailureReason = reason;
  if (next === PAYMENT_STATES.SUBMITTED) bounty.paymentSubmittedAt = new Date();
  if (next === PAYMENT_STATES.CONFIRMED) bounty.paymentConfirmedAt = new Date();
}

async function processPayment({ bounty, adapter, verifier }) {
  if (bounty.paymentStatus === PAYMENT_STATES.CONFIRMED) {
    return { state: PAYMENT_STATES.CONFIRMED, replay: true };
  }

  if (bounty.paymentStatus === PAYMENT_STATES.SUBMITTED && bounty.paymentTxId) {
    const verification = await verifier.verify({ ...paymentRequest(bounty), txId: bounty.paymentTxId });
    if (verification.valid) {
      applyState(bounty, PAYMENT_STATES.CONFIRMED);
      bounty.status = 'paid';
      return { state: PAYMENT_STATES.CONFIRMED, verification };
    }
    applyState(bounty, PAYMENT_STATES.FAILED, verification.reason || 'verification failed');
    return { state: PAYMENT_STATES.FAILED, verification };
  }

  try {
    const submission = await adapter.submit(paymentRequest(bounty));
    if (!submission?.txId || submission.simulated) {
      throw new Error(submission?.simulated ? 'simulated payment was not submitted' : 'adapter returned no transaction ID');
    }
    bounty.paymentTxId = submission.txId;
    applyState(bounty, PAYMENT_STATES.SUBMITTED);
  } catch (error) {
    applyState(bounty, PAYMENT_STATES.FAILED, error.message);
    return { state: PAYMENT_STATES.FAILED, error: error.message };
  }

  const verification = await verifier.verify({ ...paymentRequest(bounty), txId: bounty.paymentTxId });
  if (!verification.valid) {
    applyState(bounty, PAYMENT_STATES.FAILED, verification.reason || 'verification failed');
    return { state: PAYMENT_STATES.FAILED, verification };
  }
  applyState(bounty, PAYMENT_STATES.CONFIRMED);
  bounty.status = 'paid';
  return { state: PAYMENT_STATES.CONFIRMED, verification };
}

module.exports = { ALLOWED_TRANSITIONS, PAYMENT_STATES, paymentRequest, processPayment, transition };