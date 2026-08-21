const mongoose = require('mongoose');
const { MongoTreasuryStore, toDecimal128Atomic } = require('../src/services/mongoTreasuryStore');
const { createMongoTreasuryService } = require('../src/services/mongoTreasuryService');

describe('Mongo Treasury store boundaries', () => {
  test('encodes canonical atomic amounts exactly as Decimal128 integers', () => {
    expect(toDecimal128Atomic('123456789012345678901234').toString()).toBe('123456789012345678901234');
    expect(() => toDecimal128Atomic('1.5')).toThrow('amountAtomic must be a positive integer string');
    expect(() => toDecimal128Atomic('1'.repeat(35))).toThrow('exceeds Mongo Decimal128 integer precision');
  });

  test('reserve performs a conditional account decrement inside a transaction', async () => {
    const session = {
      withTransaction: jest.fn(async work => work()),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    const mongooseInstance = { startSession: jest.fn().mockResolvedValue(session) };
    const AccountModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue({
        key: 'MYZ:Tari', asset: 'MYZ', network: 'Tari',
        availableAtomic: mongoose.Types.Decimal128.fromString('30'),
        reservedAtomic: mongoose.Types.Decimal128.fromString('70'),
        settledAtomic: mongoose.Types.Decimal128.fromString('0'),
      }),
      findOne: jest.fn(),
    };
    const ReservationModel = {
      findOne: jest.fn().mockReturnValue({ session: jest.fn().mockResolvedValue(null) }),
      create: jest.fn().mockResolvedValue([{
        reservationId: 'r-1', accountKey: 'MYZ:Tari',
        amountAtomic: mongoose.Types.Decimal128.fromString('70'), state: 'RESERVED', reference: 'issue:1',
      }]),
      findOneAndUpdate: jest.fn(),
    };

    const store = new MongoTreasuryStore({ mongooseInstance, AccountModel, ReservationModel });
    const result = await store.reserve({ reservationId: 'r-1', accountKey: 'MYZ:Tari', amountAtomic: '70', reference: 'issue:1' });

    expect(result.replay).toBe(false);
    expect(result.reservation.amountAtomic).toBe('70');
    const [filter, update, options] = AccountModel.findOneAndUpdate.mock.calls[0];
    expect(filter.key).toBe('MYZ:Tari');
    expect(filter.availableAtomic.$gte.toString()).toBe('70');
    expect(update.$inc.availableAtomic.toString()).toBe('-70');
    expect(update.$inc.reservedAtomic.toString()).toBe('70');
    expect(options.session).toBe(session);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  test('same reservation is replay-safe without a second account mutation', async () => {
    const session = { withTransaction: jest.fn(async work => work()), endSession: jest.fn() };
    const existing = {
      reservationId: 'r-1', accountKey: 'MYZ:Tari',
      amountAtomic: mongoose.Types.Decimal128.fromString('20'), state: 'RESERVED', reference: null,
    };
    const AccountModel = { findOneAndUpdate: jest.fn(), findOne: jest.fn() };
    const ReservationModel = {
      findOne: jest.fn().mockReturnValue({ session: jest.fn().mockResolvedValue(existing) }),
      create: jest.fn(), findOneAndUpdate: jest.fn(),
    };
    const store = new MongoTreasuryStore({ mongooseInstance: { startSession: jest.fn().mockResolvedValue(session) }, AccountModel, ReservationModel });

    const result = await store.reserve({ reservationId: 'r-1', accountKey: 'MYZ:Tari', amountAtomic: '20' });

    expect(result.replay).toBe(true);
    expect(AccountModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(ReservationModel.create).not.toHaveBeenCalled();
  });

  test('async service keeps pending reconciliation unchanged', async () => {
    const store = {
      reserve: jest.fn(), settle: jest.fn(), release: jest.fn(),
      getReservation: jest.fn().mockResolvedValue({ reservationId: 'r-1', state: 'RESERVED' }),
    };
    const treasury = createMongoTreasuryService({ store });
    const result = await treasury.reconcile({ reservationId: 'r-1', externalState: 'pending' });
    expect(result).toEqual({ reservation: { reservationId: 'r-1', state: 'RESERVED' }, replay: true, unchanged: true });
  });
});
