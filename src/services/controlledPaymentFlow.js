'use strict';

const { PAYMENT_STATES, processPayment } = require('./paymentLifecycle');

function createControlledPaymentFlow({ treasury }) {
  if (!treasury || typeof treasury.reserve !== 'function' || typeof treasury.reconcile !== 'function') {
    throw new Error('treasury service is invalid');
  }

  return {
    async execute({
      bounty,
      adapter,
      verifier,
      reservationId,
      amountAtomic,
      treasuryAsset,
      treasuryNetwork,
      reference = null,
    }) {
      if (!bounty) throw new Error('bounty is required');
      if (!reservationId) throw new Error('reservationId is required');

      const reserveResult = treasury.reserve({
        reservationId,
        asset: treasuryAsset || bounty.paymentAsset,
        network: treasuryNetwork || bounty.paymentNetwork,
        amountAtomic,
        reference,
      });

      if (reserveResult.reservation.state === 'RELEASED') {
        throw new Error('released reservation cannot be reused for payment submission');
      }

      try {
        const paymentResult = await processPayment({ bounty, adapter, verifier });

        if (paymentResult.state === PAYMENT_STATES.CONFIRMED) {
          const reconciliation = treasury.reconcile({
            reservationId,
            externalState: 'confirmed',
          });
          return {
            payment: paymentResult,
            treasury: reconciliation,
          };
        }

        if (paymentResult.state === PAYMENT_STATES.FAILED || paymentResult.state === PAYMENT_STATES.CANCELLED) {
          const reconciliation = treasury.reconcile({
            reservationId,
            externalState: paymentResult.state === PAYMENT_STATES.CANCELLED ? 'cancelled' : 'failed',
          });
          return {
            payment: paymentResult,
            treasury: reconciliation,
          };
        }

        return {
          payment: paymentResult,
          treasury: treasury.reconcile({ reservationId, externalState: 'pending' }),
        };
      } catch (error) {
        treasury.reconcile({ reservationId, externalState: 'failed' });
        throw error;
      }
    },
  };
}

module.exports = { createControlledPaymentFlow };
