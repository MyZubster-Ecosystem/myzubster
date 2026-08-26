const { parseCsv, ensureSynthetic } = require('../src/routes/zorgaxLifeRoutes');

describe('Zorgax LIFE API helpers', () => {
  test('parses simple synthetic CSV records', () => {
    const rows = parseCsv([
      'sourceId,observationTimestamp,variable,rawValue,unit,assetRef,accessClass',
      'synthetic-water-001,2027-01-15T10:00:00Z,nitrate,1200,ug/L,synthetic://pilot/water/001,public'
    ].join('\n'));
    expect(rows).toHaveLength(1);
    expect(rows[0].rawValue).toBe(1200);
    expect(rows[0].sourceId).toBe('synthetic-water-001');
  });

  test('rejects non synthetic phase-1 records', () => {
    expect(() => ensureSynthetic([{
      sourceId: 'partner-water-001',
      assetRef: 'https://partner.example/data/1'
    }])).toThrow('Phase 1 accepts synthetic/demo data only');
  });
});
