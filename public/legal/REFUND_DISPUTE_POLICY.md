# REFUND & DISPUTE POLICY

**Version:** 1.0.0  
**Effective Date:** 2026-08-01  
**Platform:** MyZubster – Plant / Pet / Smart Garden Ecosystem  
**Jurisdiction:** Italy (EU), GDPR Compliant

---

## English Version

### 1. Eligibility

1.1. This Refund & Dispute Policy ("Policy") applies to all transactions conducted on the MyZubster platform, including purchases of physical goods (seeds, NFC pet tags, Arduino sensor kits), digital services (Global Plant Map access, Seed Exchange P2P matching), and NFT contribution certificates (Tari blockchain), paid in Monero (XMR) via escrow smart contract.

1.2. **Eligible Disputants:** Any registered MyZubster user who has (a) completed payment through the platform's XMR escrow system, (b) received a transaction confirmation hash on the Monero blockchain, and (c) not previously waived dispute rights for the specific transaction type per Section 1.4.

1.3. **Dispute Window:** Disputes must be initiated within 14 calendar days of:
- Expected delivery date for physical goods (seeds, NFC tags, Arduino hardware);
- Service completion date for digital services (map data access, P2P seed matching);
- NFT certificate issuance timestamp on the Tari blockchain.

1.4. **Non-Refundable Items & Waivers:**
- Tari blockchain NFT contribution certificates (instantaneous digital delivery, Art. 16(c) Consumer Rights Directive (EU) 2011/83);
- Digital map-access subscriptions activated upon XMR escrow release;
- Biological products (seeds, live plants) after shipment, per EU consumer-goods directives and phytosanitary Regulation (EU) 2016/2031;
- Custom AI analysis reports generated per user-specific sensor data.

1.5. **Refund Eligibility Matrix:**

| Scenario | Refund Type | Condition |
|----------|-------------|-----------|
| Item not received (tracking gap > 7 days) | Full escrow release to Buyer | Verified by AI sensor log analysis |
| Counterfeit NFC pet tag (hash mismatch) | Full escrow release to Buyer | Verified by NFC authentication protocol |
| Defective Arduino sensor (firmware error) | Full escrow release to Buyer | Verified by AI diagnostic logs |
| Minor species variance in plant delivery | Partial escrow release (50–80%) | Community vote majority + AI image analysis |
| Incomplete NFT metadata (Tari hash error) | Partial escrow release (50%) | Verified by Tari node consensus |
| Buyer change of mind (within 14-day window) | Full escrow release minus 30 EUR admin fee | Unless waived per Section 1.4 |
| Force majeure (customs seizure, XMR fork) | Case-by-case escrow arbitration | Verified by independent arbiter |

### 2. Dispute Process

2.1. **Initiation:** The Buyer must file a dispute via the MyZubster in-app dispute form, attaching:
- XMR transaction hash from the Monero blockchain;
- Escrow contract address and transaction ID;
- Evidence specific to the dispute type:
  - **IoT/NFC:** NFC tag read logs, Arduino sensor data exports, timestamps;
  - **Seed Exchange:** P2P chat logs, seed variety documentation, germination test photos;
  - **NFT/Tari:** Tari transaction hash, NFT metadata URL, contribution certificate ID;
  - **Map Data:** Geo-tagged plant/pet photos, community vote records, AI analysis report links.

2.2. **AI Triage (Tier 1):** Within 24 hours of filing, MyZubster's AI system analyzes submitted evidence:
- NFC tag authenticity via cryptographic signature verification;
- Arduino sensor data integrity via checksum and timestamp validation;
- Seed Exchange P2P matching accuracy via image recognition;
- NFT metadata completeness via Tari blockchain explorer queries;
- Global Plant Map contribution validity via geolocation hash verification.

2.3. **Community Jury (Tier 2):** If AI triage yields inconclusive results (< 70% confidence), the dispute is forwarded to a community jury of 7 randomly selected, reputation-scored users (minimum 3 successful prior trades, minimum reputation score 0.75). The jury has 72 hours to review evidence and vote. A simple majority (4/7) determines the outcome.

