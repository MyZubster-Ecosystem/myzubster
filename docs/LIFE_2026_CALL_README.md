# MyZubster LIFE 2026 — Call README

> Documento operativo per incontri esplorativi sul concept MyZubster LIFE 2026. Le organizzazioni citate come interlocutori o possibili ruoli non sono da considerarsi partner, beneficiari o membri confermati del consorzio senza accordo esplicito e documentato.

## Obiettivo della call

Spiegare MyZubster in pochi minuti e capire se esiste un fit concreto per un pilot LIFE 2026 su **acqua circolare, qualità dell'acqua, MRV, interoperabilità e validazione scientifica**.

L'obiettivo non è ottenere un impegno immediato, ma uscire dalla call con una risposta chiara a questa domanda:

> **Quale parte scientifica, sperimentale o infrastrutturale del pilot potrebbe essere validata o guidata dall'interlocutore?**

## Pitch in 3 minuti

### 1. Problema

I progetti ambientali producono dati da sensori, laboratori, impianti, utility e territori, ma spesso questi dati restano frammentati.

Il problema non è solo raccogliere più dati: è trasformarli in evidenza **tracciabile, interoperabile, scientificamente valida e replicabile**.

### 2. Proposta MyZubster

MyZubster propone un'infrastruttura digitale open-source che colleghi:

```text
infrastruttura reale
  → sensori / dati operativi
  → data layer MyZubster
  → MRV
  → validazione scientifica
  → dashboard / decision support
  → impatto ambientale verificabile
  → replication kit
```

### 3. Primo caso d'uso

Il concept parte dal **riuso dell'acqua**:

```text
trattamento
  → verifica qualità
  → disponibilità
  → riuso
  → beneficio ambientale verificato
```

Il pilot deve essere definito con partner scientifici e infrastrutturali reali; non viene considerato già approvato o già operativo.

## Cosa porta MyZubster

MyZubster può contribuire come layer digitale con:

- interoperabilità e API;
- integrazione IoT e dati ambientali;
- geospatial layers;
- provenance dell'evidenza;
- workflow MRV;
- dashboard e decision support;
- componenti open-source;
- strumenti di replica e documentazione tecnica.

MyZubster non sostituisce il metodo scientifico, il laboratorio, l'utility o l'autorità pubblica.

## Cosa chiedere al partner scientifico

Domande utili:

1. Quali parametri di qualità dell'acqua sono davvero significativi per il pilot?
2. Quale baseline scientifica dovrebbe essere definita prima della sperimentazione?
3. Quali sensori o analisi di laboratorio sono necessari?
4. Quali dati possono essere considerati affidabili e con quale frequenza?
5. Come dovrebbe essere validato un indicatore MRV?
6. Quali KPI ambientali sono scientificamente difendibili?
7. Quali errori, incertezze o limiti metodologici devono essere tracciati?
8. Quale parte del protocollo potrebbe essere guidata direttamente dal partner?
9. Quali dataset o impianti sarebbero necessari per una dimostrazione reale?
10. Quali elementi mancano oggi per rendere il concept candidabile a LIFE?

## Possibile ruolo di Terra&AcquaTech

Per un interlocutore con competenze su acqua, ambiente e sperimentazione, il fit da esplorare è:

- progettazione sperimentale;
- monitoraggio della qualità dell'acqua;
- metodologie per riuso e circular water;
- valutazione della qualità dei dati;
- validazione di sensori e misure;
- definizione di KPI e protocollo MRV;
- contributo scientifico a pilot e replicabilità.

**Stato:** interlocuzione esplorativa. Questo README non attribuisce alcun ruolo formale a Terra&AcquaTech.

## Possibile ruolo di CNR-ISOF

Per un interlocutore con competenze scientifiche e analitiche, il fit da esplorare è:

- water quality e parametri chimico-fisici;
- validazione scientifica del protocollo;
- metodi di misura e controllo qualità;
- affidabilità e interpretazione dei dati;
- baseline e KPI;
- validazione indipendente di evidenze MRV;
- contributo alla definizione scientifica del pilot.

**Stato:** interlocuzione esplorativa. Questo README non attribuisce alcun ruolo formale a CNR-ISOF.

## Ruoli che il consorzio dovrebbe coprire

Un concept LIFE credibile richiede ruoli complementari.

### Autorità pubblica / coordinamento territoriale

Possibili responsabilità:

- governance;
- policy integration;
- stakeholder engagement;
- dimostrazione territoriale;
- replicazione.

### Partner scientifico

Possibili responsabilità:

- baseline;
- indicatori;
- metodologia MRV;
- data quality;
- impact assessment;
- protocolli di validazione.

### Partner tecnico water reuse

Possibili responsabilità:

- riuso dell'acqua;
- sensori;
- water quality;
- processo fisico;
- metodologie tecniche.

### Utility / infrastruttura dimostrativa

Possibili responsabilità:

- impianto reale;
- accesso a dati operativi;
- sensori;
- condizioni di test;
- scalabilità industriale.

### MyZubster

Possibili responsabilità:

- digital architecture;
- interoperabilità;
- data layer;
- provenance;
- MRV software;
- dashboard;
- replication kit.

