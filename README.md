# MyZubster — osserva, documenta e collega il mondo reale

> 🌍 **Global / Multilingual:** [English · Italiano · Español · Français · Deutsch · Português · 中文 · 日本語 · 한국어 · العربية · हिन्दी · Русский · Türkçe · Bahasa Indonesia · Polski · Українська · বাংলা · اردو · فارسی · Kiswahili](docs/i18n/README.md)
>
> **MyZubster is an open-source ecosystem that connects real-world observations, verifiable evidence, collaborative bounties and platform rewards.** MYZ is currently an internal reward/accounting ledger; any external XMR/token/blockchain settlement is separate and requires independent verification.

**MyZubster è un ecosistema open-source collaborativo per mappare, documentare e collegare persone, luoghi, ambiente, tecnologia e servizi nel mondo reale.**

Parte da osservazioni concrete — fotografie, coordinate, piante, edifici, patrimonio, strade, servizi urbani e contributi — e le organizza in una struttura pubblica, verificabile e progressivamente estendibile.

## Stato del progetto

**MVP open-source in sviluppo e validazione.** Alcune funzionalità sono operative, altre sperimentali, simulate o ancora in progettazione.

Monero/XMR, MYZ, Tor, IPFS, robotica, IoT e AI appartengono a specifici layer o filoni dell'ecosistema: non implicano che ogni funzionalità sia già production-ready.

## 🆕 Aggiornamenti recenti — agosto 2026

L'ecosistema continua a evolvere su più repository. Gli elementi seguenti descrivono attività pubblicamente osservabili e non vanno interpretati come prova automatica di deployment production-ready, adozione, partnership o pagamento di bounty.

- **MyZubsterGateway:** attività di sviluppo e validazione continua sul boundary di gateway, integrazioni e settlement.
- **Monero / FCMP++:** filone di sviluppo per wallet e monitoraggio delle transazioni.
- **Bounty lifecycle:** issue, assegnazione, PR o merge non costituiscono prova di pagamento.
- **Security hardening:** aggiornamento dipendenze, vulnerabilità e rate limiting degli endpoint API.
- **Documentazione:** allineamento degli stati tra production, development, testnet, simulation, experimental e proposed.
- **Monitoraggio Gateway:** analisi di pagamenti/trend e notifiche mantenendo la verifica finanziaria separata dalle dichiarazioni applicative.

### Visibilità esterna e discovery — agosto 2026

Nel corso di agosto 2026 sono state osservate indicizzazioni e ripubblicazioni esterne riconducibili a MyZubster. Questi segnali documentano **discovery tecnica e distribuzione dei contenuti**, non endorsement, partnership, utenti attivi o adozione commerciale.

**Verifica più recente:** 20 agosto 2026.

- **KMP Weekly:** indicizzazione di contenuti tecnici MyZubster.
- **Orion / ContributeHub:** indicizzazione di bounty MyZubster.
- **TensorHack:** discovery di bounty collegate a MyZubsterGateway.
- **Crebral, Polaris7, TechForDev, Artemida.team, Toldrop e LibHunt:** indicizzazioni/ripubblicazioni esterne di contenuti collegati all'ecosistema.

Queste menzioni vengono trattate come **segnali di propagazione esterna**. La loro presenza non dimostra conversioni, utenti attivi, investimenti, relazioni commerciali o riconoscimenti ufficiali.

## Fonti esterne pubbliche

Questa sezione raccoglie fonti pubbliche esterne al repository utili a ricostruire l'evoluzione narrativa e tecnica di MyZubster. Le pubblicazioni dell'autore documentano ciò che è stato dichiarato pubblicamente in un determinato momento; **non sostituiscono codice, test, CI o verifica indipendente** dello stato effettivo delle funzionalità.

### DEV Community — Daniel Ioni

