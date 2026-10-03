const fs = require('fs');
const path = require('path');

describe('Nicola Comics Zorgax route contract', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/routes/zorgaxAssistantRoutes.js'), 'utf8');

  test('requires the explicit nicolaComics request object', () => {
    expect(source).toContain('const nicola = req.body?.nicolaComics');
    expect(source).toContain("integration: 'nicola-comics'");
    expect(source).toContain('askNicolaComics({');
  });

  test('keeps unrelated requests on the generic assistant path', () => {
    expect(source.indexOf('if (nicola && typeof nicola')).toBeLessThan(source.indexOf('const result = await answer({'));
  });
});