## Digital Environmental Passport — concetto

Una possibile unità digitale per il riuso dell'acqua potrebbe collegare:

```json
{
  "origin": "source / treatment facility",
  "timestamp": "measurement time",
  "quality": "validated parameters",
  "quantity": "verified volume",
  "destination": "reuse destination",
  "location": "geospatial reference",
  "measurementSource": "sensor / laboratory / operational system",
  "indicators": {
    "primaryWaterSaved": "to be scientifically defined",
    "energy": "to be defined",
    "co2Equivalent": "to be defined"
  },
  "evidence": "linked MRV records"
}
```

I campi e gli indicatori definitivi devono essere stabiliti e validati con i partner competenti. Non sono KPI già approvati.

## MRV: cosa deve essere dimostrabile

Un record MRV utile dovrebbe permettere di ricostruire almeno:

- origine del dato;
- timestamp;
- luogo o contesto pertinente;
- strumento o fonte della misura;
- valore e unità;
- qualità/incertezza della misura;
- eventuale analisi di laboratorio;
- trasformazioni applicate al dato;
- indicatore ambientale risultante;
- evidenza di validazione.

## Cosa mostrare durante la call

Non serve una demo lunga. Mostrare solo ciò che aiuta la discussione:

1. repository GitHub e natura open-source;
2. architettura dati → evidence → MRV → validation;
3. esempio di garden/environmental monitoring;
4. idea di Digital Environmental Passport;
5. come i dati potrebbero essere esposti via API/dashboard;
6. replication kit come output trasferibile.

Evitare di presentare TV, DAO, personaggi o altri verticali come centro della proposta LIFE se non sono direttamente utili alla discussione scientifica.

## Domande che MyZubster deve riuscire a rispondere

Durante la call potrebbero chiedere:

### "Cosa è già pronto?"

Risposta corretta:

MyZubster è un ecosistema open-source in sviluppo e validazione. Esistono componenti web, API, workflow di osservazione/evidence e prototipi verticali, ma il pilot LIFE completo non è production-ready né già approvato.

### "Dove sono i dati?"

Il pilot dovrebbe integrare dati reali messi a disposizione dai partner autorizzati. Non bisogna promettere dataset che non sono ancora disponibili.

### "Chi valida scientificamente?"

Questo è precisamente uno dei ruoli da costruire con il partner scientifico; MyZubster non deve auto-validare i propri KPI scientifici.

### "Chi gestisce l'impianto?"

Serve un partner infrastrutturale/utility reale. Il software non sostituisce il gestore dell'infrastruttura.

### "Qual è il budget?"

Non usare un importo come se fosse già approvato. Il budget deve essere costruito bottom-up sui work package, partner, costi eleggibili e call ufficiale applicabile.

### "Chi è già partner?"

Rispondere solo con ruoli formalmente confermati. Una call, email o manifestazione di interesse non equivale a partnership.

## Output desiderato dalla call

Una call è utile se produce almeno uno di questi risultati verificabili:

- interesse a un secondo confronto tecnico;
- identificazione di un responsabile scientifico;
- lista di parametri/KPI da approfondire;
- disponibilità a valutare un pilot;
- identificazione di dataset o infrastrutture potenzialmente rilevanti;
- richiesta di concept note;
- introduzione a un'altra organizzazione pertinente;
- chiara indicazione di non-fit, utile a evitare lavoro inutile.

## Note da prendere durante la call

```text
Organizzazione:
Data:
Partecipanti:

Problema che considerano prioritario:

Possibile ruolo:

Competenze / infrastrutture disponibili:

Dataset potenzialmente disponibili:

Parametri acqua suggeriti:

KPI suggeriti:

Vincoli scientifici / regolatori:

Dubbi o rischi:

Cosa chiedono a MyZubster:

Next step:

Owner del next step:

Data target:
```

## Checklist post-call

- [ ] separare fatti da ipotesi;
- [ ] registrare solo ruoli realmente discussi;
- [ ] non chiamare nessuno "partner" senza conferma;
- [ ] annotare eventuali fonti o documenti ufficiali ricevuti;
- [ ] aggiornare il concept solo con evidenza sufficiente;
- [ ] definire un prossimo passo concreto;
- [ ] evitare budget/KPI/scadenze inventate;
- [ ] se viene proposto un pilot, definire chi fornisce dati, chi valida e chi gestisce l'infrastruttura.

## One-line pitch

> **MyZubster vuole trasformare dati ambientali frammentati in evidenza scientificamente validabile e replicabile, partendo da un pilot LIFE sull'acqua circolare.**

## Definition of a productive first meeting

La prima call è riuscita quando non produce una "partnership" di facciata, ma una comprensione verificabile di:

```text
problema reale
  + ruolo possibile dell'interlocutore
  + dati/infrastruttura necessari
  + metodologia da validare
  + next step concreto
```

## Riferimento

Il concept pubblico più ampio è documentato in:

`docs/articles/devto/myzubster-life-2026-circular-water.md`

---

**Evidence boundary:** questo documento è una guida di preparazione e discovery. Non prova consortium membership, eligibility, finanziamento, approvazione LIFE, budget, KPI definitivi o disponibilità di infrastrutture/dataset.