2.4. **Technical Escrow Hold:** During the dispute process, the escrowed XMR remains locked in the non-custodial smart contract. No party may unilaterally release funds. MyZubster does not hold or control the escrowed XMR at any point.

2.5. **Seller Response Window:** Sellers have 48 hours to submit counter-evidence via the in-app portal. Failure to respond results in default judgment in favor of the Buyer, subject to Section 1.4 waivers.

### 3. Escrow Intervention

3.1. **Automatic Release Triggers (No Dispute Filed):**
- Buyer delivery confirmation via NFC tag scan, Arduino sensor data upload, or tracking scan;
- 14 calendar days after escrow lock, provided no dispute is filed.

3.2. **Partial Release by Agreement:** If Buyer and Seller mutually agree on a partial refund or alternative resolution (e.g., replacement NFC tag, reseeded plant), they may jointly request partial escrow release via the in-app mediation portal. MyZubster verifies mutual consent through multi-signature escrow contract.

3.3. **Technical Intervention:** MyZubster may intervene technically in the escrow contract only to:
- Freeze funds pending arbitration (Tier 3 escalation);
- Release funds per AI/community/arbiter decision;
- Return funds to original XMR addresses in case of contract invalidity (e.g., XMR network fork resolution).

3.4. **Escrow Non-Custody Declaration:** MyZubster does not hold, custody, or have access to escrowed XMR. The escrow smart contract is deployed on the Monero blockchain as a non-custodial protocol. MyZubster acts solely as a technical facilitator and cannot reverse, redirect, or intercept escrowed funds.

3.5. **XMR Network Events:** In the event of a Monero network fork, consensus change, or protocol upgrade affecting escrow contract functionality, the parties agree to be bound by the chain recognized as valid by the majority of hashrate. Escrowed funds are automatically migrated to the canonical chain without liability to MyZubster.

### 4. Escalation

4.1. **Tier 3 Independent Arbiter:** If either party rejects the community jury decision (Tier 2), either may request escalation to an independent arbiter within 24 hours of the jury verdict. The arbiter is appointed by MyZubster from a pool of EU-licensed legal professionals specializing in e-commerce, blockchain, and GDPR.

4.2. **Arbiter Authority:** The independent arbiter has binding authority to:
- Order full, partial, or denied refund from escrow;
- Mandate specific performance (replacement of defective NFC/Arduino hardware);
- Award administrative fees to the prevailing party;
- Issue guidance on future platform policy interpretations.

4.3. **Arbiter Procedure:**
- Review of complete evidence dossier (AI triage report, community jury votes, party submissions);
- Optional hearing via video conference (max 30 minutes per party);
- Written reasoned decision within 10 business days of appointment;
- Decision executed via automated smart contract call by MyZubster technical staff.

4.4. **Costs:** Tier 3 arbitration costs are borne by the losing party, capped at 100 EUR (or equivalent XMR at time of dispute filing). If the arbiter finds both parties partially at fault, costs are apportioned proportionally.

4.5. **Finality:** The arbiter's decision is final and binding. Parties waive any right to judicial recourse except for challenges based on arbiter bias, procedural fraud, or violation of mandatory Italian/EU consumer protection law, to be brought before the Courts of Milan, Italy.

### 5. Timelines

5.1. **Standard Resolution Timeline:**

| Stage | Duration | Outcome |
|-------|----------|---------|
| Dispute filing | Day 0 | Case opened, escrow frozen |
| AI triage | Day 1 | Decision or forward to community jury |
| Community jury (if required) | Days 2–4 | Majority decision |
| Seller response | Days 0–2 | Counter-evidence submission |
| Arbiter escalation (if requested) | Days 5–15 | Binding decision |
| Escrow execution | Within 24 hours of final decision | Funds released to designated XMR address |

5.2. **Expedited Timeline (High-Value / Urgent Cases):** For disputes involving:
- Perishable biological products (seeds, live plants) with imminent expiration;
- NFC/Arduino hardware critical for pet safety or garden automation;
- XMR escrow value exceeding 5,000 EUR equivalent;
The AI triage decision is rendered within 4 hours, and community jury deliberation is compressed to 24 hours.

