# MyZubster — osserva, documenta e collega il mondo reale

**MyZubster è un ecosistema open-source collaborativo per mappare, documentare e collegare persone, luoghi, ambiente, tecnologia e servizi nel mondo reale.**

Parte da osservazioni concrete — fotografie, coordinate, piante, edifici, patrimonio, strade, servizi urbani e contributi — e le organizza in una struttura pubblica, verificabile e progressivamente estendibile.

## Stato del progetto

**MVP open-source in sviluppo e validazione.** Alcune funzionalità sono operative, altre sperimentali, simulate o ancora in progettazione.

Monero/XMR, MYZ, Tor, IPFS, robotica, IoT e AI appartengono a specifici layer o filoni dell'ecosistema: non implicano che ogni funzionalità sia già production-ready.

## Architettura dell'ecosistema

La mappa canonica dei repository e dei confini tra core, Gateway, app/web, robotica, AI, escrow/verifier e documentazione è mantenuta in:

- [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md)

In sintesi:

```text
users / contributors
       |
       v
App / Web
       |
       v
Core MyZubster
 |     |       |
 v     v       v
map  bounties observations/media
       |       |
       +---+---+
           v
      IPFS snapshots

external settlement boundary:
Core -> Gateway -> payment/treasury -> independent verifier
```

## Che cos'è MyZubster

MyZubster costruisce una **mappa visuale e informativa del mondo reale** e una serie di workflow per collegare contributi, evidenze e attività verificabili.

### Cosa può documentare

- luoghi, piazze, strade e panorami;
- piante, alberi, giardini e biodiversità urbana;
- edifici e patrimonio storico/culturale;
- servizi urbani e ambientali;
- fotografie e osservazioni geolocalizzate;
- progetti tecnologici, civici e sperimentali;
- evidenze associate a bounty definite in modo esplicito.

## Public data layer: IPFS/IPNS

Il core può pubblicare **snapshot pubblici sanitizzati** tramite IPFS/IPNS, con indici separati per elementi come foto, bounty, reward pubblici, crawler observations e discoveries.

Il modello è:

```text
stable IPNS name
      |
      v
latest root CID
      |
      +-- photos CID
      +-- bounties CID
      +-- rewards CID
      +-- crawler CID
      +-- discoveries CID
```

IPFS fornisce content addressing e replica. **Non sostituisce da solo autorizzazione, consenso applicativo o settlement finanziario.** MongoDB e i servizi backend restano parte del layer operativo, mentre gli snapshot pubblici sono indipendentemente indirizzabili.

I metadata pubblici non devono includere secret, identificativi privati non necessari, path locali, ricerca confidenziale o dettagli sensibili di infrastrutture/aree ristrette.

## Bounty system

Il contratto canonico è:

- [`BOUNTIES.md`](BOUNTIES.md)

Lifecycle di alto livello:

```text
PROPOSED
 -> VALIDATED
 -> APPROVED
 -> FUNDED (quando necessario)
 -> ACTIVE
 -> SUBMITTED
 -> UNDER_REVIEW
 -> VERIFIED / REJECTED
 -> REWARD_RECORDED
 -> SETTLEMENT_PENDING / SETTLED
```

Un'issue, un'assegnazione, una PR, un merge o un reward applicativo **non costituiscono da soli prova di pagamento esterno**.

### MYZ

Nel core attuale **MYZ è un ledger interno di reward/accounting**. Un reward MYZ `approved` rappresenta un credito della piattaforma; non va descritto automaticamente come transazione blockchain.

### XMR / token esterni

Una bounty può dichiarare una componente XMR/token, ma `PAID` richiede evidenza verificabile appropriata al rail. Un adapter/provider non può auto-dichiarare il settlement finale.

## Tecnologia

- **Backend:** Node.js / Express + MongoDB
- **Frontend:** interfacce web/client
- **Mappe/dataset:** GeoJSON e coordinate WGS84
- **Public snapshots:** IPFS/IPNS
- **Gateway/integrations:** servizi separati nel relativo repository
- **AI/automation:** supporto a workflow con human/security boundaries
- **Robotica/IoT:** prototipi, simulatori e hardware integration track
- **Rewards/settlement:** accounting interno separato dal settlement esterno verificato

## Mappa mondiale e osservazioni

Le osservazioni geografiche usano coordinate WGS84. Il repository può includere dataset GeoJSON e media/evidenze collegati agli oggetti della piattaforma.

La precisione geografica deve essere ridotta o esclusa quando una posizione può essere sensibile.

## Sicurezza e safety

Non inserire mai nei repository:

- private key o wallet seed;
- password/token di produzione;
- credenziali infrastrutturali;
- dati personali/confidenziali non necessari.

Le bounty fisiche/fotografiche non devono incentivare trespassing, accesso ad aree ristrette, raccolta di dettagli di sicurezza, ricerca confidenziale, armi/dispositivi pericolosi o attività non autorizzate.

## Avvio rapido

### Prerequisiti

- Node.js 20+
- MongoDB locale o Atlas
- Python 3 per i componenti che lo richiedono

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster
npm ci
```

Configura l'ambiente usando placeholder/template appropriati. Non committare `.env` con segreti reali.

## Test e CI

```bash
npm test
npm run build --if-present
```

## Documentazione

- [Ecosystem Architecture](docs/ECOSYSTEM.md)
- [Bounty System](BOUNTIES.md)
- [Documentation hub](https://github.com/MyZubster-Ecosystem/myzubster-docs)
- [Manuals](https://github.com/MyZubster-Ecosystem/myzubster-manuals)

## Licenza

MIT License. Vedi `LICENSE`.

## Nota di trasparenza

MyZubster è un progetto in evoluzione. La documentazione deve distinguere funzionalità operative, testnet, simulazioni, prototipi, proposte e componenti ancora in validazione. Le issue storiche rappresentano contesto di progetto, non prova automatica di deployment, partnership, funding o pagamento.