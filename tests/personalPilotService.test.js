const { normalizePilot, normalizeDevice } = require('../src/services/personalPilotService');

describe('personal pilot registry', () => {
  test('accepts a private garden without exact coordinates', () => {
    expect(normalizePilot({ type:'garden', title:'Orto balcone', locationLabel:'Rimini' })).toEqual({
      type:'garden', title:'Orto balcone', description:'', locationLabel:'Rimini'
    });
  });
  test('keeps kefir culture/sample identifiers separate', () => {
    expect(normalizePilot({ type:'kefir', title:'Kefir cucina', cultureId:'CULT-1', sampleId:'SAMPLE-1' })).toMatchObject({
      type:'kefir', cultureId:'CULT-1', sampleId:'SAMPLE-1'
    });
  });
  test('normalizes a sensor device and rejects unsupported sensors', () => {
    expect(normalizeDevice({ deviceId:'ESP32-001', label:'Nodo cucina', kind:'esp32', sensors:['temperature','ph','camera'] })).toEqual({
      deviceId:'ESP32-001', label:'Nodo cucina', kind:'esp32', sensors:['temperature','ph'], evidenceState:'DECLARED'
    });
  });
  test('rejects an invalid device identifier', () => {
    expect(() => normalizeDevice({ deviceId:'bad device!', label:'x', kind:'esp32', sensors:['temperature'] })).toThrow(/deviceId/);
  });
});
