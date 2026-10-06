const { serializeGarden } = require('../src/controllers/urbanGardenController');

describe('urban garden privacy contract', () => {
  test('serializes only an approximate public location', () => {
    const garden = serializeGarden({
      gardenId: 'garden-001',
      name: 'Orto Rimini',
      ownerId: 'private-owner-id',
      location: {
        lat: 44.0637353,
        lng: 12.5678873,
        address: 'Private street 1',
        city: 'Rimini',
        country: 'IT',
        visibility: 'approximate'
      },
      status: 'active',
      size: 'small'
    });

    expect(garden).toMatchObject({
      id: 'garden-001',
      address: '',
      gps: { lat: 44.06, lng: 12.57 },
      location: { visibility: 'approximate', precision: 'approx-1km' }
    });
    expect(garden.ownerId).toBeUndefined();
    expect(JSON.stringify(garden)).not.toContain('Private street 1');
  });
});
