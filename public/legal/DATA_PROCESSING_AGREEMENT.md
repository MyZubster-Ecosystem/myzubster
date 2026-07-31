# Data Processing Agreement (DPA)

**Version:** 1.0.0  
**Effective Date:** 2026-08-01  
**Contracting Parties:**  
- **Controller:** MyZubster S.r.l. (hereinafter "Controller"), with registered office at [Address], Italy, VAT [Number]  
- **Processor:** [Processor Name] (hereinafter "Processor"), with registered office at [Address]

---

## English Version

### 1. Processor Obligations

The Processor shall process Personal Data solely on documented instructions from the Controller, including with regard to transfers of Personal Data to third countries or international organisations, unless required to do so by Union or Member State law to which the Processor is subject. The Processor shall ensure that persons authorised to process the Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.

| Obligation | Description | MyZubster Context |
|------------|-------------|-------------------|
| **Purpose Limitation** | Process data only for documented Controller instructions | Arduino sensor readings, NFC pet tag IDs, XMR transaction hashes |
| **Data Minimisation** | Limit processing to what is necessary | Only essential location data for global plant map features |
| **Confidentiality** | Staff bound by confidentiality agreements | AI analysis teams, escrow operators, community moderators |
| **No Further Use** | Refrain from using data for own purposes | Prohibited use of plant/pet data for unrelated commercial profiling |
| **Assistance** | Assist Controller in ensuring security | Provide audit logs for AI verification and community voting systems |

### 2. Security

The Processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including as appropriate:

| Measure | Implementation | MyZubster Specifics |
|---------|----------------|---------------------|
| **Pseudonymisation & Encryption** | Pseudonymise Personal Data as soon as possible; encrypt at rest and in transit | XMR payment metadata pseudonymised; NFC tag IDs encrypted; Arduino telemetry encrypted via TLS |
| **Confidentiality & Integrity** | Ensure ongoing confidentiality, integrity, availability and resilience of processing systems | Italian VPS infrastructure with DDoS protection; escrow transaction logs with cryptographic hash-chaining |
| **Availability & Resilience** | Restore availability and access to Personal Data in a timely manner in the event of a physical or technical incident | Redundant Italian datacentre backups; smart garden sensor data replication |
| **Effectiveness Testing** | Regularly test, assess and evaluate the effectiveness of technical and organisational measures for ensuring the security of the processing | Annual penetration testing; quarterly vulnerability scans of Arduino API endpoints |
| **Secure Development** | Apply secure software development lifecycle to AI analysis and verification modules | Adversarial testing of plant identification algorithms; secure coding standards for escrow smart contracts |

### 3. Sub-processing

The Processor shall not engage another processor (hereinafter "Sub-Processor") without prior specific or general written authorisation of the Controller. In the case of general written authorisation, the Processor shall inform the Controller of any intended changes concerning the addition or replacement of Sub-Processors, giving the Controller the opportunity to object.

**Approved Sub-Processors for MyZubster Platform:**

| Sub-Processor | Services Provided | Data Categories | Location | Safeguard |
|---------------|-------------------|-----------------|----------|-----------|
| **Monero Node Operators** | XMR transaction verification | Pseudonymised wallet addresses, transaction hashes | EU / GDPR-adequate countries | SCCs / Standard Contractual Clauses |
| **Tari Blockchain Infrastructure** | NFT certificate minting for contributions | User public keys, contribution metadata | Global (distributed) | Pseudonymisation + encryption in transit |
| **NFC Tag Manufacturers** | NFC pet tag provisioning | Pet identification numbers, owner hashed IDs | EU | DPA with controller role |
| **Arduino Cloud Partner** | Smart garden sensor data ingestion | Soil moisture, temperature, light levels; geo-coordinates for plant map | EU | Encryption at rest and in transit |
| **Community Moderation AI** | Content verification for Seed Exchange P2P | Plant images, user-generated descriptions | EU | Data minimisation; deletion after 90 days |
| **Escrow Payment Processor** | XMR escrow transaction management | Escrow contract IDs, dispute flags | EU | Multi-sig wallet; no raw private key exposure |

