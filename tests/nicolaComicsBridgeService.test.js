const { askNicolaComics, normalizeAction } = require('../src/services/nicolaComicsBridgeService');

describe('Nicola Comics read-only bridge', () => {
  test('allows only documented read-only actions', () => {
    expect(normalizeAction('gallery')).toBe('gallery');
    expect(normalizeAction('candidate')).toBe('candidate');
    expect(() => normalizeAction('mint')).toThrow(/non supportata/i);
  });

  test('requires comic_id for detail', async () => {
    await expect(askNicolaComics({ action: 'detail', fetchImpl: jest.fn() }))
      .rejects.toThrow(/comic_id obbligatorio/i);
  });

  test('forwards a read-only candidate request and marks bridge metadata', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ action: 'candidate', sources: [{ comic_id: 'n4k48-comic-001', rights_status: 'TO_VERIFY' }] })
    });
    const result = await askNicolaComics({ question: 'Quale candidata?', action: 'candidate', fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.read_only).toBe(true);
    expect(result.bridge).toBe('nicola-comics-read-only');
    expect(result.sources[0].rights_status).toBe('TO_VERIFY');
  });

  test('returns gallery data from a mocked upstream response', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ action: 'gallery', items: [{ comic_id: 'n4k48-comic-001' }] })
    });

    const result = await askNicolaComics({
      question: 'Mostrami i fumetti di Nicola',
      action: 'gallery',
      fetchImpl
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.items).toEqual([{ comic_id: 'n4k48-comic-001' }]);
    expect(result.read_only).toBe(true);
    expect(result.bridge).toBe('nicola-comics-read-only');
  });

  test('surfaces upstream HTTP failures without performing writes', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(
      askNicolaComics({ action: 'gallery', fetchImpl })
    ).rejects.toThrow('Pilot Nicola Comics HTTP 503');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, options] = fetchImpl.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.body).toContain('"action":"gallery"');
  });
});
