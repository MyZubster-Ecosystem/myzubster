# Marketplace compatibility gate

The canonical MYZ ledger core is consumed by the Marketplace cross-repository contract and staging end-to-end workflows. Those workflows check the Marketplace against core `main` by default.

A green core-only workflow does not prove Marketplace compatibility; a green Marketplace cross-repository workflow does. Conversely, a green Marketplace workflow does not replace the core repository's own CI. Both sides are required for a complete software verification record.