### 4. Data Subject Rights

The Processor shall, taking into account the nature of the processing, assist the Controller by appropriate technical and organisational measures, insofar as is possible, for the fulfilment of the Controller's obligation to respond to requests for exercising the data subject's rights laid down in Chapter III of the GDPR.

| Right | Processor Assistance | MyZubster Implementation |
|-------|---------------------|--------------------------|
| **Right of Access** | Enable Controller to retrieve all data related to a data subject | Search across plant/pet profiles, XMR transaction history, AI analysis records, NFT certificates |
| **Right to Rectification** | Correct inaccurate data upon Controller instruction | Update incorrect species identification, pet tag registration data, geo-location on global map |
| **Right to Erasure ("Right to be Forgotten")** | Delete data across all systems including backups | Remove pet profiles, plant map markers, escrow records, blockchain references where technically feasible |
| **Right to Restrict Processing** | Flag records to prevent further processing | Suspend AI analysis on specific plants; freeze escrow dispute data |
| **Right to Data Portability** | Provide data in structured, commonly used, machine-readable format | Export garden sensor history, plant collection data, contribution certificates (JSON/CSV) |
| **Right to Object** | Cease processing upon Controller instruction | Stop AI-driven recommendations; halt community vote weighting |
| **Rights Related to Automated Decision-Making** | Provide logic and significance of AI/automated decisions | Explain plant identification confidence scores; escrow dispute resolution algorithm outputs |

**Special Considerations for MyZubster:**

- **Arduino Sensor Data:** Users may object to processing of soil/temperature data from their smart gardens. Processor shall immediately suspend data ingestion upon notification.
- **NFC Pet Tags:** Owners may request erasure of NFC tag associations. Processor shall invalidate tag IDs in the verification system.
- **XMR Escrow:** Pseudonymised transaction data may be retained for regulatory compliance (anti-money laundering) beyond standard erasure periods, in accordance with Italian and EU law.
- **Tari NFT Certificates:** On-chain data may be technically immutable; Processor shall assist Controller in rendering personal data pseudonymous or unreachable on the front-end layer.

### 5. Breaches

The Processor shall notify the Controller without undue delay and, where feasible, not later than 24 hours after having become aware of a Personal Data breach. Such notification shall be accompanied by a description of the nature of the breach, the categories and approximate number of data subjects concerned, the likely consequences, and the measures taken or proposed to be taken to address the breach.

| Breach Scenario | MyZubster-Specific Response |
|-----------------|------------------------------|
| **Arduino Sensor Database Breach** | Immediate containment; notify Controller within 1 hour; assess whether pet/plant owner identities compromised; advise on GDPR Article 33/34 notifications |
| **XMR Escrow Data Leak** | Audit smart contract logs; identify if wallet metadata or dispute data exposed; notify Italian Garante within 72 hours if personal data affected |
| **NFC Tag Database Compromise** | Revoke affected tag batch; notify pet owners; assess potential for pet theft facilitation |
| **AI Model Inversion Attack** | Halt model training; assess if training data contained personal identifiers; notify Controller and affected data subjects |
| **Community Moderation Breach** | Suspend automated moderation; manually review flagged content; assess if private messages or images leaked |

### 6. Audits

The Processor shall make available to the Controller all information necessary to demonstrate compliance with the obligations laid down in this Agreement and shall allow for and contribute to audits, including inspections, conducted by the Controller or another auditor mandated by the Controller.

| Audit Type | Frequency | MyZubster Scope |
|------------|-----------|-----------------|
| **Compliance Audit** | Annual | Review of data processing activities across all platform features (plant map, pet profiles, escrow, AI analysis) |
| **Security Audit** | Quarterly | Vulnerability assessment of Italian VPS, Arduino API, NFC verification endpoints |
| **Escrow Audit** | Per quarter / per significant transaction batch | Verification of XMR escrow smart contract integrity; reconciliation of escrow fund flows |
| **Data Retention Audit** | Semi-annual | Verification that plant/pet data, sensor data, and transaction logs are purged according to retention schedule |
| **Sub-Processor Audit** | Annual | Review of approved Sub-Processors' compliance (Monero nodes, Tari infrastructure, Arduino Cloud) |

