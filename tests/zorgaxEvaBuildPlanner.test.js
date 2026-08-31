const { isEvaBuildIntent, createEvaBuildPlan } = require('../src/services/zorgaxEvaBuildPlanner');

describe('Zorgax EVA IONI build planner', () => {
  test('detects EVA IONI build requests', () => {
    expect(isEvaBuildIntent('Costruisci EVA IONI come robot ambientale per orti e irrigazione')).toBe(true);
    expect(isEvaBuildIntent('Costruisci un robot generico')).toBe(false);
  });

  test('creates an EVA-specific evidence-first plan', () => {
    const plan = createEvaBuildPlan('Costruisci EVA IONI per telemetria e irrigazione');
    expect(plan.type).toBe('eva_ioni_robot');
    expect(plan.generated_by).toBe('zorgax-eva-build-planner-v1');
    expect(plan.components.map(item => item.id)).toEqual(expect.arrayContaining([
      'controller',
      'environment-sensors',
      'soil-sensor',
      'irrigation-interface',
      'emergency-stop'
    ]));
    expect(plan.safety_boundary).toMatch(/Non acquista componenti/);
    expect(plan.checks).toContain('E-stop indipendente dal software');
  });
});
