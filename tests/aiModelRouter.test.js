const { classifyTask, selectModel, estimateAstraCost } = require('../src/services/aiModelRouter');

describe('Zorgax AI model router', () => {
  const oldEnv = process.env;

  beforeEach(() => {
    process.env = { ...oldEnv };
    delete process.env.ZORGAX_ASTRA_ENABLED;
    delete process.env.ZORGAX_ASTRA_KILL_SWITCH;
    delete process.env.ZORGAX_ASTRA_MONTHLY_BUDGET_USD;
    delete process.env.OPENAI_API_KEY;
  });

  afterAll(() => { process.env = oldEnv; });

  test('keeps ordinary chat on the local model', () => {
    expect(selectModel({ message: 'Ciao Zorgax' }).provider).toBe('ollama');
  });

  test('routes complex research to OpenAI by default when the key is configured and budget is available', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const route = selectModel({ message: 'Analizza ricerca LIFE con KPI e MRV', useResearch: true, astraSpentUsd: 2 });
    expect(route.provider).toBe('openai');
    expect(route.model).toBe('gpt-5.6-sol');
  });

  test('falls back when monthly budget is exhausted', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.ZORGAX_ASTRA_ENABLED = 'true';
    process.env.ZORGAX_ASTRA_MONTHLY_BUDGET_USD = '25';
    expect(selectModel({ message: 'ricerca LIFE KPI MRV', useResearch: true, astraSpentUsd: 25 }).provider).toBe('ollama');
  });

  test('keeps OpenAI disabled when the kill switch is enabled', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.ZORGAX_ASTRA_KILL_SWITCH = 'true';
    const route = selectModel({ message: 'Analizza ricerca LIFE con KPI e MRV', useResearch: true, astraSpentUsd: 0 });
    expect(route.provider).toBe('ollama');
    expect(route.fallbackReason).toBe('astra_kill_switch');
  });

  test('reports missing OpenAI key distinctly', () => {
    const route = selectModel({ message: 'Analizza ricerca LIFE con KPI e MRV', useResearch: true, astraSpentUsd: 0 });
    expect(route.provider).toBe('ollama');
    expect(route.fallbackReason).toBe('openai_key_missing');
  });

  test('estimates OpenAI token cost by model', () => {
    expect(estimateAstraCost({ inputTokens: 5000, outputTokens: 1000, model: 'gpt-5.6-sol' })).toBeCloseTo(0.04);
    expect(estimateAstraCost({ inputTokens: 5000, outputTokens: 1000, model: 'gpt-5.6-terra' })).toBeCloseTo(0.022);
    expect(estimateAstraCost({ inputTokens: 5000, outputTokens: 1000, model: 'gpt-5.6-luna' })).toBeCloseTo(0.0022);
  });
});
