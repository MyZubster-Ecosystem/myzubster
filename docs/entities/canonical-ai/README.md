# Entità AI canoniche MyZubster

Questa cartella documenta le 12 entità esposte dall'hub pubblico `/entities`. Il registro sorgente è `frontend/src/data/canonicalEntities.json`; in caso di conflitto prevalgono il comportamento verificato da codice e test, poi il registro canonico, poi questi README.

## Registro

| ID | Entità | Ruolo sintetico |
| --- | --- | --- |
| `ZORGAX-001` | [Zorgax](zorgax/README.md) | Guida e custode delle evidenze |
| `LIFE-PATHFINDER-001` | [LIFE Pathfinder](life-pathfinder/README.md) | Pilot ambientali e replicazione |
| `CIRCULA-001` | [Circula](circula/README.md) | Economia circolare e riuso |
| `MRV-ORACLE-001` | [MRV Oracle](mrv-oracle/README.md) | Baseline, KPI e MRV |
| `GAIA-MAPPER-001` | [Gaia Mapper](gaia-mapper/README.md) | Geospazio e biodiversità |
| `EVA-IONI-001` | [EVA IONI](eva-ioni/README.md) | Robotica, sensori e telemetria |
| `IPFS-ARCHIVIST-001` | [IPFS Archivist](ipfs-archivist/README.md) | Evidenze pubbliche e provenance |
| `BOUNTY-FORGE-001` | [Bounty Forge](bounty-forge/README.md) | Missioni contributor verificabili |
| `LEDGER-KEEPER-001` | [Ledger Keeper](ledger-keeper/README.md) | Ledger interno MYZ e audit |
| `GATEWAY-CUSTODIAN-001` | [Gateway Custodian](gateway-custodian/README.md) | Confini provider e settlement |
| `METASPLOIT-SENTINEL-001` | [Metasploit Sentinel](metasploit-sentinel/README.md) | Sicurezza difensiva autorizzata |
| `GITHUB-CHRONICLER-001` | [GitHub Chronicler](github-chronicler/README.md) | Cronologia e governance GitHub |

## Accesso comune

- UI: `/entities`, `/agents` o `/assistants`; il frammento `#slug` seleziona un'entità.
- Profilo: `GET /api/entities/:slug`.
- Stato: `GET /api/entities/:slug/status`.
- Chat: `POST /api/entities/:slug/chat` con `{ "message": "..." }`.

Le risposte dichiarano `generative` oppure `guided-fallback`. La chat generica non conserva memoria sul server e non esegue automaticamente settlement o azioni esterne.
