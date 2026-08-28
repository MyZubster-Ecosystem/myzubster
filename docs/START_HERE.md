# START HERE — MyZubster

> Una guida semplice per capire **cos'è MyZubster, cosa puoi usare oggi e dove iniziare**.

## In 30 secondi

MyZubster è un ecosistema open-source che collega:

- orti e ambiente reale;
- osservazioni e dati;
- web, mobile e Google TV;
- personaggi e mondo digitale;
- Zorgax come assistente evidence-aware;
- GitHub come base open-source ed educativa;
- DAO, bounty e collaborazione comunitaria;
- ricerca, MRV e possibili pilot ambientali;
- Reflection Space come area culturale e di riflessione volontaria.

Non tutto è allo stesso livello di maturità. Alcune parti sono già implementate, altre sono in Draft PR, altre ancora sono solo documentate o in validazione.

## Prima regola: capire lo stato reale

Usiamo questi stati:

```text
CONCEPT
DOCUMENTED
IMPLEMENTED
CI_VERIFIED
DEVICE_VERIFIED
DEPLOYED
PRODUCTION_READY
ADOPTED
```

Un README non significa automaticamente che una funzione sia già disponibile in produzione.

---

# 1. Sono un utente

Se vuoi capire **cosa puoi fare con MyZubster**, parti da qui.

## Cosa puoi aspettarti

L'obiettivo dell'esperienza utente è permettere di:

- accedere al sito MyZubster;
- esplorare orti, osservazioni e contenuti ambientali;
- usare le superfici pubbliche già disponibili;
- in futuro collegare il proprio orto in modo autenticato;
- vedere il proprio orto su Google TV/Android TV;
- creare il proprio personaggio MyZubster;
- usare quel personaggio nelle esperienze digitali supportate;
- chiedere a Zorgax spiegazioni e supporto;
- accedere a contenuti educativi open-source;
- partecipare alle funzioni comunitarie disponibili.

## Cosa è importante sapere oggi

Il sito web è la parte più direttamente accessibile.

Le funzioni TV, garden live, character/metaverse e alcune nuove esperienze sono in vari livelli di implementazione e verifica. Prima di considerarle production-ready servono CI, sicurezza, ownership/auth e test su dispositivo reale dove richiesto.

## Se vuoi usare MyZubster TV

Consulta:

- `docs/MYZUBSTER_END_TO_END_SETUP.md`
- documentazione TV/garden live presente nelle Draft PR dedicate

Il percorso target è:

```text
account
  ↓
autenticazione
  ↓
proprio orto
  ↓
stream autorizzato
  ↓
MyZubster TV
```

Non usare credenziali permanenti della telecamera direttamente sul client TV.

## Se vuoi creare il tuo personaggio

Il personaggio è la tua persona digitale nell'ecosistema MyZubster.

Non è automaticamente:

- un wallet;
- un NFT;
- un'identità legale;
- un token governance.

Per il percorso completo consulta `docs/MYZUBSTER_END_TO_END_SETUP.md`.

## Se vuoi capire Zorgax

Consulta:

- `docs/ZORGAX_SYSTEM.md`
- la guida pratica Zorgax nella relativa Draft PR

Zorgax può aiutare ad analizzare, spiegare e documentare, ma non sostituisce automaticamente esperti scientifici, autorità umane o decisioni finanziarie.

---

# 2. Sono uno sviluppatore

Se vuoi contribuire al codice o capire l'architettura, parti da questi documenti:

1. `README.md`
2. `docs/ECOSYSTEM.md`
3. `docs/INFRASTRUCTURE_README.md`
4. `docs/MYZUBSTER_UNIFIED_CONCEPT.md`
5. `CONTRIBUTING.md`

## Architettura rapida

```text
Frontend / Clients
        ↓
Backend API
        ↓
MongoDB / domain services
        ↓
AI / automation / integrations
        ↓
GitHub CI + deployments + artifacts
```

Il repository contiene anche configurazione Docker per:

- MongoDB;
- backend;
- frontend;
- ai-automation;
- onion service.

Consulta `docs/INFRASTRUCTURE_README.md` per i confini reali e per distinguere sviluppo locale da produzione.

## Regola di sviluppo

```text
issue / problema verificato
   ↓
branch dedicato
   ↓
modifica minima
   ↓
Draft PR
   ↓
CI + security + review
   ↓
decisione umana di merge
```

Non usare force push e non inserire segreti nel repository.

## Test

Backend e frontend possono usare toolchain diverse.

Un test frontend React deve essere eseguito nel contesto frontend corretto, non raccolto accidentalmente dal runner Jest backend.

Quando una PR fallisce, controlla sempre se lo stesso errore esiste già su `main`.

## Sicurezza

Non leggere o pubblicare inutilmente:

- `.env`;
- token;
- password;
- private key;
- seed phrase;
- credenziali camera;
- dati personali non necessari.

I client non devono essere considerati confini di sicurezza affidabili per ownership, pagamenti o privilegi amministrativi.

