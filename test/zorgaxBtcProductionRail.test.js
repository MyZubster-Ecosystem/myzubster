'use strict';

const {
  DEFAULT_BTC_WALLET,
  publicWallets,
  isSettlementRailOperational,
  catalog
} = require('../src/services/zorgaxMonetizationService');
const { quotePlan } = require('../src/services/zorgaxQuoteService');
const { btcAmountToSats, verifySettlement } = require('../src/services/zorgaxChainVerifierService');

describe('Zorgax BTC production rail', () => {
  const previous = {
    wallet: process.env.ZORGAX_WALLET_BTC,
    quoteUrl: process.env.ZORGAX_QUOTE_API_URL,
    quoteKey: process.env.ZORGAX_QUOTE_API_KEY,
    verifierUrl: process.env.ZORGAX_BTC_VERIFIER_URL,
    verifierToken: process.env.ZORGAX_BTC_VERIFIER_TOKEN,
    minConfirmations: process.env.ZORGAX_BTC_MIN_CONFIRMATIONS,
    esploraUrl: process.env.ZORGAX_BTC_ESPLORA_URL
  };

  beforeEach(() => {
    delete process.env.ZORGAX_WALLET_BTC;
    delete process.env.ZORGAX_QUOTE_API_URL;
    delete process.env.ZORGAX_QUOTE_API_KEY;
    delete process.env.ZORGAX_BTC_VERIFIER_URL;
    delete process.env.ZORGAX_BTC_VERIFIER_TOKEN;
    delete process.env.ZORGAX_BTC_ESPLORA_URL;
    process.env.ZORGAX_BTC_MIN_CONFIRMATIONS = '1';
  });

  afterAll(() => {
    const restore = (key, value) => value === undefined ? delete process.env[key] : (process.env[key] = value);
    restore('ZORGAX_WALLET_BTC', previous.wallet);
    restore('ZORGAX_QUOTE_API_URL', previous.quoteUrl);
    restore('ZORGAX_QUOTE_API_KEY', previous.quoteKey);
    restore('ZORGAX_BTC_VERIFIER_URL', previous.verifierUrl);
    restore('ZORGAX_BTC_VERIFIER_TOKEN', previous.verifierToken);
    restore('ZORGAX_BTC_MIN_CONFIRMATIONS', previous.minConfirmations);
    restore('ZORGAX_BTC_ESPLORA_URL', previous.esploraUrl);
  });

  test('BTC is operational by default without exposing signing secrets', () => {
    expect(publicWallets().BTC).toBe(DEFAULT_BTC_WALLET);
    expect(isSettlementRailOperational('BTC')).toBe(true);
    const btc = catalog().settlement.wallets.BTC;
    expect(btc.configured).toBe(true);
    expect(btc.operational).toBe(true);
    expect(catalog().settlement.assets).toContain('BTC');
    expect(catalog().settlement.automaticSigning).toBe(false);
    expect(catalog().settlement.privateKeysAccepted).toBe(false);
  });

  test('creates a BTC/EUR quote from the default server-side provider', async () => {
    const now = Math.floor(Date.now() / 1000);
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bitcoin: { eur: 100000, last_updated_at: now } })
    });

    const quote = await quotePlan({ asset: 'BTC', priceEur: 9.90, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0][0])).toContain('ids=bitcoin');
    expect(quote.source).toBe('coingecko-keyless');
    expect(quote.eurPerCoin).toBe(100000);
    expect(quote.cryptoAmount).toBe('0.00009900');
  });

  test('converts BTC decimal amounts to integer satoshis without float rounding', () => {
    expect(btcAmountToSats('0.00009900')).toBe(9900n);
    expect(btcAmountToSats('1.000000001')).toBe(100000001n);
  });

  test('verifies destination, amount and confirmations through Esplora fallback', async () => {
    const destination = DEFAULT_BTC_WALLET;
    const txid = 'a'.repeat(64);
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          vout: [
            { scriptpubkey_address: destination, value: 9900 },
            { scriptpubkey_address: 'bc1qother', value: 5000 }
          ],
          status: { confirmed: true, block_height: 100 }
        })
      })
      .mockResolvedValueOnce({ ok: true, text: async () => '100' });

    const result = await verifySettlement({
      asset: 'BTC',
      paymentReference: txid,
      destination,
      cryptoAmount: '0.00009900',
      fetchImpl
    });

    expect(result.verified).toBe(true);
    expect(result.paymentReference).toBe(txid);
    expect(result.confirmations).toBe(1);
    expect(result.verifier).toBe('blockstream-esplora');
  });

  test('fails closed when BTC is still unconfirmed', async () => {
    const destination = DEFAULT_BTC_WALLET;
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        vout: [{ scriptpubkey_address: destination, value: 9900 }],
        status: { confirmed: false }
      })
    });

    await expect(verifySettlement({
      asset: 'BTC',
      paymentReference: 'b'.repeat(64),
      destination,
      cryptoAmount: '0.00009900',
      fetchImpl
    })).rejects.toThrow('Conferme blockchain insufficienti');
  });
});
