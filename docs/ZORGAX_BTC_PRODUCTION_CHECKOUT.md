# Zorgax BTC production checkout

## Scope

Bitcoin is the first operational paid-access rail for Zorgax while preserving a non-custodial model.

- Free remains free.
- Pro is €9.90 monthly-equivalent.
- Developer is €29.90 monthly-equivalent.
- BTC is enabled by default.
- ETH/XMR/TARI remain unavailable unless their wallet, quote provider and trusted verifier are explicitly configured.

## Payment flow

1. Authenticated user selects Pro or Developer in the existing Zorgax checkout UI.
2. Server creates a persistent payment intent containing owner, plan, BTC destination, EUR/BTC quote and a 15-minute expiry.
3. User authorizes and sends BTC from their own wallet. MyZubster never signs or broadcasts the transaction.
4. User supplies the Bitcoin txid.
5. Server verifies the txid on-chain: exact destination, sufficient satoshis and minimum confirmations.
6. Only a verified payment activates 30-day access.
7. Payment intent and payment reference replay protections prevent reuse.

## Production defaults

The public BTC receiving address defaults to the same public address already exposed by the MyZubster Wallet Hub and can be overridden with `ZORGAX_WALLET_BTC`.

BTC/EUR quotes use the CoinGecko keyless simple-price endpoint when `ZORGAX_QUOTE_API_URL` is not configured. A custom trusted quote provider remains supported through the existing environment variables.

BTC verification uses the Blockstream Esplora HTTPS API when `ZORGAX_BTC_VERIFIER_URL`/`ZORGAX_BTC_VERIFIER_TOKEN` are not configured. The existing private Electrum verifier remains preferred when those variables are configured. `ZORGAX_BTC_ESPLORA_URL` can point to a self-hosted/private Esplora instance.

Default confirmation policy is one confirmation and can be changed with `ZORGAX_BTC_MIN_CONFIRMATIONS`.

## Security boundary

No seed phrase, private key, wallet password or automatic signing credential is accepted or stored. The browser cannot choose the destination or expected amount used for verification; both are loaded from the persisted server-side payment intent.

A public explorer fallback reveals the queried transaction id to that provider. Operators who need stronger privacy should set `ZORGAX_BTC_ESPLORA_URL` to a self-hosted/private Esplora or configure the existing private Electrum verifier.
