const {
  InMemoryTreasuryStore,
  createTreasuryReservationService,
} = require('../src/services/treasuryReservationService');

function setup(balanceAtomic = '100') {
  const store = new InMemoryTreasuryStore();
  store.configureAccount({ asset: 'MYZ', network: 'Tari', balanceAtomic });
  const treasury = createTreasuryReservationService({ store });
  return { store, treasury };
}

describe('treasury reservation service', () => {
  test('reserves funds before settlement and rejects overspend', () => {
    const { store, treasury } = setup('100');

    const first = treasury.reserve({
      reservationId: 'bounty-1',
      asset: 'MYZ',
      network: 'Tari',
      amountAtomic: '70',
      reference: 'issue:1',
    });

    expect(first.replay).toBe(false);
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '30',
      reservedAtomic: '70',
      settledAtomic: '0',
    }));

    expect(() => treasury.reserve({
      reservationId: 'bounty-2',
      asset: 'MYZ',
      network: 'Tari',
      amountAtomic: '31',
    })).toThrow('insufficient treasury balance');
  });

  test('reservation replay is idempotent and does not reserve twice', () => {
    const { store, treasury } = setup('100');
    const request = {
      reservationId: 'same-id',
      asset: 'MYZ',
      network: 'Tari',
      amountAtomic: '40',
    };

    expect(treasury.reserve(request).replay).toBe(false);
    expect(treasury.reserve(request).replay).toBe(true);
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '60',
      reservedAtomic: '40',
    }));
  });

  test('conflicting reservation replay is rejected', () => {
    const { treasury } = setup('100');
    treasury.reserve({ reservationId: 'same-id', asset: 'MYZ', network: 'Tari', amountAtomic: '40' });

    expect(() => treasury.reserve({
      reservationId: 'same-id',
      asset: 'MYZ',
      network: 'Tari',
      amountAtomic: '41',
    })).toThrow('reservationId replay conflicts');
  });

  test('settlement moves reserved funds to settled exactly once', () => {
    const { store, treasury } = setup('100');
    treasury.reserve({ reservationId: 'settle-1', asset: 'MYZ', network: 'Tari', amountAtomic: '25' });

    expect(treasury.settle({ reservationId: 'settle-1' }).replay).toBe(false);
    expect(treasury.settle({ reservationId: 'settle-1' }).replay).toBe(true);
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '75',
      reservedAtomic: '0',
      settledAtomic: '25',
    }));
  });

  test('failed or cancelled settlement releases funds and reconciliation is repeat-safe', () => {
    const { store, treasury } = setup('100');
    treasury.reserve({ reservationId: 'release-1', asset: 'MYZ', network: 'Tari', amountAtomic: '25' });

    expect(treasury.reconcile({ reservationId: 'release-1', externalState: 'failed' }).replay).toBe(false);
    expect(treasury.reconcile({ reservationId: 'release-1', externalState: 'failed' }).replay).toBe(true);
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '100',
      reservedAtomic: '0',
      settledAtomic: '0',
    }));
  });

  test('pending reconciliation keeps the reservation unchanged', () => {
    const { store, treasury } = setup('100');
    treasury.reserve({ reservationId: 'pending-1', asset: 'MYZ', network: 'Tari', amountAtomic: '10' });

    const result = treasury.reconcile({ reservationId: 'pending-1', externalState: 'pending' });

    expect(result.unchanged).toBe(true);
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '90',
      reservedAtomic: '10',
    }));
  });

  test('two concurrent allocations cannot both overspend the same balance', async () => {
    const { store, treasury } = setup('100');

    const attempts = await Promise.allSettled([
      Promise.resolve().then(() => treasury.reserve({
        reservationId: 'concurrent-a', asset: 'MYZ', network: 'Tari', amountAtomic: '70',
      })),
      Promise.resolve().then(() => treasury.reserve({
        reservationId: 'concurrent-b', asset: 'MYZ', network: 'Tari', amountAtomic: '70',
      })),
    ]);

    expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '30',
      reservedAtomic: '70',
      settledAtomic: '0',
    }));
  });

  test('final states cannot be reversed into contradictory accounting', () => {
    const { treasury } = setup('100');
    treasury.reserve({ reservationId: 'final-1', asset: 'MYZ', network: 'Tari', amountAtomic: '20' });
    treasury.settle({ reservationId: 'final-1' });

    expect(() => treasury.release({ reservationId: 'final-1' })).toThrow('settled reservation cannot be released');
  });

  test('rejects non-canonical atomic amounts', () => {
    const { treasury } = setup('100');

    expect(() => treasury.reserve({ reservationId: 'bad-1', asset: 'MYZ', network: 'Tari', amountAtomic: '1.5' }))
      .toThrow('amountAtomic must be a positive integer string');
  });
});
