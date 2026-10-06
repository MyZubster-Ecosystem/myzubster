# MYZ ledger CI status

The canonical MYZ ledger should be described as CI-verified only when both the repository-wide CI and the dedicated `MYZ canonical ledger contract` workflow have completed successfully for the relevant commit.

The dedicated contract gate validates the ledger file, service behavior, route contract and the internal-accounting identity boundary. It does not validate any external settlement provider, exchange functionality, token listing, custody arrangement or regulatory authorization.
