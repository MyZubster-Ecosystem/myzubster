'use strict';

const { paymentRequest, verificationPassed } = require('./paymentLifecycle');
const { PAYMENT_ATTEMPT_STATES } = require('./mongoPaymentAttemptStore');

const DURABLE_FLOW_STATES = Object.freeze({
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  RECOVERY_REQUIRED: 'RECOVERY_REQUIRED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
});

function requireVerifier(verifier) {
  if (!verifier || typeof verifier.verify !== 'function') throw new Error('payment verifier is not configured');
}

function applyAttemptToBounty(bounty, attempt) {
  if (!bounty || !attempt) return;
  if (attempt.txId) bounty.paymentTxId = attempt.txId;
  if (attempt.state === PAYMENT_ATTEMPT_STATES.SUBMITTED) bounty.paymentStatus = 'SUBMITTED';
  if (attempt.state === PAYMENT_ATTEMPT_STATES.CONFIRMED) {
    bounty.paymentStatus = 'CONFIRMED';
    bounty.status = 'paid';
    bounty.paymentConfirmedAt = new Date();
  }
  if (attempt.state === PAYMENT_ATTEMPT_STATES.FAILED) bounty.paymentStatus = 'FAILED';
  if (attempt.state === PAYMENT_ATTEMPT_STATES.CANCELLED) bounty.paymentStatus = 'CANCELLED';
}