---

# 3. Sono un partner, ricercatore o ente pubblico

Se vuoi capire **come MyZubster può essere usato in un pilot, progetto LIFE o collaborazione scientifica**, parti da:

- `docs/LIFE_2026_CALL_README.md`
- `docs/articles/devto/myzubster-life-2026-circular-water.md`
- `docs/MYZUBSTER_UNIFIED_CONCEPT.md`

## MyZubster può contribuire come layer digitale

Il concept punta a collegare:

```text
infrastruttura fisica
   ↓
sensori / osservazioni / dati operativi
   ↓
MyZubster data layer
   ↓
provenance + MRV
   ↓
validazione scientifica
   ↓
dashboard / reporting / replication
```

## Cosa non viene promesso

Non bisogna assumere automaticamente che:

- un ente citato sia già partner;
- un incontro significhi consorzio;
- un budget indicativo sia approvato;
- i KPI siano già validati;
- un dataset sia già disponibile;
- un pilot sia già finanziato;
- LIFE abbia già approvato il progetto.

Le collaborazioni reali devono essere confermate da evidenza esplicita.

## Se sei un partner scientifico

Le aree di collaborazione possibili includono:

- definizione baseline;
- metodologia MRV;
- qualità del dato;
- protocolli di misura;
- water quality;
- validazione indipendente;
- KPI ambientali;
- replication methodology.

AI/ChatGPT/Zorgax possono supportare analisi e sintesi, ma la validazione scientifica resta protocollo- e partner-based.

---

# 4. Sono interessato alla DAO

Consulta `docs/DAO_README.md`.

La DAO organizza proposte, discussione e voto.

```text
proposal
  ↓
draft
  ↓
active
  ↓
vote
  ↓
passed / rejected
  ↓
eventuale execution separata
```

`passed` non significa automaticamente `executed` o `paid`.

Zorgax ha ruolo consultivo non vincolante dove implementato.

---

# 5. Sono interessato alla Reflection Space

Consulta `docs/CHURCH_README.md`.

La Reflection Space è un concept culturale e comunitario, non una religione ufficiale.

Principio:

> Ognuno è libero di credere, non credere, esplorare tradizioni diverse o cambiare idea.

Il progetto non richiede una fede per partecipare.

---

# 6. Voglio imparare con GitHub

GitHub può essere usato come livello educativo open-source per:

- ambiente;
- sostenibilità;
- citizen science;
- MRV;
- programmazione;
- AI literacy;
- open source;
- cultura e storia delle religioni;
- etica e cittadinanza digitale.

Un percorso tipico può essere:

```text
README / lezione
   ↓
esercizio o osservazione reale
   ↓
contributo GitHub
   ↓
review
   ↓
apprendimento verificabile
```

Partecipare a GitHub non equivale automaticamente a ottenere una certificazione formale.

---

# 7. Voglio capire tutta l'infrastruttura

Leggi `docs/INFRASTRUCTURE_README.md`.

Copre:

- GitHub;
- frontend/backend;
- MongoDB;
- Docker;
- AI automation;
- Zorgax;
- Vercel;
- CI/CD;
- Android Beta;
- Google TV;
- garden streaming;
- auth/authz;
- DAO;
- pagamenti;
- Drive/IPFS;
- Tor/onion;
- backup;
- monitoring;
- dependency security.

---

# 8. Voglio capire tutto MyZubster in un unico documento

Leggi:

`docs/MYZUBSTER_UNIFIED_CONCEPT.md`

È la mappa unificata che collega:

```text
NATURA
  +
PERSONE
  +
OPEN KNOWLEDGE
  +
TECNOLOGIA
  +
AZIONE VERIFICABILE
```

---

# 9. Cosa significa “funziona”

Quando qualcuno dice che una funzione “funziona”, chiedi sempre **a quale livello**.

Esempio:

```text
DOCUMENTED
≠
IMPLEMENTED
≠
CI_VERIFIED
≠
DEPLOYED
≠
DEVICE_VERIFIED
≠
PRODUCTION_READY
```

Questa distinzione protegge utenti, sviluppatori e partner da aspettative sbagliate.

---

# 10. Dove iniziare davvero

## Utente

Parti dal sito MyZubster e dalle funzioni pubbliche effettivamente disponibili.

## Sviluppatore

Parti da `README.md`, `CONTRIBUTING.md`, `docs/ECOSYSTEM.md` e `docs/INFRASTRUCTURE_README.md`.

## Ricercatore / Partner

Parti da `docs/LIFE_2026_CALL_README.md` e dal concept circular-water/MRV.

## Vuoi capire il progetto in generale

Parti da `docs/MYZUBSTER_UNIFIED_CONCEPT.md`.

---

# Regola finale

**MyZubster va letto come un ecosistema in costruzione, con parti già operative, parti in verifica e parti ancora concettuali. La documentazione serve a rendere questi confini visibili, non a nasconderli.**
