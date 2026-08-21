'use strict';

const mongoose = require('mongoose');
const TreasuryAccount = require('../models/treasuryAccountModel');
const TreasuryReservation = require('../models/treasuryReservationModel');
const { RESERVATION_STATES, normalizeAccountKey, parseAtomicAmount } = require('./treasuryReservationService');

function toDecimal128Atomic(value, field = 'amountAtomic') {
  const canonical = parseAtomicAmount(value, field).toString();
  if (canonical.length > 34) throw new Error(`${field} exceeds Mongo Decimal128 integer precision`);
  return mongoose.Types.Decimal128.fromString(canonical);
}

function decimalString(value) {
  if (value === null || value === undefined) return null;
  return value.toString();
}

function negativeDecimal(value) {
  return mongoose.Types.Decimal128.fromString(`-${decimalString(value)}`);
}

function reservationSnapshot(row) {
  if (!row) return null;
  return {
    reservationId: row.reservationId,
    accountKey: row.accountKey,
    amountAtomic: decimalString(row.amountAtomic),
    state: row.state,
    reference: row.reference ?? null,
  };
}

function accountSnapshot(row) {
  if (!row) return null;
  return {
    key: row.key,
    asset: row.asset,
    network: row.network,
    availableAtomic: decimalString(row.availableAtomic),
    reservedAtomic: decimalString(row.reservedAtomic),
    settledAtomic: decimalString(row.settledAtomic),
  };
}

class MongoTreasuryStore {
  constructor({ mongooseInstance = mongoose, AccountModel = TreasuryAccount, ReservationModel = TreasuryReservation } = {}) {
    if (!mongooseInstance || typeof mongooseInstance.startSession !== 'function') throw new Error('mongoose transaction provider is required');
    if (!AccountModel || !ReservationModel) throw new Error('Treasury models are required');
    this.mongoose = mongooseInstance;
    this.AccountModel = AccountModel;
    this.ReservationModel = ReservationModel;
  }

  async withTransaction(work) {
    const session = await this.mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => { result = await work(session); }, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  async configureAccount({ asset, network, balanceAtomic }) {
    const key = normalizeAccountKey({ asset, network });
    const balance = toDecimal128Atomic(balanceAtomic, 'balanceAtomic');
    const zero = mongoose.Types.Decimal128.fromString('0');
    const row = await this.AccountModel.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, asset: asset.trim(), network: network.trim(), availableAtomic: balance, reservedAtomic: zero, settledAtomic: zero } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return accountSnapshot(row);
  }

  async reserve({ reservationId, accountKey, amountAtomic, reference = null }) {
    if (!reservationId || typeof reservationId !== 'string') throw new Error('reservationId is required');
    const canonical = parseAtomicAmount(amountAtomic).toString();
    const amount = toDecimal128Atomic(canonical);

    return this.withTransaction(async session => {
      const existing = await this.ReservationModel.findOne({ reservationId }).session(session);
      if (existing) {
        if (existing.accountKey !== accountKey || decimalString(existing.amountAtomic) !== canonical) {
          throw new Error('reservationId replay conflicts with existing reservation');
        }
        return { reservation: reservationSnapshot(existing), replay: true };
      }

      const account = await this.AccountModel.findOneAndUpdate(
        { key: accountKey, availableAtomic: { $gte: amount } },
        { $inc: { availableAtomic: negativeDecimal(amount), reservedAtomic: amount } },
        { new: true, session },
      );
      if (!account) {
        const configured = await this.AccountModel.findOne({ key: accountKey }).session(session);
        if (!configured) throw new Error('treasury account is not configured');
        throw new Error('insufficient treasury balance');
      }

      const rows = await this.ReservationModel.create([{
        reservationId,
        accountKey,
        amountAtomic: amount,
        state: RESERVATION_STATES.RESERVED,
        reference,
      }], { session });
      return { reservation: reservationSnapshot(rows[0]), replay: false };
    });
  }

  async transition({ reservationId, targetState }) {
    return this.withTransaction(async session => {
      const current = await this.ReservationModel.findOne({ reservationId }).session(session);
      if (!current) throw new Error('reservation not found');
      if (current.state === targetState) return { reservation: reservationSnapshot(current), replay: true };
      if (current.state === RESERVATION_STATES.SETTLED) throw new Error('settled reservation cannot be released');
      if (current.state === RESERVATION_STATES.RELEASED) throw new Error('released reservation cannot be settled');

      const changed = await this.ReservationModel.findOneAndUpdate(
        { _id: current._id, state: RESERVATION_STATES.RESERVED },
        { $set: { state: targetState, updatedAt: new Date() } },
        { new: true, session },
      );
      if (!changed) throw new Error('reservation transition conflict');

      const amount = changed.amountAtomic;
      const increments = targetState === RESERVATION_STATES.SETTLED
        ? { reservedAtomic: negativeDecimal(amount), settledAtomic: amount }
        : { reservedAtomic: negativeDecimal(amount), availableAtomic: amount };
      const account = await this.AccountModel.findOneAndUpdate(
        { key: changed.accountKey, reservedAtomic: { $gte: amount } },
        { $inc: increments },
        { new: true, session },
      );
      if (!account) throw new Error('treasury accounting invariant failed');
      return { reservation: reservationSnapshot(changed), replay: false };
    });
  }

  settle({ reservationId }) {
    return this.transition({ reservationId, targetState: RESERVATION_STATES.SETTLED });
  }

  release({ reservationId }) {
    return this.transition({ reservationId, targetState: RESERVATION_STATES.RELEASED });
  }

  async getAccount({ asset, network }) {
    return accountSnapshot(await this.AccountModel.findOne({ key: normalizeAccountKey({ asset, network }) }));
  }

  async getReservation(reservationId) {
    return reservationSnapshot(await this.ReservationModel.findOne({ reservationId }));
  }
}

module.exports = { MongoTreasuryStore, accountSnapshot, decimalString, reservationSnapshot, toDecimal128Atomic };