function createDurablePaymentFlow({ treasury, attempts }) {
  if (!treasury || typeof treasury.reserve !== 'function' || typeof treasury.reconcile !== 'function') {
    throw new Error('treasury service is invalid');
  }
  if (!attempts || typeof attempts.prepare !== 'function' || typeof attempts.markSubmitting !== 'function' || typeof attempts.markSubmitted !== 'function') {
    throw new Error('payment attempt store is invalid');
  }

  async function verifyAndSettle({ bounty, verifier, attempt }) {
    requireVerifier(verifier);
    const request = paymentRequest(bounty);
    const verification = await verifier.verify({ ...request, txId: attempt.txId });

    if (!verificationPassed(verification, request, attempt.txId)) {
      const reason = verification?.reason || `independent verification did not confirm transaction (${verification?.transactionStatus || 'unknown'})`;
      await attempts.noteError({ attemptId: attempt.attemptId, error: reason });
      applyAttemptToBounty(bounty, attempt);
      return {
        state: DURABLE_FLOW_STATES.PENDING_VERIFICATION,
        attempt: await attempts.get(attempt.attemptId),
        verification,
        treasury: await treasury.reconcile({ reservationId: attempt.reservationId, externalState: 'pending' }),
      };
    }

    const confirmed = await attempts.markConfirmed({ attemptId: attempt.attemptId });
    applyAttemptToBounty(bounty, confirmed.attempt);
    return {
      state: DURABLE_FLOW_STATES.CONFIRMED,
      attempt: confirmed.attempt,
      verification,
      treasury: await treasury.reconcile({ reservationId: attempt.reservationId, externalState: 'confirmed' }),
      replay: confirmed.replay,
    };
  }

  async function recoverAmbiguousSubmission({ bounty, adapter, verifier, attempt }) {
    if (!adapter || typeof adapter.recoverSubmission !== 'function') {
      await attempts.noteError({
        attemptId: attempt.attemptId,
        error: 'submission outcome is ambiguous; provider recovery is required before retry',
      });
      return {
        state: DURABLE_FLOW_STATES.RECOVERY_REQUIRED,
        attempt: await attempts.get(attempt.attemptId),
        treasury: await treasury.reconcile({ reservationId: attempt.reservationId, externalState: 'pending' }),
      };
    }

    const request = paymentRequest(bounty);
    const recovery = await adapter.recoverSubmission({
      ...request,
      attemptId: attempt.attemptId,
      idempotencyKey: attempt.idempotencyKey,
    });

    if (recovery?.txId) {
      const submitted = await attempts.markSubmitted({ attemptId: attempt.attemptId, txId: recovery.txId });
      applyAttemptToBounty(bounty, submitted.attempt);
      return verifyAndSettle({ bounty, verifier, attempt: submitted.attempt });
    }

    if (recovery?.definitivelyNotSubmitted === true) {
      const failed = await attempts.markTerminal({
        attemptId: attempt.attemptId,
        state: PAYMENT_ATTEMPT_STATES.FAILED,
        error: recovery.reason || 'provider confirmed payment was not submitted',
      });
      applyAttemptToBounty(bounty, failed.attempt);
      return {
        state: DURABLE_FLOW_STATES.FAILED,
        attempt: failed.attempt,
        treasury: await treasury.reconcile({ reservationId: attempt.reservationId, externalState: 'failed' }),
      };
    }

    await attempts.noteError({
      attemptId: attempt.attemptId,
      error: recovery?.reason || 'provider could not resolve ambiguous submission',
    });
    return {
      state: DURABLE_FLOW_STATES.RECOVERY_REQUIRED,
      attempt: await attempts.get(attempt.attemptId),
      treasury: await treasury.reconcile({ reservationId: attempt.reservationId, externalState: 'pending' }),
    };
  }

  return {
    async execute({
      bounty,
      adapter,
      verifier,
      reservationId,
      attemptId = reservationId,
      idempotencyKey = attemptId,
      amountAtomic,
      treasuryAsset,
      treasuryNetwork,
      reference = null,
    }) {
      if (!bounty) throw new Error('bounty is required');
      if (!reservationId) throw new Error('reservationId is required');
      if (!attemptId) throw new Error('attemptId is required');

      const reservation = await treasury.reserve({
        reservationId,
        asset: treasuryAsset || bounty.paymentAsset,
        network: treasuryNetwork || bounty.paymentNetwork,
        amountAtomic,
        reference,
      });
      if (reservation.reservation.state === 'RELEASED') throw new Error('released reservation cannot be reused for payment submission');

      const request = paymentRequest(bounty);
      const prepared = await attempts.prepare({ attemptId, reservationId, idempotencyKey, request });
      let attempt = prepared.attempt;
      applyAttemptToBounty(bounty, attempt);

      if (attempt.state === PAYMENT_ATTEMPT_STATES.CONFIRMED) {
        return {
          state: DURABLE_FLOW_STATES.CONFIRMED,
          attempt,
          treasury: await treasury.reconcile({ reservationId, externalState: 'confirmed' }),
          replay: true,
        };
      }

      if (attempt.state === PAYMENT_ATTEMPT_STATES.FAILED || attempt.state === PAYMENT_ATTEMPT_STATES.CANCELLED) {
        const externalState = attempt.state === PAYMENT_ATTEMPT_STATES.CANCELLED ? 'cancelled' : 'failed';
        return {
          state: attempt.state,
          attempt,
          treasury: await treasury.reconcile({ reservationId, externalState }),
          replay: true,
        };
      }

      if (attempt.state === PAYMENT_ATTEMPT_STATES.SUBMITTED) {
        return verifyAndSettle({ bounty, verifier, attempt });
      }

      if (attempt.state === PAYMENT_ATTEMPT_STATES.SUBMITTING) {
        return recoverAmbiguousSubmission({ bounty, adapter, verifier, attempt });
      }

      try {
        requireVerifier(verifier);
      } catch (error) {
        const failed = await attempts.markTerminal({ attemptId, state: PAYMENT_ATTEMPT_STATES.FAILED, error: error.message });
        applyAttemptToBounty(bounty, failed.attempt);
        return {
          state: DURABLE_FLOW_STATES.FAILED,
          attempt: failed.attempt,
          treasury: await treasury.reconcile({ reservationId, externalState: 'failed' }),
          error: error.message,
        };
      }

      if (!adapter || typeof adapter.submit !== 'function') {
        const failed = await attempts.markTerminal({ attemptId, state: PAYMENT_ATTEMPT_STATES.FAILED, error: 'payment adapter is not configured' });
        applyAttemptToBounty(bounty, failed.attempt);
        return {
          state: DURABLE_FLOW_STATES.FAILED,
          attempt: failed.attempt,
          treasury: await treasury.reconcile({ reservationId, externalState: 'failed' }),
          error: 'payment adapter is not configured',
        };
      }

      const submitting = await attempts.markSubmitting({ attemptId });
      attempt = submitting.attempt;

      let submission;
      try {
        submission = await adapter.submit({ ...request, attemptId, idempotencyKey });
      } catch (error) {
        if (error?.definitelyNotSubmitted === true) {
          const failed = await attempts.markTerminal({ attemptId, state: PAYMENT_ATTEMPT_STATES.FAILED, error: error.message });
          applyAttemptToBounty(bounty, failed.attempt);
          return {
            state: DURABLE_FLOW_STATES.FAILED,
            attempt: failed.attempt,
            treasury: await treasury.reconcile({ reservationId, externalState: 'failed' }),
            error: error.message,
          };
        }

        await attempts.noteError({ attemptId, error: `ambiguous adapter failure: ${error.message}` });
        return {
          state: DURABLE_FLOW_STATES.RECOVERY_REQUIRED,
          attempt: await attempts.get(attemptId),
          treasury: await treasury.reconcile({ reservationId, externalState: 'pending' }),
          error: error.message,
        };
      }

      if (!submission?.txId || submission.simulated) {
        await attempts.noteError({
          attemptId,
          error: submission?.simulated ? 'simulated payment cannot be reconciled as submitted' : 'adapter returned no transaction ID; submission outcome is ambiguous',
        });
        return {
          state: DURABLE_FLOW_STATES.RECOVERY_REQUIRED,
          attempt: await attempts.get(attemptId),
          treasury: await treasury.reconcile({ reservationId, externalState: 'pending' }),
        };
      }

      const submitted = await attempts.markSubmitted({ attemptId, txId: submission.txId });
      applyAttemptToBounty(bounty, submitted.attempt);
      return verifyAndSettle({ bounty, verifier, attempt: submitted.attempt });
    },
  };
}

module.exports = { DURABLE_FLOW_STATES, applyAttemptToBounty, createDurablePaymentFlow };
