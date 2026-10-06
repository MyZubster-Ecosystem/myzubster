const {
  detectBuildType,
  createBuildPlan,
  sourceComponents,
  isBuildIntent
} = require('../src/services/zorgaxBuildPlanner');

describe('Zorgax build planner', () => {
  test('detects robot and scooter intents', () => {
    expect(detectBuildType('costruire un robot mobile')).toBe('robot');
    expect(detectBuildType('voglio un monopattino elettrico')).toBe('electric_scooter');
  });

  test('creates an electric scooter BOM with safety checks', () => {
    const plan = createBuildPlan('Costruire un monopattino elettrico 48V');
    expect(plan.type).toBe('electric_scooter');
    expect(plan.components.some(item => item.id === 'battery')).toBe(true);
    expect(plan.components.some(item => item.id === 'brakes')).toBe(true);
    expect(plan.checks).toContain('compatibilità tensione');
    expect(plan.safety_boundary).toMatch(/non effettua acquisti/i);
  });

  test('creates a robot BOM', () => {
    const plan = createBuildPlan('Progettare un robot rover con sensori');
    expect(plan.type).toBe('robot');
    expect(plan.components.some(item => item.id === 'controller')).toBe(true);
    expect(plan.components.some(item => item.id === 'motor-driver')).toBe(true);
  });

  test('recognizes build/sourcing chat intents', () => {
    expect(isBuildIntent('Dove compro su Amazon i pezzi per costruire un robot?')).toBe(true);
    expect(isBuildIntent('Come stai?')).toBe(false);
  });

  test('returns marketplace fallbacks without provider credentials', async () => {
    const oldBrave = process.env.BRAVE_SEARCH_API_KEY;
    const oldTavily = process.env.TAVILY_API_KEY;
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.TAVILY_API_KEY;
    try {
      const plan = createBuildPlan('Costruire un robot mobile');
      const sourcing = await sourceComponents(plan, { live: true, limit: 3 });
      expect(sourcing.purchase_performed).toBe(false);
      expect(sourcing.providers.brave_configured).toBe(false);
      const firstUrls = sourcing.components[0].results.map(item => item.url);
      expect(firstUrls.some(url => url.includes('amazon.it'))).toBe(true);
      expect(firstUrls.some(url => url.includes('google.com/search'))).toBe(true);
    } finally {
      if (oldBrave) process.env.BRAVE_SEARCH_API_KEY = oldBrave;
      if (oldTavily) process.env.TAVILY_API_KEY = oldTavily;
    }
  });
});
