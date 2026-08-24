const { serializeGarden } = require('../src/controllers/urbanGardenController');

describe('urban garden production contract', () => {
  test('serializes the database location for the frontend map', () => {
    const garden = serializeGarden({
      gardenId: 'garden-001',
      name: 'Orto Rimini',
      location: { lat: 44.0678, lng: 12.5695, address: 'Rimini' },
      status: 'active',
      size: 'small',
    });

    expect(garden).toMatchObject({
      id: 'garden-001',
      address: 'Rimini',
      gps: { lat: 44.0678, lng: 12.5695 },
    });
  });
});