**Audit Rights:**
- Controller may conduct audits with 30 days' notice
- Processor shall provide secure remote access to audit logs, including escrow transaction hashes, sensor ingestion logs, and AI model training metadata
- Processor shall bear no cost for compliance-related audits; cost-sharing may apply for third-party auditors in case of regulatory investigation

### 7. SCCs (Standard Contractual Clauses)

The Processor shall not transfer Personal Data to a third country or an international organisation unless specific conditions are met, including the conditions set out in the Standard Contractual Clauses adopted by the European Commission.

**Applicable SCC Module:** Module Two (Controller to Processor)

| SCC Annex | MyZubster Specific Data & Details |
|-----------|-----------------------------------|
| **Annex I.A** | **List of Parties:** MyZubster S.r.l. (Controller) and [Processor Name] (Processor) |
| **Annex I.B** | **Description of Transfer:** Transfer of pseudonymised plant/pet/sensor data to blockchain and distributed systems (Tari) and Monero node operators for payment verification |
| **Annex I.C** | **Competent Supervisory Authority:** Italian Data Protection Authority (Garante per la Protezione dei Dati Personali) |
| **Annex II** | **Technical and Organisational Measures:** Encryption at rest and in transit; pseudonymisation of XMR and NFT metadata; Italian VPS hosting; access controls; audit logging; breach notification within 24 hours |
| **Annex III** | **List of Sub-Processors:** Monero Node Operators, Tari Blockchain Infrastructure, NFC Tag Manufacturers, Arduino Cloud Partner, Community Moderation AI, Escrow Payment Processor |

**Supplementary Measures for High-Risk Transfers:**

1. **Monero (XMR) Transfers:** XMR transactions are pseudonymous by design. Personal data (if any) associated with escrow contracts is encrypted and stored on EU servers. Blockchain data is not considered personal data when properly pseudonymised.
2. **Tari NFT Transfers:** Contribution certificates contain no direct personal identifiers. User identity is linked via hashed references stored off-chain in the EU.
3. **Arduino Sensor Data:** Geo-coordinates for the global plant map are truncated to city-level precision to prevent identification of private residences.
4. **NFC Pet Tags:** Tag IDs are rotated annually; owner data stored separately from tag identifiers with encryption-at-rest.

---

## Versione Italiana

### 1. Obblighi del Responsabile del Trattamento

Il Responsabile del Trattamento tratta i Dati Personali esclusivamente sulla base di istruzioni documentate del Titolare del Trattamento, anche per quanto riguarda i trasferimenti di Dati Personali verso paesi terzi o organizzazioni internazionali, a meno che non sia tenuto a farlo per legge dell'Unione o di uno Stato membro alla quale è soggetto. Il Responsabile del Trattamento garantisce che le persone autorizzate a trattare i Dati Personali si siano impegnate alla riservatezza o siano soggette a un obbligo legale appropriato di riservatezza.

| Obbligo | Descrizione | Contesto MyZubster |
|---------|-------------|-------------------|
| **Limitazione delle Finalità** | Trattare i dati solo per istruzioni documentate del Titolare | Letture dei sensori Arduino, ID tag NFC animali, hash di transazioni XMR |
| **Minimizzazione dei Dati** | Limitare il trattamento a quanto necessario | Solo dati di localizzazione essenziali per le funzionalità della mappa globale delle piante |
| **Riservatezza** | Il personale è vincolato da accordi di riservatezza | Team di analisi AI, operatori escrow, moderatori comunitari |
| **Divieto di Utilizzo Proprio** | Astenersi dall'utilizzare i dati per propri fini | Divieto di profilazione commerciale non correlata dei dati di piante/animali |
| **Assistenza** | Assistere il Titolare nel garantire la sicurezza | Fornire log di audit per sistemi di verifica AI e votazione comunitaria |

