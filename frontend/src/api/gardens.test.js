import { getGardens, nearbyGardens, searchGardens } from './gardens';

describe('gardens API client', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, total: 0, gardens: [] }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('uses the deployed same-origin API by default', async () => {
    await getGardens({ status: 'active', size: 'large' });

    expect(global.fetch).toHaveBeenCalledWith('/api/gardens?status=active&size=large');
  });

  test('encodes text searches', async () => {
    await searchGardens('orto Rimini');

    expect(global.fetch).toHaveBeenCalledWith('/api/gardens/search?q=orto%20Rimini');
  });

  test('sends nearby radius in metres', async () => {
    await nearbyGardens(44.0678, 12.5695, 3000);

    expect(global.fetch).toHaveBeenCalledWith('/api/gardens/nearby?lat=44.0678&lng=12.5695&radius=3000');
  });
});
