# MyZubster — osserva, documenta e collega il mondo reale

**MyZubster è un ecosistema open-source collaborativo per mappare, documentare e collegare persone, luoghi, ambiente, tecnologia e servizi nel mondo reale.**

Parte da osservazioni concrete — fotografie, coordinate GPS, piante, edifici, patrimonio storico, strade, panorami, servizi urbani e contributi degli utenti — e le organizza in una struttura pubblica, verificabile e progressivamente estendibile a livello mondiale.

## Che cos'è MyZubster

MyZubster costruisce una **mappa visuale e informativa del mondo reale**. Gli utenti possono contribuire documentando ciò che li circonda e associando alle osservazioni informazioni strutturate come posizione geografica, categoria, immagini e riferimenti verificabili.

Il progetto parte da Rimini come area iniziale di mappatura e può espandersi progressivamente ad altre città e paesi attraverso contributi della comunità.

### Cosa può documentare

- luoghi, piazze, strade e panorami;
- piante, alberi, giardini e biodiversità urbana;
- edifici e patrimonio storico e culturale;
- servizi urbani e ambientali;
- fotografie e osservazioni geolocalizzate;
- arte e altre forme di documentazione visuale;
- progetti tecnologici, civici e sperimentali collegati al territorio.

## Tecnologia al servizio della mappa

La tecnologia è l'infrastruttura del progetto, non il suo unico scopo. MyZubster utilizza e sperimenta strumenti come:

- **GitHub** per rendere codice, documentazione e dataset verificabili;
- **mappe e coordinate WGS84** per organizzare le osservazioni geografiche;
- **AI e automazione** per supportare classificazione, ricerca e gestione dei contributi;
- **robotica e IoT** per possibili applicazioni e raccolte dati future;
- **sistemi decentralizzati e strumenti orientati alla privacy** dove risultano utili;
- **bounty e sistemi di reward** per attività che siano formalmente definite, approvate e finanziate.

Monero/XMR, MYZ, Tor, robotica e altre tecnologie fanno parte di specifici filoni sperimentali dell'ecosistema: **non definiscono da soli MyZubster e non implicano che ogni funzionalità sia già disponibile o production-ready**.

## Missione

L'obiettivo è creare nel tempo una base aperta e collaborativa in cui osservazioni del mondo reale possano essere documentate, collegate geograficamente e rese utili alla comunità.

**MyZubster — osserva, documenta e collega il mondo reale.**

## Stato del progetto

**MVP open-source in sviluppo e validazione.** Alcune funzionalità sono operative, altre sperimentali, simulate o ancora in fase di progettazione.

Il repository comprende componenti per mappatura, API, dashboard, Gateway, marketplace, robotica, IoT, sistemi civici e flussi di bounty/reward in differenti livelli di maturità.

## Mappa mondiale e osservazioni

Le osservazioni geografiche sono organizzate usando coordinate WGS84. Il dataset mondiale è mantenuto in `data/observations.geojson` e può collegare ogni punto a documentazione, media e riferimenti cartografici esterni.

La mappatura iniziale include osservazioni di Rimini e costituisce il modello da estendere progressivamente ad altre città.

## Bounty e ricompense

Quando una bounty è formalmente approvata e finanziata, il modello previsto segue un ciclo del tipo:

**proposta → validazione → approvazione → funding → attività → verifica → reward → reporting**.

MYZ, XMR e/o altri asset possono essere previsti come modalità di reward secondo ambiente, disponibilità, funding e regole applicabili. La presenza di un'issue o di una bounty **non costituisce di per sé un pagamento, un finanziamento, una partnership o un'approvazione istituzionale**.

Le bounty pubbliche e il relativo ciclo di vita sono documentati in `BOUNTIES.md`.

## Progetti civici

Il repository e le issue possono essere utilizzati per strutturare proposte di progetti pilota civici relativi, ad esempio, ad ambiente, verde, servizi urbani, partecipazione, robotica e altri ambiti.

Comune, aziende, università, governi o altri soggetti eventualmente citati non devono essere considerati aderenti, finanziatori o partner finché non esiste una formalizzazione verificabile.

## Componenti software

- **Backend:** Express.js + MongoDB
- **Test:** Jest + Supertest
- **Dashboard/UI:** interfacce web
- **Gateway:** servizi di integrazione MyZubster
- **Mappe:** dataset GeoJSON e visualizzazione geografica
- **Simulatori e automazione:** componenti sperimentali
- **Payments/rewards:** flussi MYZ/XMR e altri componenti, simulati e/o in validazione a seconda dell'ambiente

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

Crea un `.env` appropriato per l'ambiente prima di avviare i servizi.

## Test e CI

```bash
npm test
npm run build --if-present
```

## Sicurezza

Prima di un deployment production devono essere verificati dipendenze, vulnerabilità, secret, variabili d'ambiente, health check, monitoring, backup/rollback e i flussi esterni utilizzati.

**Non inserire secret, seed, chiavi private, indirizzi privati o credenziali nei repository.**

## Licenza

MIT License. Vedi `LICENSE`.

## Nota

MyZubster è un progetto in evoluzione. La documentazione distingue le funzionalità operative dalle proposte, dagli esperimenti e dai componenti ancora in validazione.