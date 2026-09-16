const fs = require('fs');
const path = require('path');
const {
  askNicolaComics,
  sanitizePayload
} = require('../src/services/nicolaComicsService');

describe('Nicola Comics Zorgax bridge', () => {
  const originalBaseUrl = process.env.NICOLA_COMICS_BASE_URL;

  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.NICOLA_COMICS_BASE_URL;
    else process.env.NICOLA_COMICS_BASE_URL = originalBaseUrl;
    jest.restoreAllMocks();
  });

  test('permits only the four read-only actions', async () => {
    const fetchImpl = jest.fn();
    await expect(askNicolaComics({ action: 'mint', fetchImpl }))
      .rejects.toMatchObject({ statusCode: 400, code: 'NICOLA_COMICS_ACTION_INVALID' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('requires an explicit comic id for detail', async () => {
    const fetchImpl = jest.fn();
    await expect(askNicolaComics({ action: 'detail', fetchImpl }))
      .rejects.toMatchObject({ statusCode: 400, code: 'NICOLA_COMICS_COMIC_ID_REQUIRED' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('uses HTTPS, bounds input and returns a privacy-minimized response', async () => {
    process.env.NICOLA_COMICS_BASE_URL = 'https://myzubster-mvp.onrender.com/';
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        action: 'candidate',
        answer: 'Prima candidata proposta.',
        sources: [{
          comic_id: 'n4k48-comic-001',
          title: 'Dall’idea software al metaverso',
          nft_status: 'NFT_CANDIDATE',
          selection_status: 'PROPOSED_FOR_REVIEW',
          rights_status: 'TO_VERIFY',
          contract_address: null,
          token_id: null,
          transaction_hash: null,
          network: null,
          metadata_uri: null,
          private_note: 'must not leave the pilot response'
        }],
        unexpected: 'discard me'
      })
    });

    const result = await askNicolaComics({
      action: 'candidate',
      question: 'Quale candidata?',
      fetchImpl
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://myzubster-mvp.onrender.com/api/zorgax/ask');
    expect(JSON.parse(options.body)).toEqual({
      question: 'Quale candidata?',
      action: 'candidate'
    });
    expect(result).toMatchObject({
      action: 'candidate',
      upstream: 'nicola-comics',
      read_only: true,
      source_count: 1
    });
    expect(result.sources[0]).toMatchObject({
      comic_id: 'n4k48-comic-001',
      nft_status: 'NFT_CANDIDATE',
      selection_status: 'PROPOSED_FOR_REVIEW',
      rights_status: 'TO_VERIFY',
      transaction_hash: null
    });
    expect(result.sources[0]).not.toHaveProperty('private_note');
    expect(result).not.toHaveProperty('unexpected');
  });

  test('rejects non-HTTPS endpoint configuration', async () => {
    process.env.NICOLA_COMICS_BASE_URL = 'http://127.0.0.1:5000';
    const fetchImpl = jest.fn();
    await expect(askNicolaComics({ action: 'gallery', fetchImpl }))
      .rejects.toMatchObject({ statusCode: 500, code: 'NICOLA_COMICS_CONFIG_INVALID' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('rejects an upstream action mismatch', () => {
    expect(() => sanitizePayload({ action: 'detail', answer: '', sources: [] }, 'gallery'))
      .toThrow('Risposta Nicola Comics incoerente');
  });

  test('routes only explicit nicolaComics requests and does not forward the generic chat message', () => {
    const route = fs.readFileSync(
      path.join(__dirname, '../src/routes/zorgaxAssistantRoutes.js'),
      'utf8'
    );
    expect(route).toContain('const nicola = req.body?.nicolaComics;');
    expect(route).toContain('question: nicola.question');
    expect(route).toContain("integration: 'nicola-comics'");
    expect(route).not.toContain('question: req.body?.message');
  });
});