5.3. **Delays Not Imputable to MyZubster:** The following delays extend the standard timeline without liability to MyZubster:
- Seller failure to provide counter-evidence within 48 hours;
- Blockchain congestion delaying escrow contract execution (> 2 hours for Monero confirmation);
- Tari node synchronization delays affecting NFT metadata verification;
- Force majeure events (natural disasters, XMR network-wide outages, regulatory lockdowns).

5.4. **GDPR Data Subject Requests:** Requests for erasure, portability, or access to dispute-related personal data are handled in parallel per the MyZubster Privacy Policy, with a target response time of 30 days from verified request receipt.

### 6. Governing Law

6.1. **Applicable Law:** This Policy and all disputes arising therefrom are governed by Italian law, specifically:
- Italian Civil Code (Codice Civile) Articles 1766–1786 (mandate, deposit, and escrow);
- Italian Consumer Code (Codice del Consumo, D.Lgs. 206/2005);
- EU Consumer Rights Directive (EU) 2011/83;
- EU Payment Services Directive 2 (PSD2, EU) 2015/2366 (to the extent applicable to technical escrow services);
- EU General Data Protection Regulation (GDPR) (Regulation (EU) 2016/679);
- Italian Data Protection Code (D.Lgs. 196/2003 as amended by D.Lgs. 101/2018).

6.2. **Jurisdiction:** All disputes not resolved through the internal arbitration process (Sections 2–4) are subject to the exclusive jurisdiction of the Courts of Milan, Italy. Users waive any objection to personal jurisdiction or venue in Milan.

6.3. **Arbitration Clause:** Where permissible under Italian and EU law, parties may elect to resolve disputes through expedited arbitration before the Milan Chamber of Arbitration (Camera Arbitrale di Milano), under its then-current rules. The arbitration language is English, with certified Italian translation available upon request at the requesting party's expense.

6.4. **Consumer Protection Override:** Nothing in this Policy limits the statutory rights of EU consumers under mandatory applicable law, including the 14-day withdrawal right under the Consumer Rights Directive (EU) 2011/83, except where expressly waived per Section 1.4 for instantaneous digital services.

6.5. **Severability:** If any provision of this Policy is found to be invalid or unenforceable under Italian or EU law, the remaining provisions shall remain in full force and effect, and the invalid provision shall be replaced by a valid provision that most closely reflects the original intent.

6.6. **Language:** In the event of inconsistency between the English and Italian versions of this Policy, the English version shall prevail for all transactions involving non-Italian users, while the Italian version shall prevail for transactions where the Buyer is an Italian resident or where Italian consumer law expressly requires Italian-language documentation.

---

##

---

## Versione Italiana

### 1. Ammissibilità

1.1. La presente Politica di Rimborso e Controversie ("Politica") si applica a tutte le transazioni effettuate sulla piattaforma MyZubster, inclusi acquisti di beni fisici (semi, tag NFC per animali domestici, kit sensori Arduino), servizi digitali (accesso alla Mappa Globale delle Piante, abbinamento P2P Seed Exchange) e certificati di contributo NFT (blockchain Tari), pagati in Monero (XMR) tramite contratto smart escrow.

1.2. **Controversisti Ammissibili:** Qualsiasi utente registrato su MyZubster che (a) ha completato il pagamento tramite il sistema escrow XMR della piattaforma, (b) ha ricevuto un hash di conferma transazione sulla blockchain Monero, e (c) non ha precedentemente rinunciato ai diritti di controversia per il tipo specifico di transazione ai sensi della Sezione 1.4.

1.3. **Finestra di Controversia:** Le controversie devono essere iniziate entro 14 giorni calendario da:
- Data di consegna prevista per beni fisici (semi, tag NFC, hardware Arduino);
- Data di completamento del servizio per servizi digitali (accesso dati mappa, abbinamento P2P semi);
- Timestamp di emissione del certificato NFT sulla blockchain Tari.

