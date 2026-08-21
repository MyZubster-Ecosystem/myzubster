'use strict';

const { normalizeAccountKey } = require('./treasuryReservationService');

function createMongoTreasuryService({ store }) {
  if (!store || typeof store.reserve !== 'function' || typeof store.settle !== 'function' || typeof store.release !== 'function' || typeof store.getReservation !== 'function') {
    throw new Error('Mongo Treasury store is invalid');
  }

  return {
    reserve({ reservationId, asset, network, amountAtomic, reference = null }) {
      const accountKey = normalizeAccountKey({ asset, network });
      return store.reserve({ reservationId, accountKey, amountAtomic, reference });
    },

    settle({ reservationId }) {
      return store.settle({ reservationId });
    },

    release({ reservationId }) {
      return store.release({ reservationId });
    },

    async reconcile({ reservationId, externalState }) {
      if (externalState === 'confirmed') return store.settle({ reservationId });
      if (externalState === 'failed' || externalState === 'cancelled') return store.release({ reservationId });
      if (externalState === 'pending' || externalState === 'unknown') {
        const reservation = await store.getReservation(reservationId);
        if (!reservation) throw new Error('reservation not found');
        return { reservation, replay: true, unchanged: true };
      }
      throw new Error('unsupported external settlement state');
    },
  };
}

module.exports = { createMongoTreasuryService };
