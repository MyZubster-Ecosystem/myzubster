'use strict';

const mongoose = require('mongoose');
const TreasuryAccount = require('../models/treasuryAccountModel');
const TreasuryReservation = require('../models/treasuryReservationModel');
const { normalizeAccountKey, parseAtomicAmount } = require('./treasuryReservationService');

function toDecimal128Atomic(value, field = 'amountAtomic') {
  const canonical = parseAtomicAmount(value, field).toString();
  if (canonical.length > 34) throw new Error(`${field} exceeds Mongo Decimal128 integer precision`);
  return mongoose.Types.Decimal128.fromString(canonical);
}

function decimalString(value) {
  if (value === null || value === undefined) return null;
  return value.toString();
}

class MongoTreasuryStore {
  constructor({ mongooseInstance = mongoose, AccountModel = TreasuryAccount, ReservationModel = TreasuryReservation } = {}) {
    if (!mongooseInstance || typeof mongooseInstance.startSession !== 'function') throw new Error('mongoose transaction provider is required');
    this.mongoose = mongooseInstance;
    this.AccountModel = AccountModel;
    this.ReservationModel = ReservationModel;
  }

  accountKey({ asset, network }) {
    return normalizeAccountKey({ asset, network });
  }
}

module.exports = { MongoTreasuryStore, decimalString, toDecimal128Atomic };
