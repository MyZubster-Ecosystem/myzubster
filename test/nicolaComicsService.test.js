const { askNicolaComics, ALLOWED_ACTIONS } = require('../src/services/nicolaComicsService');

describe('Nicola Comics Zorgax bridge', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.NICOLA_COMICS_BASE_URL;
    jest.restoreAllMocks();
  });

  test('exposes only the read-only pilot actions', () => {
    expect([...ALLOWED_ACTIONS]).toEqual(['gallery', 'detail', 'candidate', 'next_steps']);
  });

  test('rejects unsupported actions before making a request', async () => {
    global.fetch = jest.fn();
    await expect(askNicolaComics({ action: 'mint' })).rejects.toThrow('Unsupported Nicola Comics action');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('requires a comic id for detail', async () => {
    global.fetch = jest.fn();
    await expect(askNicolaComics({ action: 'detail' })).rejects.toThrow('comicId is required for detail');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('forwards an explicit read-only request to the configured public pilot', async () => {
    process.env.NICOLA_COMICS_BASE_URL = 'https://pilot.example.test/';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: 'ok', candidate: { rights_status: 'TO_VERIFY' } })
    });

    const result = await askNicolaComics({
      action: 'detail',
      comicId: 'n4k48-comic-001',
      question: 'Apri la prima tavola'
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://pilot.example.test/api/zorgax/ask');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      question: 'Apri la prima tavola',
      action: 'detail',
      comic_id: 'n4k48-comic-001'
    });
    expect(result).toMatchObject({ upstream: 'nicola-comics', read_only: true });
  });
});