1.4. **Articoli Non Rimborsabili e Rinunce:**
- Certificati di contributo NFT su blockchain Tari (consegna digitale istantanea, Art. 16(c) Direttiva Diritti dei Consumatori (UE) 2011/83);
- Abbonamenti ad accesso a mappe digitali attivati al rilascio escrow XMR;
- Prodotti biologici (semi, piante vive) dopo la spedizione, ai sensi delle direttive UE sui beni di consumo e del Regolamento fitosanitario (UE) 2016/2031;
- Rapporti di analisi AI personalizzati generati da dati sensore specifici dell'utente.

1.5. **Matrice di Ammissibilità ai Rimborsi:**

| Scenario | Tipo di Rimborso | Condizione |
|----------|------------------|------------|
| Articolo non ricevuto (gap tracking > 7 giorni) | Rilascio escrow totale all'Acquirente | Verificato da analisi log sensore AI |
| Tag NFC animale domestico contraffatto (mismatch hash) | Rilascio escrow totale all'Acquirente | Verificato da protocollo autenticazione NFC |
| Sensore Arduino difettoso (errore firmware) | Rilascio escrow totale all'Acquirente | Verificato da log diagnostici AI |
| Variazione minore specie nella consegna piante | Rilascio escrow parziale (50–80%) | Voto maggioranza comunità + analisi immagini AI |
| Metadati NFT incompleti (errore hash Tari) | Rilascio escrow parziale (50%) | Verificato da consenso nodo Tari |
| Ripensamento dell'Acquirente (entro finestra 14 giorni) | Rilascio escrow totale meno tariffa admin 30 EUR | Salvo rinuncia ai sensi della Sezione 1.4 |
| Forza maggiore (sequestro doganale, fork XMR) | Arbitrato escrow caso per caso | Verificato da arbitro indipendente |

### 2. Processo di Controversia

2.1. **Inizio:** L'Acquirente deve presentare una controversia tramite il modulo di controversia in-app di MyZubster, allegando:
- Hash transazione XMR dalla blockchain Monero;
- Indirizzo contratto escrow e ID transazione;
- Prove specifiche per il tipo di controversia:
  - **IoT/NFC:** Log lettura tag NFC, export dati sensore Arduino, timestamp;
  - **Scambio Semi:** Log chat P2P, documentazione varietà semi, foto test germinazione;
  - **NFT/Tari:** Hash transazione Tari, URL metadati NFT, ID certificato di contributo;
  - **Dati Mappa:** Foto piante/animali geo-taggate, registri voti comunità, link report analisi AI.

2.2. **Triaggio AI (Livello 1):** Entro 24 ore dalla presentazione, il sistema AI di MyZubster analizza le prove fornite:
- Autenticità tag NFC tramite verifica firma crittografica;
- Integrità dati sensore Arduino tramite checksum e validazione timestamp;
- Accuratezza abbinamento P2P Scambio Semi tramite riconoscimento immagini;
- Completezza metadati NFT tramite query esploratore blockchain Tari;
- Validità contributo Mappa Globale delle Piante tramite verifica hash geolocalizzazione.

2.3. **Giuria Comunitaria (Livello 2):** Se il triage AI produce risultati inconclusivi (< 70% di confidenza), la controversia è inoltrata a una giuria comunitaria di 7 utenti selezionati casualmente con punteggio di reputazione (minimo 3 scambi precedenti andati a buon fine, punteggio reputazione minimo 0,75). La giuria ha 72 ore per esaminare le prove e votare. Una maggioranza semplice (4/7) determina l'esito.

2.4. **Blocco Tecnico Escrow:** Durante il processo di controversia, gli XMR in escrow rimangono bloccati nel contratto smart non custodial. Nessuna parte può rilasciare unilateralmente i fondi. MyZubster non detiene né controlla gli XMR in escrow in nessun momento.

2.5. **Finestra di Risposta Venditore:** I Venditori hanno 48 ore per presentare contro-prove tramite il portale in-app. La mancata risposta comporta una sentenza di default a favore dell'Acquirente, salvo le rinunce di cui alla Sezione 1.4.

### 3. Intervento Escrow

