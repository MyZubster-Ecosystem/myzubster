# MYZ ledger CI scope

The dedicated MYZ ledger gate is intentionally narrow and deterministic. It verifies the canonical ledger file, the ledger service contract, API routes, and the internal-accounting identity boundary.

It complements rather than replaces repository-wide CI. Both workflows should be green before the core MYZ ledger is described as pipeline-verified for a given commit.
