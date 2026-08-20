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

- **MyZubsterGateway:** attività di sviluppo e validazione continua sul boundary di gateway, integrazioni e settlement. Issue e pull request aperte indicano un workstream attivo; fork/star e altre metriche GitHub sono segnali di interesse tecnico, non metriche di adozione.
- **Monero / FCMP++:** è aperto un filone per aggiornare il wallet e il monitoraggio delle transazioni in vista del supporto FCMP++, includendo configurazione wallet/RPC, nuovi tipi di transazione, conferme, test e documentazione. Lo stato resta di sviluppo finché l'implementazione non viene verificata.
- **Bounty lifecycle:** il progetto rafforza la separazione tra attività GitHub e settlement: issue, assegnazione, PR o merge non costituiscono prova di pagamento. Il percorso canonico resta `PROPOSED -> VALIDATED -> APPROVED -> FUNDED -> ACTIVE -> SUBMITTED -> UNDER_REVIEW -> VERIFIED -> REWARD_RECORDED -> SETTLEMENT_PENDING / SETTLED`.
- **Security hardening:** tra i workstream pubblici figurano aggiornamento delle dipendenze/vulnerabilità e rate limiting degli endpoint API. Le issue descrivono lavoro richiesto o in corso e non certificano da sole che la remediation sia già distribuita.
- **Documentazione:** è in corso l'allineamento delle tabelle/stati README tra i repository per rendere più esplicita la distinzione tra production, development, testnet, simulation, experimental e proposed.
- **Monitoraggio Gateway:** sono presenti filoni dedicati ad analisi di pagamenti/trend e notifiche, mantenendo la verifica finanziaria separata dalle dichiarazioni applicative.
- **Esposizione esterna:** eventuali menzioni su community, aggregatori o piattaforme esterne vengono considerate segnali di visibilità e discovery; engagement e adozione devono essere misurati separatamente con evidenza verificabile.

### Visibilità esterna e discovery — agosto 2026

Nel corso di agosto 2026 sono state osservate diverse indicizzazioni e ripubblicazioni esterne riconducibili a MyZubster. Questi segnali documentano **discovery tecnica e distribuzione dei contenuti**, non endorsement, partnership, utenti attivi o adozione commerciale.

**Verifica più recente:** 20 agosto 2026.

- **KMP Weekly:** indicizzazione del contenuto tecnico `NFC Payments in MyZubster: A Complete Guide`, con esposizione verso la community Kotlin Multiplatform.
- **Orion / ContributeHub:** indicizzazione di numerosi bounty MyZubster, inclusi task su wallet/Monero, marketplace API, escrow, AI agent multisig, Seed Exchange, export CSV/GeoJSON, Arduino, orti urbani ed EVA IONI. La presenza nell'aggregatore aumenta la discoverability delle attività presso contributor esterni; non dimostra esecuzione o pagamento delle bounty.
- **TensorHack:** indicizzazione della bounty `[BOUNTY B5] Wallet reale per Monero (XMR)` collegata a `MyZubster-Ecosystem/MyZubsterGateway`, oltre ad altre opportunità relative all'ecosistema. È un segnale di discovery open-source esterna, non una validazione del settlement.
- **Espansione oltre il solo Gateway:** sono state osservate indicizzazioni di bounty anche per `MyZubsterWeb` e per filoni IoT/robotica/agricoltura urbana, inclusi task su Telegram Bot per AgricoloBot, sensori Arduino, mappa/dashboard orti urbani ed EVA IONI.
- **Crebral:** indicizzazione/ripubblicazione di contenuti tecnici su Urban Lab e integrazioni con MyZubster, `I-ECO-01` e `MyZubsterWeb`, includendo riferimenti a escrow, MYZ, XMR, robot/AI e oltre 25 test simulati. Questi claim descrivono contenuti indicizzati e vanno verificati contro codice, test e repository canonici.
- **Polaris7:** presenza di MyZubster tra segnali tecnici/di mercato collegati a GitHub e all'ecosistema software.
- **TechForDev:** ripubblicazione/indicizzazione dell'aggiornamento su EVA IONI del 7 agosto 2026, con riferimenti a MyZubster, Monero, repository e bounty.
- **Artemida.team:** diffusione in lingua russa di contenuti relativi al MyZubster Robot.
- **Toldrop:** inclusione di contenuti MyZubster AI/automation in report/editorial aggregation esterni.
- **LibHunt:** collegamenti e discovery di contenuti MyZubster in un indice orientato ai progetti software/open-source.

La scansione più recente mostra soprattutto **indicizzazione di bounty e contenuti tecnici da parte di aggregatori terzi**. Non sono emersi, nella stessa scansione, nuovi articoli giornalistici indipendenti o discussioni di forum che costituiscano una valutazione critica autonoma di MyZubster.

Queste menzioni vengono trattate come **segnali di propagazione esterna**. La loro presenza non dimostra conversioni, utenti attivi, investimenti, relazioni commerciali o riconoscimenti ufficiali. Quando una pagina esterna riprende claim istituzionali o territoriali, tali formulazioni devono essere verificate separatamente prima di essere considerate affidabili.

### Come leggere questi aggiornamenti

MyZubster privilegia una documentazione prudente: una feature proposta non è una feature rilasciata, un merge non è un pagamento, un fork non è un utente attivo e un'integrazione descritta non è necessariamente operativa in produzione. Le fonti canoniche restano codice, test, CI, policy bounty ed evidenze indipendenti appropriate al tipo di claim.