3.1. **Trigger di Rilascio Automatico (Nessuna Controversia Presentata):**
- Conferma di consegna da parte dell'Acquirente tramite scansione tag NFC, caricamento dati sensore Arduino o scansione tracking;
- 14 giorni calendario dopo il blocco escrow, purché nessuna controversia sia stata presentata.

3.2. **Rilascio Parziale per Accordo:** Se Acquirente e Venditore si accordano mutualmente su un rimborso parziale o risoluzione alternativa (es. sostituzione tag NFC, pianta riseminata), possono richiedere congiuntamente il rilascio parziale dell'escrow tramite il portale di mediazione in-app. MyZubster verifica il consenso mutuale tramite contratto escrow multi-firma.

3.3. **Intervento Tecnico:** MyZubster può intervenire tecnicamente nel contratto escrow solo per:
- Congelare fondi in attesa di arbitrato (escalation Livello 3);
- Rilasciare fondi per decisione AI/comunità/arbitro;
- Restituire fondi agli indirizzi XMR originali in caso di invalidità contrattuale (es. risoluzione fork rete XMR).

3.4. **Dichiarazione di Non Custodia Escrow:** MyZubster non detiene, custodisce né ha accesso agli XMR in escrow. Il contratto smart escrow è distribuito sulla blockchain Monero come protocollo non custodial. MyZubster agisce esclusivamente come facilitatore tecnico e non può invertire, reindirizzare o intercettare fondi in escrow.

3.5. **Eventi Rete XMR:** In caso di fork della rete Monero, cambio di consenso o aggiornamento protocollo che influisca sulla funzionalità del contratto escrow, le parti accettano di essere vincolate alla catena riconosciuta valida dalla maggioranza dell'hashrate. I fondi in escrow sono automaticamente migrati alla catena canonica senza responsabilità per MyZubster.

### 4. Escalation

4.1. **Arbitro Indipendente Livello 3:** Se una parte rifiuta la decisione della giuria comunitaria (Livello 2), può richiedere l'escalation a un arbitro indipendente entro 24 ore dal verdetto della giuria. L'arbitro è nominato da MyZubster da un pool di professionisti legali EU autorizzati specializzati in e-commerce, blockchain e GDPR.

4.2. **Autorità dell'Arbitro:** L'arbitro indipendente ha autorità vincolante per:
- Ordinare rimborso totale, parziale o negato dall'escrow;
- Disporre l'esecuzione specifica (sostituzione hardware NFC/Arduino difettoso);
- Assegnare spese amministrative alla parte vittoriosa;
- Emettere orientamenti su future interpretazioni delle policy di piattaforma.

4.3. **Procedura Arbitrale:**
- Revisione del dossier completo di prove (report triage AI, voti giuria comunitaria, presentazioni parti);
- Audizione opzionale tramite videoconferenza (max 30 minuti per parte);
- Decisione scritta motivata entro 10 giorni lavorativi dalla nomina;
- Decisione eseguita tramite chiamata smart contract automatizzata dal personale tecnico MyZubster.

4.4. **Costi:** I costi dell'arbitrato Livello 3 sono a carico della parte soccombente, con un massimo di 100 EUR (o XMR equivalente al momento della presentazione della controversia). Se l'arbitro ritiene entrambe le parti parzialmente colpevoli, i costi sono ripartiti proporzionalmente.

4.5. **Definitività:** La decisione dell'arbitro è finale e vincolante. Le parti rinunciano a qualsiasi diritto di ricorso giudiziario, eccetto per contestazioni basate su parzialità dell'arbitro, frode procedurale o violazione di legge italiana/UE imperativa sui consumatori, da presentare dinanzi al Tribunale di Milano, Italia.

### 5. Termini Temporali

5.1. **Timeline Standard di Risoluzione:**

| Fase | Durata | Esito |
|------|--------|-------|
| Presentazione controversia | Giorno 0 | Caso aperto, escrow congelato |
| Triaggio AI | Giorno 1 | Decisione o inoltro a giuria comunitaria |
| Giuria comunitaria (se richiesta) | Giorni 2–4 | Decisione maggioranza |
| Risposta venditore | Giorni 0–2 | Presentazione contro-prove |
| Escalation arbitro (se richiesta) | Giorni 5–15 | Decisione vincolante |
| Esecuzione escrow | Entro 24 ore dalla decisione finale | Fondi rilasciati all'indirizzo XMR designato |

