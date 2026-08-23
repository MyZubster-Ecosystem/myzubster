# MyZubster Wallet Verification Core

This module isolates the cryptographic wallet-verification step from the marketplace runtime.

It creates a short-lived challenge bound to:

- authenticated MyZubster user ID;
- wallet address;
- EVM chain ID;
- random one-time nonce;
- expiry timestamp.

The wallet signs the exact challenge message. Verification recovers the signing address with `ethers.verifyMessage` and rejects expired or mismatched signatures.

## Current boundary

This module does **not** yet expose production API endpoints and does not store challenges in MongoDB. Runtime integration must add authenticated persistence, one-time challenge consumption, rate limiting, and audit-safe logging without storing wallet private keys or seeds.

No blockchain RPC connection, token transfer, NFT mint, marketplace listing, purchase, or deployer key is required by this module.

## Test

```bash
cd wallet-verification
npm install --ignore-scripts
npm test
```

Automated tests cover valid signatures, wrong-wallet signatures, expiry, and binding of user/chain/nonce data to the signed message.
