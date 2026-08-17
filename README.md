# MyZubster Space Station MVP

Sistema centrale dell'ecosistema MyZubster per missioni, telemetria, dashboard e integrazione con Gateway e servizi di pagamento.

## Che cos'è MyZubster

MyZubster è un **ecosistema software in sviluppo** che combina una piattaforma centrale con Gateway, Marketplace, applicazioni, componenti di robotica, servizi di escrow/pagamento e sistemi di bounty.

L'obiettivo è fornire un'infrastruttura per coordinare **missioni e progetti, attività verificabili e relative ricompense**, con possibilità di applicazione anche a progetti civici e pilota.

Il modello di bounty prevede, quando formalmente approvato e finanziato, un ciclo del tipo:

**proposta → validazione → approvazione → funding → attività → verifica → reward → reporting**.

MYZ, XMR e/o TOKEN possono essere previsti come modalità di reward secondo l'ambiente, il funding e le regole applicabili. La presenza di un'issue o di una bounty **non costituisce di per sé un pagamento, un finanziamento, una partnership o un'approvazione istituzionale**.

## Stato del progetto

**MVP in sviluppo e validazione.** Il core del repository è coperto da CI con test e build su Node.js 18 e 20. Le integrazioni Gateway, settlement e pagamento sono soggette a validazione progressiva e non devono essere considerate automaticamente production-ready.

### Componenti

- **Backend:** Express.js + MongoDB
- **Test:** Jest + Supertest
- **Simulatore:** Eva Ioni (Python)
- **Dashboard:** UI web
- **Gateway:** integrazione con MyZubster Gateway
- **Payments:** flussi MYZ/XMR con componenti simulate e/o in validazione, a seconda dell'ambiente

## Global XMR track

MyZubster mantiene un **track internazionale** per individuare use case e potenziali progetti pilota nei paesi in cui esistono community, servizi o attività documentabili legate a Monero/XMR.

Questo track non equivale ad adozione di MyZubster. Ogni paese segue il percorso:

**DISCOVERED → VALIDATED → CONTACTED → PILOT PROPOSED → APPROVED → FUNDED → ACTIVE → VERIFIED → REWARDED → REPORTED**.

XMR è considerato un possibile **rail di settlement** solo dove tecnicamente e legalmente appropriato. MYZ/TOKEN restano asset distinti e devono essere verificati separatamente per emissione, titolarità, disponibilità e compliance.

Il riferimento operativo per la mappa internazionale è **issue #484 — Global XMR Track**.

## Progetti e bounty civici

Il repository e le issue possono essere utilizzati per strutturare proposte di **progetti pilota civici**, inclusi casi d'uso relativi a ambiente, verde, servizi urbani, partecipazione, robotica e altri ambiti.

Queste proposte rappresentano un **framework operativo e una proposta di collaborazione**. Comune, Urban Lab, Hera, Anthea, università, governi o altri soggetti citati nelle issue non devono essere considerati aderenti, finanziatori o partner finché non esiste una formalizzazione verificabile.

## Struttura

```text
myzubster-space-station/
├── backend/       # API e logica di business
├── dashboard/     # UI web
├── simulator/    # Eva Ioni Simulator
├── gateway/      # Integrazione Gateway
├── docs/         # Documentazione
└── README.md
```

## Avvio rapido

### Prerequisiti

- Node.js 20+
- MongoDB locale o Atlas
- Python 3 (opzionale, per il simulatore)

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster
npm ci
```

Crea un `.env` appropriato per l'ambiente, quindi avvia il backend:

```bash
node backend/src/index.js
```

Per il simulatore:

```bash
python simulator/eva_ioni_simulator.py
```

## API principali

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/health` | GET | Stato del servizio |
| `/api/telemetry` | GET/POST | Gestione telemetria |
| `/api/gardens` | CRUD | Gestione orti |
| `/api/gateway` | POST | Integrazione Gateway |

La documentazione API dettagliata è in evoluzione e deve essere verificata contro l'ambiente in uso prima di integrazioni esterne.

## Test e CI

Localmente:

```bash
npm test
npm run build --if-present
```

La CI principale esegue installazione riproducibile, test e build su Node.js 18 e 20. Il lint viene eseguito quando è configurato nel repository.

## Bounties

Le bounty pubbliche e il relativo ciclo di vita sono documentati nel repository principale tramite `BOUNTIES.md`.

Una bounty non è considerata pagata semplicemente perché un'issue è stata chiusa o una PR è stata mergiata: il pagamento deve essere registrato separatamente e verificabile.

## Sicurezza e production readiness

Il repository include attività di hardening delle dipendenze e controlli CI. Prima di un deployment production devono essere verificati almeno:

- dipendenze e vulnerabilità;
- secret e variabili d'ambiente;
- health check e monitoring;
- gestione degli errori e retry;
- backup/rollback;
- test dei flussi di settlement e pagamento;
- comportamento in caso di timeout, duplicazione o fallimento del provider.

**Non inserire secret, seed, chiavi private o credenziali nei repository.**

## Licenza

MIT License. Vedi `LICENSE`.

## Nota

Questo progetto è un MVP in fase di sviluppo e validazione. Alcune funzionalità possono essere simulate, in memoria o limitate all'ambiente di test. Non utilizzare in produzione senza una verifica specifica dell'ambiente e dei flussi coinvolti.
