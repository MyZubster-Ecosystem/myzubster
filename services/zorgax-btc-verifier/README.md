# Zorgax BTC Electrum verifier

Small localhost-only verifier used by the Zorgax payment verification boundary. It accepts a BTC transaction id, expected destination and expected amount, reads the transaction through Electrum and returns a normalized verification result.

It never signs transactions and does not require seed phrases or private keys. Prefer a watch-only Electrum wallet when the local Electrum command requires a wallet context.

## Environment

```bash
PORT=8787
ZORGAX_BTC_VERIFIER_TOKEN=<generate-a-long-random-token>
ELECTRUM_BIN=/path/to/electrum
ELECTRUM_WALLET=/path/to/watch-only-wallet
```

The main MyZubster backend should use the same token and a local verifier URL:

```bash
ZORGAX_BTC_VERIFIER_URL=http://127.0.0.1:8787/verify
ZORGAX_BTC_VERIFIER_TOKEN=<same-token>
ZORGAX_BTC_MIN_CONFIRMATIONS=1
```

Generate the token directly on the server, for example with `openssl rand -hex 32`, and store it only in the server environment file. Do not commit it.

## API

`GET /health` is unauthenticated and returns verifier status. `POST /verify` requires `Authorization: Bearer <token>` and JSON containing `paymentReference`, `destination`, and `expectedAmount`.

The service binds to `127.0.0.1` intentionally. If the main application runs on another host, put the verifier behind a private authenticated network or reverse proxy; do not expose the raw service directly to the public Internet.