- [Building MyZubster: An Open-Source Skill Exchange Platform with Monero Payments](https://dev.to/danielioni/building-myzubster-an-open-source-skill-exchange-platform-with-monero-payments-5dco) — presentazione iniziale pubblica di MyZubster come piattaforma open-source per skill/service exchange, privacy e pagamenti Monero.
- [I built a Monero payment platform with Admin Panel, WebSocket, and advanced security](https://dev.to/danielioni/i-built-a-monero-payment-platform-with-admin-panel-websocket-and-advanced-security-57ji) — evoluzione del gateway/pagamenti, frontend/backend, WebSocket e preparazione Tor.
- [MyZubster Architecture Deep Dive](https://dev.to/danielioni/myzubster-architecture-deep-dive-3fbi) — descrizione pubblica dell'architettura, dei componenti, del data flow e della scalabilità dell'ecosistema.
- [How I Integrated Kali Linux and DeepSeek (Local AI) to Build a Self-Defending Security Bot for MyZubster](https://dev.to/danielioni/how-i-integrated-kali-linux-and-deepseek-local-ai-to-build-a-self-defending-security-bot-for-47lk) — pubblicazione sul filone AI locale e security automation. Le attività di security testing devono essere limitate a sistemi propri o esplicitamente autorizzati.
- [Building an AI Automation System for MyZubster](https://dev.to/danielioni/building-an-ai-automation-system-for-myzubster-4k2) — descrizione del workflow di automazione per GitHub, bounty, Telegram e modelli AI locali.

### LinkedIn — Daniel Ioni

- [Post pubblico sugli AI agent nel mondo fisico e MyZubster](https://www.linkedin.com/posts/daniel-ioni-62b2b9423_github-danielioni-creatormyzubstergateway-activity-7485379054464835584-vEOI) — collega pubblicamente MyZubster ai temi di identità decentralizzata, contratti digitali, NFC/biometria, privacy payments, IoT e interazioni AI↔human / AI↔AI.

### Criterio di utilizzo delle fonti

Le fonti sopra vengono usate come **cronologia pubblica e materiale editoriale**. Claim relativi a deployment, partnership, finanziamenti, pagamenti, utenti, prestazioni o capacità production devono essere verificati separatamente prima di essere presentati come fatti confermati.

## 🇪🇺 Programma LIFE dell'Unione europea

MyZubster sta esplorando il **Programma LIFE 2021–2027** come possibile quadro europeo per sviluppare e validare applicazioni ambientali dell'ecosistema.

Le aree potenzialmente coerenti includono osservazioni ambientali verificabili, biodiversità urbana, acqua, economia circolare, IoT/robotica, dati geospaziali, citizen science e replicazione territoriale.

> **Stato LIFE 2026:** pre-candidatura / partner discovery / matching scientifico in corso. Nessun soggetto viene considerato partner confermato senza manifestazione esplicita e successiva formalizzazione.

Riferimenti ufficiali:

- [European Commission — LIFE Programme](https://commission.europa.eu/funding-and-tenders/find-funding/eu-funding-programmes/programme-environment-and-climate-action-life_en)
- [CINEA — LIFE](https://cinea.ec.europa.eu/programmes/life_en)
- [EU Funding & Tenders Portal — LIFE](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/programmes/life2027)

## Architettura dell'ecosistema

La mappa canonica dei repository e dei confini tra core, Gateway, app/web, robotica, AI, escrow/verifier e documentazione è mantenuta in:

- [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md)

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

MyZubster costruisce una **mappa visuale e informativa del mondo reale** e workflow per collegare contributi, evidenze e attività verificabili.

### Cosa può documentare

- luoghi, piazze, strade e panorami;
- piante, alberi, giardini e biodiversità urbana;
- edifici e patrimonio storico/culturale;
- servizi urbani e ambientali;
- fotografie e osservazioni geolocalizzate;
- progetti tecnologici, civici e sperimentali;
- evidenze associate a bounty definite in modo esplicito.

## Public data layer: IPFS/IPNS

Il core può pubblicare **snapshot pubblici sanitizzati** tramite IPFS/IPNS. IPFS fornisce content addressing e replica, ma **non sostituisce da solo autorizzazione, consenso applicativo o settlement finanziario**.

## Bounty system

Il contratto canonico è [`BOUNTIES.md`](BOUNTIES.md).

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

Una bounty può dichiarare una componente XMR/token, ma `PAID` richiede evidenza verificabile appropriata al rail.

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

Le osservazioni geografiche usano coordinate WGS84. La precisione geografica deve essere ridotta o esclusa quando una posizione può essere sensibile.

## Sicurezza e safety

Non inserire mai nei repository private key/wallet seed, password/token di produzione, credenziali infrastrutturali o dati personali/confidenziali non necessari.

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

- [🌍 Universal / Multilingual Guide](docs/i18n/README.md)
- [Ecosystem Architecture](docs/ECOSYSTEM.md)
- [Bounty System](BOUNTIES.md)
- [Documentation hub](https://github.com/MyZubster-Ecosystem/myzubster-docs)
- [Manuals](https://github.com/MyZubster-Ecosystem/myzubster-manuals)

## Licenza

MIT License. Vedi `LICENSE`.

## Nota di trasparenza

MyZubster è un progetto in evoluzione. La documentazione deve distinguere funzionalità operative, testnet, simulazioni, prototipi, proposte e componenti ancora in validazione. Le issue storiche rappresentano contesto di progetto, non prova automatica di deployment, partnership, funding o pagamento.