5.2. **Timeline Accelerata (Casi Alto Valore / Urgenti):** Per controversie che coinvolgono:
- Prodotti biologici deperibili (semi, piante vive) con imminente scadenza;
- Hardware NFC/Arduino critico per sicurezza animali o automazione giardino;
- Valore escrow XMR superiore a 5.000 EUR equivalente;
La decisione di triaggio AI è resa entro 4 ore, e la delibera della giuria comunitaria è compressa a 24 ore.

5.3. **Ritardi Non Imputabili a MyZubster:** I seguenti ritardi estendono la timeline standard senza responsabilità per MyZubster:
- Mancanza del venditore nel fornire contro-prove entro 48 ore;
- Congestione blockchain che ritarda l'esecuzione del contratto escrow (> 2 ore per conferma Monero);
- Ritardi sincronizzazione nodo Tari che influenzano la verifica metadati NFT;
- Eventi di forza maggiore (disastri naturali, interruzioni rete XMR, lockdown normativi).

5.4. **Richieste Diritti Titolari Dati GDPR:** Le richieste di cancellazione, portabilità o accesso a dati personali relativi a controversie sono gestite in parallelo ai sensi della Privacy Policy MyZubster, con un tempo di risposta target di 30 giorni dalla ricezione di richiesta verificata.

### 6. Legge Applicabile

6.1. **Legge Applicabile:** La presente Politica e tutte le controversie da essa derivanti sono disciplinate dalla legge italiana, in particolare:
- Codice Civile italiano Articoli 1766–1786 (mandato, deposito e escrow);
- Codice del Consumo italiano (D.Lgs. 206/2005);
- Direttiva Diritti dei Consumatori (UE) 2011/83;
- Direttiva Servizi di Pagamento 2 (PSD2, UE) 2015/2366 (nella misura applicabile a servizi escrow tecnici);
- Regolamento Generale sulla Protezione dei Dati (GDPR) (Regolamento (UE) 2016/679);
- Codice Privacy italiano (D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018).

6.2. **Giurisdizione:** Tutte le controversie non risolte attraverso il processo di arbitrato interno (Sezioni 2–4) sono soggette alla giurisdizione esclusiva del Tribunale di Milano, Italia. Gli utenti rinunciano a qualsiasi obiezione alla giurisdizione personale o al foro di Milano.

6.3. **Clausola Arbitrale:** Ove consentito dalla legge italiana e UE, le parti possono eleggere di risolvere le controversie tramite arbitrato accelerato dinanzi alla Camera Arbitrale di Milano, secondo le sue regole allora vigenti. La lingua dell'arbitrato è l'inglese, con traduzione certificata italiana disponibile su richiesta a spese della parte richiedente.

6.4. **Prevalenza Protezione Consumatori:** Nulla nella presente Politica limita i diritti statutari dei consumatori UE ai sensi della legge applicabile imperativa, inclusi il diritto di recesso di 14 giorni ai sensi della Direttiva Diritti dei Consumatori (UE) 2011/83, eccetto ove espressamente rinunciato ai sensi della Sezione 1.4 per servizi digitali istantanei.

6.5. **Separabilità:** Se una qualsiasi disposizione della presente Politica è ritenuta invalida o inapplicabile ai sensi della legge italiana o UE, le restanti disposizioni rimarranno in pieno vigore ed effetto, e la disposizione invalida sarà sostituita da una disposizione valida che rifletta da vicino l'intenzione originale.

6.6. **Lingua:** In caso di incoerenza tra le versioni inglese e italiana della presente Politica, la versione inglese prevarrà per tutte le transazioni che coinvolgono utenti non italiani, mentre la versione italiana prevarrà per le transazioni in cui l'Acquirente è residente italiano o ove la legge italiana sui consumatori richieda espressamente documentazione in lingua italiana.
