# MYZ post-merge pipeline

The core repository contributes two verification layers for the canonical MYZ accounting path:

- the repository-wide CI workflow;
- the dedicated `MYZ canonical ledger contract` workflow.

The Marketplace repository separately executes the cross-repository vertical slice and a staging end-to-end harness against canonical core `main`.

Only real successful workflow runs should be used as evidence that the software pipeline is green. These gates do not enable or verify external settlement, exchange services, custody, listing, provider support or regulatory authorization.
