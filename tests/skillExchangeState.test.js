const { isParticipant, confirmStart, confirmCompletion } = require('../src/services/skillExchangeState');

describe('MyZubster Lavori exchange state', () => {
  test('starts only after both participants confirm', () => {
    const exchange = { ownerId: 'owner', participantId: 'peer', status: 'matched', startConfirmedBy: [] };
    expect(confirmStart(exchange, 'owner')).toBe('matched');
    expect(confirmStart(exchange, 'peer')).toBe('active');
    expect(exchange.startConfirmedBy).toEqual(['owner', 'peer']);
  });

  test('duplicate start confirmation is idempotent', () => {
    const exchange = { ownerId: 'owner', participantId: 'peer', status: 'matched', startConfirmedBy: [] };
    confirmStart(exchange, 'owner');
    confirmStart(exchange, 'owner');
    expect(exchange.startConfirmedBy).toEqual(['owner']);
  });

  test('outsiders cannot confirm work', () => {
    const exchange = { ownerId: 'owner', participantId: 'peer', status: 'matched', startConfirmedBy: [] };
    expect(() => confirmStart(exchange, 'other')).toThrow(/Only exchange participants/);
  });

  test('completion requires both active participants', () => {
    const exchange = { ownerId: 'owner', participantId: 'peer', status: 'active', completionConfirmedBy: [] };
    expect(confirmCompletion(exchange, 'peer')).toBe('active');
    expect(confirmCompletion(exchange, 'owner')).toBe('completed');
  });

  test('participant predicate is limited to matched pair', () => {
    const exchange = { ownerId: 'owner', participantId: 'peer' };
    expect(isParticipant(exchange, 'owner')).toBe(true);
    expect(isParticipant(exchange, 'peer')).toBe(true);
    expect(isParticipant(exchange, 'other')).toBe(false);
  });
});