### 2. Sicurezza

Il Responsabile del Trattamento mette in atto misure tecniche e organizzative adeguate per garantire un livello di sicurezza appropriato al rischio, incluso, se del caso:

| Misura | Implementazione | Specifiche MyZubster |
|---------|----------------|---------------------|
| **Pseudonimizzazione e Crittografia** | Pseudonimizzare i Dati Personali il prima possibile; crittografare a riposo e in transito | Metadati pagamenti XMR pseudonimizzati; ID tag NFC crittografati; telemetria Arduino crittografata via TLS |
| **Riservatezza e Integrità** | Garantire la riservatezza, integrità, disponibilità e resilienza continue dei sistemi di trattamento | Infrastruttura VPS italiana con protezione DDoS; log escrow con hash-chaining crittografica |
| **Disponibilità e Resilienza** | Ripristinare la disponibilità e l'accesso ai Dati Personali tempestivamente in caso di incidente fisico o tecnico | Backup ridondanti in datacentre italiani; replica dati sensori giardino intelligente |
| **Test di Efficacia** | Testare, valutare e verificare regolarmente l'efficacia delle misure tecniche e organizzative | Penetration testing annuale; scansioni trimestrali di vulnerabilità degli endpoint API Arduino |
| **Sviluppo Sicuro** | Applicare il ciclo di vita di sviluppo software sicuro ai moduli di analisi AI e verifica | Testing avversariale degli algoritmi di identificazione piante; standard di codifica sicura per smart contract escrow |

### 3. Sub-Responsabili del Trattamento

Il Responsabile del Trattamento non può affidare a un altro responsabile del trattamento (di seguito "Sub-Responsabile") il trattamento senza previa autorizzazione scritta specifica o generale del Titolare del Trattamento. In caso di autorizzazione scritta generale, il Responsabile del Trattamento informa il Titolare di qualsiasi modifica prevista riguardante l'aggiunta o la sostituzione di Sub-Responsabili, dando al Titolare la possibilità di opporsi.

**Sub-Responsabili Approvati per la Piattaforma MyZubster:**

| Sub-Responsabile | Servizi Forniti | Categorie di Dati | Localizzazione | Garanzia |
|-------------------|-----------------|-----------------|----------|-----------|
| **Operatori Nodo Monero** | Verifica transazioni XMR | Indirizzi wallet pseudonimizzati, hash transazioni | UE / paesi con adeguatezza GDPR | SCCs / Clausole Contrattuali Standard |
| **Infrastruttura Blockchain Tari** | Conio NFT certificati contributi | Chiavi pubbliche utente, metadati contributi | Globale (distribuito) | Pseudonimizzazione + crittografia in transito |
| **Produttori Tag NFC** | Provisioning tag NFC animali | Numeri identificativi animali, hash ID proprietari | UE | DPA con ruolo di titolare |
| **Partner Arduino Cloud** | Ingestione dati sensori giardino intelligente | Umidità suolo, temperatura, luce; coordinate geografiche per mappa piante | UE | Crittografia a riposo e in transito |
| **AI Moderazione Comunitaria** | Verifica contenuti Seed Exchange P2P | Immagini piante, descrizioni generate dagli utenti | UE | Minimizzazione dati; cancellazione dopo 90 giorni |
| **Processore Pagamenti Escrow** | Gestione transazioni escrow XMR | ID contratti escrow, flag dispute | UE | Multi-sig wallet; nessuna esposizione chiave privata grezza |

### 4. Diritti degli Interessati

Il Responsabile del Trattamento assiste, tenendo conto della natura del trattamento, il Titolare del Trattamento con misure tecniche e organizzative appropriate, per quanto possibile, per l'adempimento dell'obbligo del Titolare di rispondere alle richieste di esercizio dei diritti dell'interessato di cui al Capo III del GDPR.

