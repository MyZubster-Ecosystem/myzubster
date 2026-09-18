const ZorgaxAIBudget = require('../src/models/ZorgaxAIBudget');
const { monthStart, budgetKey, reserveAstraBudget, settleAstraBudget, releaseAstraBudget } = require('../src/services/zorgaxAIUsageService');

jest.mock('../src/models/ZorgaxAIBudget', () => ({
  updateOne: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

describe('Zorgax AI usage ledger and atomic budget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ZORGAX_ASTRA_MODEL = 'gpt-5.6-sol';
  });

  test('uses UTC month boundary for monthly budget', () => {
    expect(monthStart(new Date('2026-09-18T12:00:00Z')).toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });

  test('builds a stable monthly budget key', () => {
    expect(budgetKey(new Date('2026-09-18T12:00:00Z'))).toBe('openai:gpt-5.6-sol:2026-09');
  });

  test('rejects invalid or oversized reservations before touching MongoDB', async () => {
    await expect(reserveAstraBudget({ amountUsd: 0, budgetUsd: 25 })).resolves.toBeNull();
    await expect(reserveAstraBudget({ amountUsd: 26, budgetUsd: 25 })).resolves.toBeNull();
    expect(ZorgaxAIBudget.updateOne).not.toHaveBeenCalled();
  });

  test('atomically reserves only when reserved plus spent stays under cap', async () => {
    ZorgaxAIBudget.updateOne.mockResolvedValue({});
    ZorgaxAIBudget.findOneAndUpdate.mockResolvedValue({ key: 'openai:gpt-5.6-sol:2026-09', reservedUsd: 1, spentUsd: 0 });
    const row = await reserveAstraBudget({ amountUsd: 1, budgetUsd: 25, date: new Date('2026-09-18T12:00:00Z') });
    expect(row).toBeTruthy();
    const [filter, update] = ZorgaxAIBudget.findOneAndUpdate.mock.calls[0];
    expect(filter.key).toBe('openai:gpt-5.6-sol:2026-09');
    expect(filter.$expr).toBeDefined();
    expect(update.$inc.reservedUsd).toBe(1);
  });

  test('settles a reservation into actual spend', async () => {
    ZorgaxAIBudget.findOneAndUpdate.mockResolvedValue({});
    await settleAstraBudget({ reservedUsd: 1, actualUsd: 0.25, date: new Date('2026-09-18T12:00:00Z') });
    const [, update] = ZorgaxAIBudget.findOneAndUpdate.mock.calls[0];
    expect(update.$inc).toEqual({ reservedUsd: -1, spentUsd: 0.25 });
  });

  test('releases reservation on provider failure', async () => {
    ZorgaxAIBudget.findOneAndUpdate.mockResolvedValue({});
    await releaseAstraBudget({ reservedUsd: 1, date: new Date('2026-09-18T12:00:00Z') });
    const [, update] = ZorgaxAIBudget.findOneAndUpdate.mock.calls[0];
    expect(update.$inc.reservedUsd).toBe(-1);
  });
});