## 🇪🇺 Programma LIFE dell'Unione europea

MyZubster sta esplorando il **Programma LIFE 2021–2027** come possibile quadro europeo per sviluppare e validare applicazioni ambientali dell'ecosistema. LIFE è lo strumento di finanziamento dell'Unione europea dedicato ad ambiente e azione per il clima ed è articolato in quattro sottoprogrammi: **Nature and Biodiversity**, **Circular Economy and Quality of Life**, **Climate Change Mitigation and Adaptation** e **Clean Energy Transition**.

Le aree di MyZubster potenzialmente coerenti con LIFE includono:

- raccolta e documentazione di osservazioni ambientali verificabili;
- biodiversità urbana, alberi, piante, habitat e monitoraggio territoriale;
- acqua, qualità ambientale, economia circolare e riduzione degli sprechi;
- IoT, robotica e sensoristica per pilot ambientali;
- dati geospaziali, GeoJSON, fotografia e sistemi di evidenza/MRV;
- partecipazione civica, citizen science e collaborazione open-source;
- replicazione di pilot e strumenti digitali in territori e comunità differenti.

### Possibile ruolo di MyZubster in un progetto LIFE

A seconda della call e del consorzio, MyZubster potrebbe contribuire come **piattaforma tecnologica/open-source**, layer di raccolta dati ed evidenze, supporto a pilot ambientali, visualizzazione e mapping, citizen engagement, automazione o infrastruttura per monitoraggio e replicazione.

Il lavoro preparatorio comprende la ricerca di soggetti compatibili per ruoli quali **applicant/coordinator, partner scientifici, enti territoriali, pilot site, validazione ambientale, MRV e replicazione**.

### LIFE 2026 — preparazione e outreach

Nel mese di agosto 2026 è stato avviato un percorso di pre-candidatura orientato alla call di lavoro **LIFE-2026-SAP-ENV-ENVIRONMENT**, con focus preliminare su **efficienza idrica, gestione del verde urbano, circular economy, MRV digitale e replicazione territoriale**.

Sono stati predisposti documenti di lavoro quali Concept Note, schema del pilot ambientale, Partner Pack, baseline/MRV e application matrix. Questi documenti sono **bozze di pre-candidatura** e non costituiscono una submission approvata né impegni di soggetti terzi.

Sono stati inoltre avviati contatti esplorativi con potenziali partner italiani ed europei, tra cui soggetti con esperienza su acqua, GIS, circular economy, progetti LIFE, ricerca scientifica, utility, gestione del verde e replicazione. Tra i profili contattati o valutati figurano, a titolo di outreach preliminare, **Università di Bologna, Maggioli, CNR-ISOF, Consorzio di Bonifica della Romagna, GECOsistema, ACCIONA/LIFE PRISTINE, Catalan Water Partnership, BIOAZUL, Anthea, R3GIS e Greenholds**.

Un primo riscontro operativo è arrivato dall'**Unità ARIC – LIFE & EMFAF dell'Università di Bologna**, che ha invitato MyZubster a trasmettere la Concept Note per un possibile matching interno con manifestazioni di interesse dei dipartimenti su topic affini. Concept Note e Pilot Ambientale sono stati quindi trasmessi per valutazione preliminare.

Altri riscontri ricevuti sono, al momento, prevalentemente **autoresponder/out-of-office o conferme indirette di consegna**. Non devono essere interpretati come interesse formale, adesione al consorzio o disponibilità a partecipare alla candidatura.

> **Stato LIFE 2026:** pre-candidatura / partner discovery / matching scientifico in corso. Nessun soggetto viene considerato partner confermato senza manifestazione esplicita e successiva formalizzazione.

> **Stato:** esplorazione / preparazione. La presenza di questa sezione non implica che MyZubster abbia ricevuto finanziamenti LIFE, che una candidatura sia stata approvata o che esista una partnership ufficiale con l'Unione europea, CINEA o altri enti. Qualsiasi candidatura, partnership, grant o progetto finanziato dovrà essere documentato separatamente con evidenza verificabile.

Riferimenti ufficiali:

- [European Commission — LIFE Programme](https://commission.europa.eu/funding-and-tenders/find-funding/eu-funding-programmes/programme-environment-and-climate-action-life_en)
- [CINEA — LIFE](https://cinea.ec.europa.eu/programmes/life_en)
- [EU Funding & Tenders Portal — LIFE](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/programmes/life2027)

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

IPFS fornisce content addressing e replica. **Non sostituisce da solo autorizzazione, consenso applicativo o settlement finanziario.** MongoDB e i servizi backend restano parte del layer operativo, mentre gli snapshot pubblici sono indipendentemente indirizzabili.

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

- [🌍 Universal / Multilingual Guide](docs/i18n/README.md)
- [Ecosystem Architecture](docs/ECOSYSTEM.md)
- [Bounty System](BOUNTIES.md)
- [Documentation hub](https://github.com/MyZubster-Ecosystem/myzubster-docs)
- [Manuals](https://github.com/MyZubster-Ecosystem/myzubster-manuals)

## Licenza

MIT License. Vedi `LICENSE`.

## Nota di trasparenza

MyZubster è un progetto in evoluzione. La documentazione deve distinguere funzionalità operative, testnet, simulazioni, prototipi, proposte e componenti ancora in validazione. Le issue storiche rappresentano contesto di progetto, non prova automatica di deployment, partnership, funding o pagamento.