| Diritto | Assistenza del Responsabile | Implementazione MyZubster |
|---------|----------------------------|---------------------------|
| **Diritto di Accesso** | Consentire al Titolare di recuperare tutti i dati relativi a un interessato | Ricerca tra profili piante/animali, storico transazioni XMR, registri analisi AI, certificati NFT |
| **Diritto di Rettifica** | Correggere dati inaccurati su istruzione del Titolare | Aggiornare identificazioni specie errate, dati registrazione tag animali, geolocalizzazione su mappa globale |
| **Diritto alla Cancellazione** | Cancellare dati su tutti i sistemi inclusi i backup | Rimuovere profili animali, indicatori mappa piante, registri escrow, riferimenti blockchain dove tecnicamente fattibile |
| **Diritto di Limitazione** | Contrassegnare i record per impedire ulteriore trattamento | Sospendere analisi AI su piante specifiche; congelare dati dispute escrow |
| **Diritto alla Portabilità** | Fornire dati in formato strutturato, di uso comune e leggibile da macchina | Esportare storico sensori giardino, dati collezione piante, certificati contributi (JSON/CSV) |
| **Diritto di Opposizione** | Cessare il trattamento su istruzione del Titolare | Interrompere raccomandazioni AI-driven; sospendere ponderazione voti comunitari |
| **Diritti relativi a Decisioni Automatizzate** | Fornire logica e significato di decisioni AI/automatizzate | Spiegare punteggi di confidenza identificazione piante; output algoritmi risoluzione dispute escrow |

**Considerazioni Speciali per MyZubster:**

- **Dati Sensori Arduino:** Gli utenti possono opporsi al trattamento dei dati suolo/temperatura dai loro giardini intelligenti. Il Responsabile sospenderà immediatamente l'ingestione dati alla notifica.
- **Tag NFC Animali:** I proprietari possono richiedere la cancellazione delle associazioni tag NFC. Il Responsabile invaliderà gli ID tag nel sistema di verifica.
- **Escrow XMR:** I dati di transazione pseudonimizzati possono essere conservati per conformità normativa (antiriciclaggio) oltre i periodi standard di cancellazione, in conformità con la legge italiana e UE.
- **Certificati NFT Tari:** I dati on-chain possono essere tecnicamente immutabili; il Responsabile assisterà il Titolare nel rendere i dati personali pseudonimi o non raggiungibili sul layer front-end.

### 5. Violazioni dei Dati Personali

Il Responsabile del Trattamento notifica al Titolare del Trattamento senza indebito ritardo e, ove possibile, entro e non oltre 24 ore dal momento in cui è venuto a conoscenza di una violazione dei Dati Personali. Tale notifica è accompagnata da una descrizione della natura della violazione, delle categorie e del numero approssimativo degli interessati interessati, delle conseguenze probabili e delle misure adottate o proposte per porre rimedio alla violazione.

| Scenario di Violazione | Risposta Specifica MyZubster |
|------------------------|------------------------------|
| **Violazione Database Sensori Arduino** | Contenimento immediato; notifica al Titolare entro 1 ora; valutare se identità proprietari piante/animali compromesse; consigliare su notifiche GDPR Articoli 33/34 |
| **Fuoriuscita Dati Escrow XMR** | Audit log smart contract; identificare se metadati wallet o dati dispute esposti; notificare Garante italiano entro 72 ore se interessati dati personali |
| **Compromissione Database Tag NFC** | Revocare lotto tag interessato; notificare proprietari animali; valutare potenziale facilitazione furto animali |
| **Attacco Inversione Modello AI** | Sospendere addestramento modello; valutare se dati addestramento contenevano identificatori personali; notificare Titolare e interessati |
| **Violazione Moderazione Comunitaria** | Sospendere moderazione automatizzata; revisione manuale contenuti flaggati; valutare se messaggi privati o immagini fuoriusciti |

### 6. Audit

