const { classifyTask, selectModel, estimateAstraCost } = require('../src/services/aiModelRouter');

describe('Zorgax AI model router', () => {
  const oldEnv = process.env;

  beforeEach(() => {
    process.env = { ...oldEnv };
    delete process.env.ZORGAX_ASTRA_ENABLED;
    delete process.env.ZORGAX_ASTRA_MONTHLY_BUDGET_USD;
  });

  afterAll(() => { process.env = oldEnv; });

  test('keeps ordinary chat on the local model', () => {
    expect(selectModel({ message: 'Ciao Zorgax' }).provider).toBe('ollama');
  });

  test('routes complex research to Astra when enabled and under budget', () => {
    process.env.ZORGAX_ASTRA_ENABLED = 'true';
    const route = selectModel({ message: 'Analizza ricerca LIFE con KPI e MRV', useResearch: true, astraSpentUsd: 2 });
    expect(route.provider).toBe('openai');
    expect(route.model).toBe('gpt-6-astra');
  });

  test('falls back when monthly budget is exhausted', () => {
    process.env.ZORGAX_ASTRA_ENABLED = 'true';
    process.env.ZORGAX_ASTRA_MONTHLY_BUDGET_USD = '25';
    expect(selectModel({ message: 'ricerca LIFE KPI MRV', useResearch: true, astraSpentUsd: 25 }).provider).toBe('ollama');
  });

  test('estimates Astra token cost', () => {
    expect(estimateAstraCost({ inputTokens: 5000, outputTokens: 1000 })).toBeCloseTo(0.1);
  });
});
