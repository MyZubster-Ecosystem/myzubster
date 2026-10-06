# MYZ canonical ledger CI gate

The dedicated workflow `.github/workflows/myz-ledger-contract.yml` verifies the canonical MYZ accounting boundary independently from the repository's broader CI suite.

It checks:

- canonical `myz/ledger.json` integrity with `myz/verify-ledger.mjs`;
- `MyzLedgerApiService` behavior;
- MYZ ledger API route behavior;
- the v1 identity boundary: `asset=MYZ`, `asset_type=internal-reward-accounting-unit`, `on_chain=false`.

This workflow is a software contract gate. A green run does not represent external settlement, exchange support, token listing, regulatory approval, custody approval, or production readiness.

The Marketplace maintains a separate cross-repository/staging vertical-slice workflow that checks compatibility against this core implementation.