Il Responsabile del Trattamento rende disponibili al Titolare del Trattamento tutte le informazioni necessarie per dimostrare la conformità agli obblighi previsti dal presente Accordo e consente e contribuisce a audit, inclusi ispezioni, condotti dal Titolare del Trattamento o da un altro revisore da questo incaricato.

| Tipo di Audit | Frequenza | Ambito MyZubster |
|---------------|-----------|-----------------|
| **Audit Conformità** | Annuale | Revisione delle attività di trattamento dati su tutte le funzionalità della piattaforma (mappa piante, profili animali, escrow, analisi AI) |
| **Audit Sicurezza** | Trimestrale | Valutazione vulnerabilità VPS italiano, API Arduino, endpoint verifica NFC |
| **Audit Escrow** | Per trimestre / per lotto transazioni significative | Verifica integrità smart contract escrow XMR; riconciliazione flussi fondi escrow |
| **Audit Conservazione Dati** | Semestrale | Verifica che dati piante/animali, dati sensori e log transazioni siano cancellati secondo il programma di conservazione |
| **Audit Sub-Responsabili** | Annuale | Revisione della conformità dei Sub-Responsabili approvati (nodi Monero, infrastruttura Tari, Arduino Cloud) |

**Diritti di Audit:**
- Il Titolare può condurre audit con 30 giorni di preavviso
- Il Responsabile fornirà accesso remoto sicuro ai log di audit, inclusi hash transazioni escrow, log ingestione sensori e metadati addestramento modelli AI
- Il Responsabile non sostiene costi per audit relativi alla conformità; la condivisione dei costi può applicarsi per revisori terzi in caso di indagine regolatoria

### 7. SCCs (Clausole Contrattuali Standard)

Il Responsabile del Trattamento non trasferisce Dati Personali a un paese terzo o a un'organizzazione internazionale a meno che non siano soddisfatte condizioni specifiche, incluse le condizioni stabilite nelle Clausole Contrattuali Standard adottate dalla Commissione Europea.

**Modulo SCC Applicabile:** Modulo Due (Titolare a Responsabile)

| Allegato SCC | Dati e Dettagli Specifici MyZubster |
|-------------|-------------------------------------|
| **Allegato I.A** | **Elenco delle Parti:** MyZubster S.r.l. (Titolare) e [Nome Responsabile] (Responsabile) |
| **Allegato I.B** | **Descrizione del Trasferimento:** Trasferimento di dati piante/animali/sensori pseudonimizzati verso sistemi blockchain e distribuiti (Tari) e operatori nodi Monero per verifica pagamenti |
| **Allegato I.C** | **Autorità di Controllo Competente:** Autorità Italiana per la Protezione dei Dati Personali (Garante) |
| **Allegato II** | **Misure Tecniche e Organizzative:** Crittografia a riposo e in transito; pseudonimizzazione metadati XMR e NFT; hosting VPS italiano; controlli accesso; logging audit; notifica violazioni entro 24 ore |
| **Allegato III** | **Elenco Sub-Responsabili:** Operatori Nodo Monero, Infrastruttura Blockchain Tari, Produttori Tag NFC, Partner Arduino Cloud, AI Moderazione Comunitaria, Processore Pagamenti Escrow |

**Misure Supplementari per Trasferimenti ad Alto Rischio:**

1. **Trasferimenti Monero (XMR):** Le transazioni XMR sono pseudonime per progettazione. Eventuali dati personali associati ai contratti escrow sono crittografati e archiviati su server UE. I dati blockchain non sono considerati dati personali se correttamente pseudonimizzati.
2. **Trasferimenti NFT Tari:** I certificati contributo non contengono identificatori personali diretti. L'identità utente è collegata tramite riferimenti hashed archiviati off-chain nell'UE.
3. **Dati Sensori Arduino:** Le coordinate geografiche per la mappa globale delle piante sono troncate alla precisione città per prevenire l'identificazione di residenze private.
4. **Tag NFC Animali:** Gli ID tag vengono ruotati annualmente; i dati proprietario sono archiviati separatamente dagli identificativi tag con crittografia a riposo.

---

**END OF DOCUMENT**
