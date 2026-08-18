# MyZubster — PA / Stato: roadmap di integrazione

## Obiettivo

Costruire un proof-of-concept indipendente che dimostri interoperabilità, resilienza e continuità di servizio usando esclusivamente dati/API pubblici o ambienti di test autorizzati della PA. Il progetto **non sostituisce PDND, PSN o i requisiti ACN/AgID** e non presume alcuna integrazione ufficiale con una PA.

## Allineamento architetturale

- PDND: trattare le API/e-service della PA come fonte istituzionale quando autorizzato.
- Cloud/PA: progettare con classificazione dei dati, sicurezza, portabilità, resilienza e continuità operativa.
- PSN/cloud qualificato: considerarlo come possibile ambiente istituzionale, non come sostituto della nostra architettura di test.
- Onion/distribuzione: usarla come livello sperimentale di resilienza e disponibilità, con nodi indipendenti e observer multipli.

## Fase A — Open Data / sandbox

- [ ] Selezionare un dataset pubblico del Comune di Rimini senza dati personali.
- [ ] Identificare fonte ufficiale, licenza, formato e API.
- [ ] Implementare importer read-only.
- [ ] Conservare provenance e timestamp.
- [ ] Calcolare hash dei payload importati.
- [ ] Validare schema e gestione degli errori.

## Fase B — Gateway MyZubster

- [ ] Esporre un'API interna stabile.
- [ ] Implementare cache con TTL e invalidazione controllata.
- [ ] Separare fonte ufficiale, cache e replica.
- [ ] Aggiungere audit log senza dati personali non necessari.
- [ ] Implementare health endpoint e metriche.

## Fase C — Distribuzione

- [ ] Deploy Node A su host dedicato.
- [ ] Deploy Node B su host/rete indipendente.
- [ ] Deploy Node C su host/rete indipendente.
- [ ] Mantenere identità Onion separate e persistenti.
- [ ] Discovery con record firmati, expiry e sequence.
- [ ] Observer da almeno due reti indipendenti.
- [ ] Health scoring senza dedurre un outage globale da un singolo observer.

## Fase D — Failover e resilienza

- [ ] Rilevare degrado di un nodo.
- [ ] Quarantena temporanea.
- [ ] Selezione automatica di un candidato sano.
- [ ] Bounded retry + exponential backoff + jitter.
- [ ] Test Node A down -> servizio disponibile via B/C.
- [ ] Recovery e reintegro di A.
- [ ] Test di carico controllato e rate limiting.

## Fase E — Interoperabilità PA / PDND

**Solo con autorizzazione e usando ambienti/dati appropriati.**

- [ ] Studiare l'e-service/API target.
- [ ] Definire attore fruitore/erogatore e responsabilità.
- [ ] Verificare autenticazione/autorizzazione richieste.
- [ ] Definire data classification e DPIA/privacy assessment quando applicabile.
- [ ] Integrare esclusivamente tramite pattern/API conformi alle linee guida applicabili.
- [ ] Testare prima in ambiente di test/sandbox.
- [ ] Registrare evidenze, audit e risultati.

## Fase F — Cloud PA / ACN / PSN assessment

- [ ] Classificare dati e servizio: ordinario/critico/strategico secondo il modello applicabile.
- [ ] Mappare requisiti di sicurezza, affidabilità, performance, scalabilità e portabilità.
- [ ] Valutare eventuale uso di cloud qualificato/PSN.
- [ ] Definire RTO/RPO e disaster recovery.
- [ ] Definire logging, monitoring, incident response e gestione delle chiavi.
- [ ] Verificare requisiti contrattuali, organizzativi e di procurement prima di un pilot istituzionale.
- [ ] Security review indipendente prima di qualsiasi uso con dati o servizi reali della PA.

## Fase G — Pilot istituzionale

- [ ] Preparare technical brief.
- [ ] Preparare threat model.
- [ ] Preparare architecture/data-flow diagram.
- [ ] Preparare test plan e acceptance criteria.
- [ ] Presentare il PoC all'ente interessato.
- [ ] Ottenere autorizzazioni formali e definire ruoli/responsabilità.
- [ ] Eseguire pilot limitato e monitorato.
- [ ] Pubblicare risultati e limiti del test.

## Gate obbligatori

### Gate 1 — tecnico

Nessuna integrazione istituzionale finché Node A non è realmente deployato e verificabile.

### Gate 2 — sicurezza

Nessun dato personale, critico o strategico nel PoC senza classificazione, autorizzazione e assessment appropriati.

### Gate 3 — interoperabilità

Nessun collegamento a sistemi PA reali senza autorizzazione dell'ente e rispetto dei meccanismi istituzionali applicabili.

### Gate 4 — produzione

Il PoC non viene descritto come servizio PA, certificato o integrato ufficialmente finché non esiste una validazione formale.

## Milestone

- **PA-1:** Open Data demo funzionante.
- **PA-2:** Gateway distribuito A/B/C.
- **PA-3:** Failover dimostrato da observer indipendenti.
- **PA-4:** Technical brief + threat model + compliance mapping.
- **PA-5:** Eventuale sandbox/test autorizzato.
- **PA-6:** Eventuale pilot istituzionale.

## Fonti istituzionali da verificare prima di ogni integrazione

- Piano Triennale per l'informatica nella PA / PDND.
- Strategia Cloud Italia.
- Regolamento ACN per infrastrutture e servizi cloud PA.
- Linee guida AgID/ACN applicabili.
- Documentazione ufficiale dell'ente proprietario dell'API/dataset.

## Stato iniziale

La roadmap è uno **strumento di pianificazione tecnica**. Nessuna integrazione ufficiale con Comune di Rimini, PDND, ACN o PSN è dichiarata come già attiva.
