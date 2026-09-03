# MyZubster × CSMT — call brief

**Data:** 4 settembre 2026, 10:30–11:00 (Europe/Rome)  
**Stato:** confronto esplorativo, nessuna partnership o candidatura LIFE formalmente confermata.

## Obiettivo della call

Capire se il percorso MyZubster può essere trasformato in una roadmap credibile verso LIFE 2027, con particolare attenzione a:

- Project Funding e impostazione della candidatura;
- Monitoring, Reporting and Verification (MRV);
- qualità e verificabilità delle evidenze dei pilot;
- ruoli necessari nel consorzio;
- replicabilità e piano di maturazione fino alla call 2027.

La call deve terminare con uno dei due esiti:

1. **NEXT STEP verificabile** — attività, responsabile, scadenza e criterio di verifica;
2. **NO-GO motivato** — motivazione e condizioni necessarie per riaprire il confronto.

## Partecipanti / interlocutori previsti

- MyZubster — soggetto promotore;
- Nicola — pilot interno / caso operativo;
- CSMT Innovation Hub / area Project Funding;
- Licia Zagni;
- Alberto Bonetti;
- Fahad Anwar.

I nomi sono riportati unicamente per preparare l'incontro già confermato; non implicano ruoli formali nel progetto.

## Truth boundary da mantenere

- `formalPartnerCount = 0`;
- nessun coordinatore LIFE formalmente confermato;
- CSMT è `IN_DISCUSSION`, non partner;
- CRPA è `IN_DISCUSSION`, con confronto operativo previsto l'8 settembre;
- il contatto Università Niccolò Cusano / LCA-LCSA resta `IN_DISCUSSION` finché non è registrato un esito verificabile della call;
- i pilot candidati e gli interlocutori scientifici non devono essere descritti come membri del consorzio senza conferma esplicita;
- nessun riferimento a finanziamento, endorsement UE/CINEA o approvazione LIFE può essere fatto senza evidenza formale.

## Stato del pilot Nicola

### Evidenza tecnica già verificabile

Repository operativo: `nicolaususnicola-lgtm/myzubster-mvp`.

- PR #1 — **Verify observation creation, persistence and retrieval**: merged. Verifica creazione osservazione, risposta HTTP 201, persistenza e rilettura via API con test end-to-end isolato.
- PR #2 — **Add reproducible Docker setup for local development**: merged. Aggiunge Docker/Compose, volume persistente, health check e verifica CI di avvio, POST 201 e rilettura dopo avvio del container.

Queste evidenze dimostrano riproducibilità tecnica di base, non readiness di produzione né risultati ambientali.

### Validazione prodotto / operativa

- Nicola ha scelto **Project Planner per lavorare con AI/Zorgax** come opzione da testare;
- il test di 7 giorni risulta **avviato**;
- le evidenze di intervista della PR #862 restano `NEEDS_CLARIFICATION` finché non vengono completati Persona D, distinzione Persona C/B e chiarimenti su Persona A;
- la scelta personale di Nicola non sostituisce le evidenze mancanti delle interviste.

## Domande da porre a CSMT

1. **Go/no-go LIFE 2027:** quali prerequisiti minimi mancano oggi per considerare il concept candidabile?
2. **Coordinatore:** quale profilo di organizzazione dovrebbe assumere il coordinamento e con quali capacità documentabili?
3. **Partner:** quali 3–5 ruoli sono indispensabili nel consorzio prima di espandere ulteriormente la rete?
4. **MRV:** quali baseline, KPI, fonti dati e procedure di verifica devono essere raccolti già nei pilot 2026–2027?
5. **Pilot readiness:** quali elementi distinguono un MVP tecnico interessante da un pilot LIFE credibile e finanziabile?
6. **Replicabilità:** quali evidenze servono per dimostrare che il modello è trasferibile ad altri territori/organizzazioni?
7. **Roadmap:** quali milestone suggerisce CSMT da settembre 2026 alla preparazione della call 2027?

## Proposta di agenda (30 minuti)

- **10:30–10:33** — obiettivo, truth boundary e stato attuale;
- **10:33–10:38** — MyZubster: Build → Validate → Connect → Measure → Verify → Replicate → Expand;
- **10:38–10:44** — evidenze del pilot Nicola e limiti attuali;
- **10:44–10:51** — MRV, baseline, KPI e requisiti di verificabilità;
- **10:51–10:56** — coordinatore, partner e roadmap LIFE 2027;
- **10:56–11:00** — decisione, responsabile, scadenza, criterio di verifica.

## Output da verbalizzare

Compilare prima di chiudere la call:

- **Decisione:** GO / GO CON CONDIZIONI / NO-GO;
- **Prossima azione:**
- **Responsabile:**
- **Scadenza:**
- **Evidenza richiesta per considerarla completata:**
- **Ruoli ancora scoperti:**
- **Dati/MRV da raccogliere:**
- **Follow-up con CSMT:** sì/no + data proposta;

## Cose da non fare durante la call

- non presentare interlocutori come partner confermati;
- non promettere budget, finanziamenti o compensi;
- non descrivere il pilot Nicola come risultato ambientale LIFE già validato;
- non confondere il test del Project Planner con evidenza scientifica o MRV;
- non usare acronimi senza definirli; privilegiare termini estesi e linguaggio da progettazione europea.
