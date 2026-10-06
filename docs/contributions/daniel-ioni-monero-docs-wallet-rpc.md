# Daniel Ioni — proposta di documentazione per Monero Wallet RPC

**Tipo di attività:** proposta di modifica alla documentazione open source di Monero, non modifica integrata nel progetto originale.

**Identità dichiarata:** Daniel Ioni conferma di controllare l'account GitHub `DanielIoni-creator`, autore del commit nel fork. Questa dichiarazione non costituisce una verifica indipendente dell'identità.

## Modifica documentata

Nel fork `DanielIoni-creator/monero-docs`, il commit `ab4120311c8d2bf385714129c9c898ad0d4843ae` modifica una riga in `docs/en/rpc-library/wallet-rpc.md`, nella documentazione di `get_transfers`.

Prima:

```text
_pending_ - boolean; (defaults to false) Include pending transfers.
```

Proposta:

```text
_pending_ - boolean; (defaults to false) Include pending, unconfirmed outgoing transfers.
```

La modifica chiarisce che il parametro `pending` si riferisce ai trasferimenti in uscita in attesa di conferma; è una modifica di documentazione, non del comportamento dell'API.

## Riferimenti e stato

- [Commit nel fork dell'account dichiarato](https://github.com/DanielIoni-creator/monero-docs/commit/ab4120311c8d2bf385714129c9c898ad0d4843ae).
- [Proposta al repository originale: monero-project/monero-docs, PR #389](https://github.com/monero-project/monero-docs/pull/389), «docs: clarify get_transfers pending transfers».
- Stato osservato tramite account GitHub collegato: **PR chiusa, non integrata**.
- **Limitazione importante:** al momento della documentazione, la PR e il fork restituiscono 404 quando consultati senza autenticazione. Il testo e i riferimenti sono una ricostruzione documentale da dati consultabili con l'account GitHub collegato, **non una prova indipendentemente verificabile da chiunque**. La disponibilità di questa scheda pubblica non supera tale limite.

## Conoscenze che l'attività può documentare

Lettura e proposta di miglioramento della documentazione Monero Wallet RPC, comprensione del parametro `pending` di `get_transfers`, utilizzo del workflow fork e pull request GitHub.

Non dimostra un contributo accettato da Monero, un'affiliazione al progetto o una certificazione delle competenze tecniche.

*Documento informativo MyZubster, preparato per il percorso Knowledge Card. Non pubblica contenuti riservati né prova diritti sul progetto originale.*
