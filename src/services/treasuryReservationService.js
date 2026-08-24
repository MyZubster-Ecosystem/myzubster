'use strict';

const RESERVATION_STATES = Object.freeze({
  RESERVED: 'RESERVED',
  SETTLED: 'SETTLED',
  RELEASED: 'RELEASED',
});

function parseAtomicAmount(value, field = 'amountAtomic') {
  const text = String(value ?? '');
  if (!/^[1-9]\d*$/.test(text)) throw new Error(`${field} must be a positive integer string`);
  return BigInt(text);
}

function normalizeAccountKey({ asset, network }) {
  if (!asset || typeof asset !== 'string') throw new Error('treasury asset is required');
  if (!network || typeof network !== 'string') throw new Error('treasury network is required');
  return `${asset.trim()}:${network.trim()}`;
}

class InMemoryTreasuryStore {
  constructor() {
    this.accounts = new Map();
    this.reservations = new Map();
  }

  configureAccount({ asset, network, balanceAtomic }) {
    const key = normalizeAccountKey({ asset, network });
    const balance = parseAtomicAmount(balanceAtomic, 'balanceAtomic');
    this.accounts.set(key, {
      key,
      asset: asset.trim(),
      network: network.trim(),
      availableAtomic: balance,
      reservedAtomic: 0n,
      settledAtomic: 0n,
    });
    return this.snapshotAccount(key);
  }

  snapshotAccount(key) {
    const account = this.accounts.get(key);
    if (!account) return null;
    return {
      key: account.key,
      asset: account.asset,
      network: account.network,
      availableAtomic: account.availableAtomic.toString(),
      reservedAtomic: account.reservedAtomic.toString(),
      settledAtomic: account.settledAtomic.toString(),
    };
  }

  snapshotReservation(reservation) {
    if (!reservation) return null;
    return {
      reservationId: reservation.reservationId,
      accountKey: reservation.accountKey,
      amountAtomic: reservation.amountAtomic.toString(),
      state: reservation.state,
      reference: reservation.reference || null,
    };
  }

  reserve({ reservationId, accountKey, amountAtomic, reference = null }) {
    if (!reservationId || typeof reservationId !== 'string') throw new Error('reservationId is required');
    const amount = parseAtomicAmount(amountAtomic);
    const existing = this.reservations.get(reservationId);

    if (existing) {
      if (existing.accountKey !== accountKey || existing.amountAtomic !== amount) {
        throw new Error('reservationId replay conflicts with existing reservation');
      }
      return { reservation: this.snapshotReservation(existing), replay: true };
    }

    const account = this.accounts.get(accountKey);
    if (!account) throw new Error('treasury account is not configured');
    if (account.availableAtomic < amount) throw new Error('insufficient treasury balance');

    account.availableAtomic -= amount;
    account.reservedAtomic += amount;

    const reservation = {
      reservationId,
      accountKey,
      amountAtomic: amount,
      state: RESERVATION_STATES.RESERVED,
      reference,
    };
    this.reservations.set(reservationId, reservation);

    return { reservation: this.snapshotReservation(reservation), replay: false };
  }

  settle({ reservationId }) {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error('reservation not found');
    if (reservation.state === RESERVATION_STATES.SETTLED) {
      return { reservation: this.snapshotReservation(reservation), replay: true };
    }
    if (reservation.state === RESERVATION_STATES.RELEASED) {
      throw new Error('released reservation cannot be settled');
    }

    const account = this.accounts.get(reservation.accountKey);
    account.reservedAtomic -= reservation.amountAtomic;
    account.settledAtomic += reservation.amountAtomic;
    reservation.state = RESERVATION_STATES.SETTLED;

    return { reservation: this.snapshotReservation(reservation), replay: false };
  }

  release({ reservationId }) {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error('reservation not found');
    if (reservation.state === RESERVATION_STATES.RELEASED) {
      return { reservation: this.snapshotReservation(reservation), replay: true };
    }
    if (reservation.state === RESERVATION_STATES.SETTLED) {
      throw new Error('settled reservation cannot be released');
    }

    const account = this.accounts.get(reservation.accountKey);
    account.reservedAtomic -= reservation.amountAtomic;
    account.availableAtomic += reservation.amountAtomic;
    reservation.state = RESERVATION_STATES.RELEASED;

    return { reservation: this.snapshotReservation(reservation), replay: false };
  }

  getAccount({ asset, network }) {
    return this.snapshotAccount(normalizeAccountKey({ asset, network }));
  }

  getReservation(reservationId) {
    return this.snapshotReservation(this.reservations.get(reservationId));
  }
}

function createTreasuryReservationService({ store }) {
  if (!store || typeof store.reserve !== 'function' || typeof store.settle !== 'function' || typeof store.release !== 'function') {
    throw new Error('treasury store is invalid');
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

    reconcile({ reservationId, externalState }) {
      if (externalState === 'confirmed') return store.settle({ reservationId });
      if (externalState === 'failed' || externalState === 'cancelled') return store.release({ reservationId });
      if (externalState === 'pending' || externalState === 'unknown') {
        const reservation = store.getReservation(reservationId);
        if (!reservation) throw new Error('reservation not found');
        return { reservation, replay: true, unchanged: true };
      }
      throw new Error('unsupported external settlement state');
    },
  };
}

module.exports = {
  InMemoryTreasuryStore,
  RESERVATION_STATES,
  createTreasuryReservationService,
  normalizeAccountKey,
  parseAtomicAmount,
};
