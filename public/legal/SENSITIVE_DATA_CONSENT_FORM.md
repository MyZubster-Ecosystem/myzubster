# SENSITIVE DATA CONSENT FORM
## MyZubster Platform — GDPR / EU / Italian Compliance

| Field | Value |
|-------|-------|
| **Document Version** | 1.0.0 |
| **Effective Date** | 2026-07-31 |
| **Data Controller** | MyZubster s.r.l. |
| **Jurisdiction** | Italy (EU) — deployed on Italian VPS, subject to GDPR (Reg. EU 2016/679), the Italian Personal Data Protection Code (D.Lgs. 196/2003 as amended by D.Lgs. 101/2018), and applicable ePrivacy rules. |
| **Contact DPO** | dpo@myzubster.example |
| **Scope** | This form applies to all Users who process, store, or share Sensitive and non-Sensitive Personal Data through the MyZubster ecosystem (plant / pet / smart-garden platform, NFC pet tags, Arduino sensors, Seed Exchange P2P, Tari NFT certificates, XMR/escrow payments, AI verification, and community voting). |

---

## ENGLISH (EN)

### 1. Data Processed

MyZubster processes the following categories of personal data, including special categories where applicable:

| Category | Data Examples | Legal Basis (GDPR Art. 6) | Special Category? (Art. 9) |
|----------|---------------|---------------------------|----------------------------|
| **Identity & Contact** | Name, email, username, wallet addresses (Monero / Tari), KYC-optional fields | Contract (6.1.b); Legitimate interest (6.1.f) | No |
| **Financial / Payment** | XMR transaction hashes, escrow reference IDs, Tari NFT minting records, payout addresses | Contract (6.1.b); Legal obligation (6.1.c) | No |
| **Geolocation** | GPS coordinates from mobile app, IP-derived location, garden/pet map pins, seed-exchange region tags | Consent (6.1.a); Contract (6.1.b) | **Yes** — treated as special category under Art. 9 when combined with biometric or health-adjacent data |
| **NFC & Biometric (Pet)** | NFC tag UID, pet biometric templates (if enrolled via NFC tag + camera), RFID scan timestamps | Explicit consent (6.1.a); Vital interests (6.1.d) | **Yes** — biometric data under Art. 9(1) |
| **IoT / Arduino Sensors** | Soil moisture, temperature, humidity, light levels, pump activation logs, device IDs | Contract (6.1.b); Consent (6.1.a) | No (unless health-adjacent) |
| **Content / Community** | Plant IDs, pet profiles, map markers, seed-exchange listings, community votes, AI verification scores, chat logs | Contract (6.1.b); Legitimate interest (6.1.f) | No |
| **Derived / Analytics** | AI-generated growth predictions, fraud scores, reputation tokens, aggregated biodiversity metrics | Legitimate interest (6.1.f); Consent (6.1.a) | No |

**Sensitive data definition under this form:** Geolocation data, NFC pet biometric templates, and any data combined with the above to identify a natural person’s private life or health-adjacent habits are treated as Sensitive Personal Data.

### 2. Purpose

| Purpose | Data Categories Involved | Retention Trigger |
|---------|--------------------------|-------------------|
| **Account creation & authentication** | Identity, contact, wallet addresses | Until account deletion + statutory period |
| **XMR escrow transactions** | Financial, identity, contract | 10 years after transaction closure (tax/AML) |
| **NFC pet tag registration & matching** | NFC UID, pet biometrics, identity | Until tag deregistration + 5 years |
| **Arduino smart-garden telemetry** | IoT sensor data, device IDs, location | 3 years after last device activity |
| **Global plant map & geolocation** | Geolocation, plant IDs, user content | 5 years after map entry removal |
| **Seed Exchange P2P** | Identity, location, listings, community votes | 3 years after exchange closure |
| **Tari NFT contribution certificates** | Identity, wallet, contribution metadata | 10 years after NFT burn/transfer |
| **AI analysis & verification** | Content, IoT, geolocation, derived scores | 3 years after analysis run |
| **Community voting & reputation** | Votes, reputation tokens, public profiles | 5 years after last vote |
| **Customer support & dispute resolution** | Identity, contact, financial, chat logs | 6 years after case closure |
| **Legal compliance & tax reporting** | All categories as required by Italian/EU law | As mandated by law (typically 10 years) |

### 3. User Rights

Under GDPR Articles 15–22 and the Italian Data Protection Code, you have the right to:

- **Access (Art. 15):** Request a copy of all personal data we hold about you, including NFC templates and geolocation history.
- **Rectification (Art. 16):** Correct inaccurate IoT sensor logs, pet profiles, or location tags.
- **Erasure / Right to be Forgotten (Art. 17):** Request deletion of your account, pet NFC data, map entries, and seed-exchange history, subject to legal-hold exceptions (e.g., escrow records).
- **Restriction of Processing (Art. 18):** Limit use of your geolocation or biometric data while a dispute is investigated.
- **Data Portability (Art. 20):** Receive your plant/pet data, sensor logs, and NFT metadata in a structured, machine-readable format (JSON/CSV).
- **Object (Art. 21):** Object to AI-driven profiling or community-vote reputation scoring.
- **Lodge a Complaint (Art. 77):** File with the Garante per la protezione dei dati personali (Italian DPA) or your local EU DPA.

To exercise any right, submit a verified request via the MyZubster dashboard or email dpo@myzubster.example. We will respond within 30 days (GDPR standard).

### 4. Withdrawal

You may withdraw your consent for any specific purpose at any time, without affecting the lawfulness of processing based on consent before withdrawal.

- **Geolocation:** Disable location services in-app; historical map pins remain anonymized or deleted upon request.
- **NFC Biometric:** Deregister NFC tags via account settings; biometric templates are purged within 30 days of withdrawal.
- **IoT / Arduino:** Stop device syncing; remaining telemetry is retained only as required by law or escrow audit trails.
- **AI & Community Features:** Opt out of AI verification and public reputation scores; derived analytics are recomputed without your data.
- **Marketing / Analytics:** Unsubscribe via preferences center; historical analytics are aggregated and anonymized.

Withdrawal does not apply to processing necessary for contract performance (e.g., escrow completion) or legal obligations.

### 5. Retention

| Data Category | Retention Period | Post-Retention Action |
|---------------|------------------|-----------------------|
| **Account & Identity** | Until deletion request + 10 years (tax/AML) | Anonymization or secure deletion |
| **XMR Escrow Records** | 10 years from transaction closure | Encrypted archival; access limited to legal holds |
| **NFC Biometric Templates** | 5 years after tag deregistration or last use | Permanent deletion (crypto-shred) |
| **Geolocation / Map Data** | 5 years after user-initiated removal | Aggregation into anonymous heatmaps or deletion |
| **Arduino Sensor Logs** | 3 years after last device sync | Deletion unless flagged for fraud investigation |
| **Seed Exchange Records** | 3 years after exchange closure | Anonymization of identities; listings may remain aggregated |
| **Tari NFT Metadata** | 10 years after burn/transfer | On-chain metadata preserved; off-chain PII deleted |
| **AI Scores & Verifications** | 3 years after computation | De-identification; model retraining only with anonymized aggregates |
| **Support & Dispute Logs** | 6 years after closure | Anonymization or deletion per policy |

**Cross-border transfer:** Data is stored on EU-based infrastructure (Italian VPS). Sub-processors (e.g., Tari node operators, IPFS pinning services) are bound by Standard Contractual Clauses (SCCs) or adequacy decisions.

### 6. Geolocation Data

Geolocation is considered Sensitive Data when combined with other personal identifiers.

- **Collected:** GPS from mobile, IP-derived city/country, manual map pins for plants/pets, seed-exchange region tags.
- **Purpose:** Global plant map visualization, local seed-exchange matching, Arduino sensor geo-tagging, and AI climate-zone analysis.
- **Protection:** End-to-end encryption at rest and in transit; location history is pseudonymized by default.
- **Retention:** 5 years after removal; aggregated anonymous maps may persist indefinitely.
- **Rights:** You may correct or delete specific pins; bulk export of your location history is available via Data Portability.

### 7. NFC Biometric Data

NFC pet tag data and associated biometric templates are treated as Special Category Data under GDPR Art. 9.

- **Collected:** NFC tag UID, pet biometric template (derived from NFC scan + optional camera), scan timestamps, linked pet profile.
- **Purpose:** Pet identification, NFC-enabled access to smart-garden zones, and biometric verification for escrow-related pet-care services.
- **Protection:** Biometric templates are stored as non-reversible hashes; raw NFC UIDs are encrypted; decryption keys are hardware-separated (Arduino secure element where applicable).
- **Retention:** 5 years after last tag use or explicit deregistration; you may request immediate deletion via account settings.
- **Rights:** You may object to biometric processing; withdrawal stops future scans but does not retroactively undo completed verifications.

### 8. Signature

By signing below (or checking the digital acceptance box in the MyZubster interface), I confirm that:

1. I have read and understood this Sensitive Data Consent Form.
2. I consent to the processing of my Sensitive Personal Data, including geolocation and NFC biometric data, for the purposes described above.
3. I understand my rights under GDPR and Italian law, including the right to withdraw consent at any time.
4. I acknowledge that escrow and financial records may be retained beyond account deletion to comply with legal obligations.

| **User Signature (Typed / Digital)** | **Date** | **User ID / Wallet Address** |
|--------------------------------------|----------|------------------------------|
|                                      |          |                              |

---

## ITALIANO (IT)

### 1. Dati Trattati

MyZubster tratta le seguenti categorie di dati personali, incluse le categorie particolari ove applicabile:

| Categoria | Esempi di Dati | Base Giuridica (GDPR Art. 6) | Categoria Particolare? (Art. 9) |
|-----------|----------------|------------------------------|--------------------------------|
| **Identità e Contatti** | Nome, email, username, indirizzi wallet (Monero / Tari), campi KYC opzionali | Contratto (6.1.b); Interesse legittimo (6.1.f) | No |
| **Finanziari / Pagamento** | Hash transazioni XMR, ID riferimento escrow, record minting NFT Tari, indirizzi di pagamento | Contratto (6.1.b); Obbligo legale (6.1.c) | No |
| **Geolocalizzazione** | Coordinate GPS da app mobile, posizione derivata da IP, pin su mappe giardini/animali, tag regione per Seed Exchange | Consenso (6.1.a); Contratto (6.1.b) | **Sì** — trattata come categoria particolare ai sensi dell’Art. 9 se combinata con dati biometrici o sanitari |
| **NFC e Biometrici (Pet)** | UID tag NFC, template biometrici animale (se registrati via NFC + fotocamera), timestamp scansioni RFID | Consenso esplicito (6.1.a); Interessi vitali (6.1.d) | **Sì** — dati biometrici ai sensi dell’Art. 9(1) |
| **IoT / Arduino** | Umidità suolo, temperatura, umidità aria, luminosità, log attivazione pompe, ID dispositivi | Contratto (6.1.b); Consenso (6.1.a) | No (a meno che non siano dati sanitari) |
| **Contenuti / Community** | ID piante, profili animali, marker su mappa, annunci Seed Exchange, voti community, punteggi verifica AI, log chat | Contratto (6.1.b); Interesse legittimo (6.1.f) | No |
| **Derivati / Analytics** | Previsioni crescita AI, punteggi frode, token reputazione, metriche biodiversità aggregate | Interesse legittimo (6.1.f); Consenso (6.1.a) | No |

**Definizione di dati sensibili ai sensi del presente modulo:** I dati di geolocalizzazione, i template biometrici NFC degli animali e qualsiasi dato combinato con i sopraindicati atto a identificare la vita privata o le abitudini sanitarie di una persona fisica sono trattati come Dati Personali Sensibili.

### 2. Finalità

| Finalità | Categorie di Dati Coinvolte | Trigger di Conservazione |
|----------|------------------------------|--------------------------|
| **Creazione account e autenticazione** | Identità, contatti, indirizzi wallet | Fino a cancellazione account + periodo previsto per legge |
| **Transazioni escrow XMR** | Finanziari, identità, contratto | 10 anni dalla chiusura transazione (fiscale/AML) |
| **Registrazione tag NFC pet e matching** | UID NFC, biometrici pet, identità | Fino a deregistrazione tag + 5 anni |
| **Telemetria smart-garden Arduino** | Dati sensori IoT, ID dispositivi, posizione | 3 anni dall’ultima attività dispositivo |
| **Mappa globale piante e geolocalizzazione** | Geolocalizzazione, ID piante, contenuti utente | 5 anni dalla rimozione voce mappa |
| **Seed Exchange P2P** | Identità, posizione, annunci, voti community | 3 anni dalla chiusura scambio |
| **Certificati contributo NFT Tari** | Identità, wallet, metadati contributo | 10 anni da burn/trasferimento NFT |
| **Analisi AI e verifica** | Contenuti, IoT, geolocalizzazione, punteggi derivati | 3 anni dall’esecuzione analisi |
| **Votazione community e reputazione** | Voti, token reputazione, profili pubblici | 5 anni dall’ultimo voto |
| **Supporto clienti e risoluzione dispute** | Identità, contatti, finanziari, log chat | 6 anni dalla chiusura caso |
| **Conformità legale e reporting fiscale** | Tutte le categorie come richiesto da legge italiana/UE | Come previsto per legge (solitamente 10 anni) |

### 3. Diritti dell’Utente

Ai sensi degli Articoli 15–22 del GDPR e del Codice italiano in materia di protezione dei dati personali, l’utente ha diritto a:

- **Accesso (Art. 15):** Richiedere copia di tutti i dati personali detenuti, inclusi template NFC e storico geolocalizzazione.
- **Rettifica (Art. 16):** Correggere log sensori Arduino, profili animali o tag di posizione inesatti.
- **Cancellazione / Diritto all’oblio (Art. 17):** Richiedere la rimozione dell’account, dei dati NFC pet, delle voci mappa e dello storico Seed Exchange, salvo eccezioni per conservazioni legali (es. record escrow).
- **Limitazione di trattamento (Art. 18):** Limitare l’uso dei dati di geolocalizzazione o biometrici durante indagini su dispute.
- **Portabilità (Art. 20):** Ricevere dati di piante/animali, log sensori e metadati NFT in formato strutturato e leggibile da macchina (JSON/CSV).
- **Opposizione (Art. 21):** Opporsi al profiling basato su AI o al punteggio reputazione basato su voti community.
- **Presentare reclamo (Art. 77):** Reclamo al Garante per la protezione dei dati personali o all’autorità di controllo locale dell’UE.

Per esercitare qualsiasi diritto, inviare una richiesta verificata tramite la dashboard MyZubster o via email a dpo@myzubster.example. Risponderemo entro 30 giorni (standard GDPR).

### 4. Revoca

È possibile revocare il consenso per qualsiasi specifica finalità in qualsiasi momento, senza pregiudicare la liceità del trattamento basato sul consenso prima della revoca.

- **Geolocalizzazione:** Disabilitare i servizi di localizzazione nell’app; i pin storici sulla mappa sono anonimizzati o cancellati su richiesta.
- **Biometrici NFC:** Deregistrare i tag NFC dalle impostazioni dell’account; i template biometrici sono cancellati entro 30 giorni dalla revoca.
- **IoT / Arduino:** Interrompere la sincronizzazione del dispositivo; i dati di telemetria residui sono conservati solo se richiesto per legge o per audit escrow.
- **Funzionalità AI e Community:** Disattivare la verifica AI e i punteggi reputazione pubblici; le analytics derivate sono ricalcolate senza i tuoi dati.
- **Marketing / Analytics:** Annullare l’iscrizione tramite il centro preferenze; le analytics storiche sono aggregate e anonimizzate.

La revoca non si applica al trattamento necessario per l’esecuzione del contratto (es. completamento escrow) o per obblighi legali.

### 5. Conservazione

| Categoria di Dati | Periodo di Conservazione | Azione Successiva |
|-------------------|--------------------------|-------------------|
| **Account e Identità** | Fino a richiesta di cancellazione + 10 anni (fiscale/AML) | Anonimizzazione o cancellazione sicura |
| **Record Escrow XMR** | 10 anni dalla chiusura transazione | Archiviazione crittografata; accesso limitato a conservazioni legali |
| **Template Biometrici NFC** | 5 anni dalla deregistrazione tag o ultimo utilizzo | Cancellazione permanente (crypto-shred) |
| **Dati Geolocalizzazione / Mappa** | 5 anni dalla rimozione da parte dell’utente | Aggregazione in mappe di calore anonime o cancellazione |
| **Log Sensori Arduino** | 3 anni dall’ultima sincronizzazione dispositivo | Cancellazione salvo flag per indagini frode |
| **Record Seed Exchange** | 3 anni dalla chiusura scambio | Anonimizzazione identità; gli annunci possono rimanere aggregati |
| **Metadati NFT Tari** | 10 anni da burn/trasferimento | Metadati on-chain preservati; PII off-chain cancellati |
| **Punteggi AI e Verifiche** | 3 anni dal calcolo | De-identificazione; riaddestramento modelli solo con aggregati anonimizzati |
| **Log Supporto e Dispute** | 6 anni dalla chiusura | Anonimizzazione o cancellazione secondo policy |

**Trasferimento transfrontaliero:** I dati sono archiviati su infrastruttura UE (VPS italiano). I sub-fornitori (es. operatori nodi Tari, servizi di pinning IPFS) sono vincolati da Clausole Contrattuali Standard (SCC) o decisioni di adeguatezza.

### 6. Dati di Geolocalizzazione

La geolocalizzazione è considerata Dato Sensibile quando combinata con altri identificatori personali.

- **Raccolti:** GPS da mobile, città/paese derivato da IP, pin manuali su mappe per piante/animali, tag regione per Seed Exchange.
- **Finalità:** Visualizzazione mappa globale piante, abbinamento locale Seed Exchange, geotagging sensori Arduino, analisi AI zone climatiche.
- **Protezione:** Crittografia end-to-end a riposo e in transito; lo storico posizioni è pseudonimizzato di default.
- **Conservazione:** 5 anni dopo rimozione; mappe aggregate anonime possono persistere indefinitamente.
- **Diritti:** È possibile correggere o cancellare pin specifici; l’esportazione bulk dello storico posizioni è disponibile tramite Portabilità dei Dati.

### 7. Dati Biometrici NFC

I dati dei tag NFC pet e i relativi template biometrici sono trattati come Dati di Categoria Particolare ai sensi dell’Art. 9 GDPR.

- **Raccolti:** UID tag NFC, template biometrico animale (derivato da scansione NFC + fotocamera opzionale), timestamp scansioni, profilo animale collegato.
- **Finalità:** Identificazione animale, accesso a zone smart-garden tramite NFC, verifica biometrica per servizi di pet-care legati a escrow.
- **Protezione:** I template biometrici sono memorizzati come hash non reversibili; gli UID NFC sono crittografati; le chiavi di decrittazione sono separate hardware (Arduino secure element ove applicabile).
- **Conservazione:** 5 anni dopo l’ultimo utilizzo del tag o deregistrazione esplicita; è possibile richiedere cancellazione immediata dalle impostazioni dell’account.
- **Diritti:** È possibile opporsi al trattamento biometrico; la revoca interrompe le scansioni future ma non annulla verifiche già completate.

### 8. Firma

Firmando di seguito (o selezionando la casella di accettazione digitale nell’interfaccia MyZubster), confermo che:

1. Ho letto e compreso il presente modulo di consenso al trattamento di dati sensibili.
2. Acconsento al trattamento dei miei Dati Personali Sensibili, inclusi dati di geolocalizzazione e dati biometrici NFC, per le finalità sopra descritte.
3. Comprendo i miei diritti ai sensi del GDPR e della legge italiana, incluso il diritto di revocare il consenso in qualsiasi momento.
4. Riconosco che i record relativi a escrow e dati finanziari possono essere conservati oltre la cancellazione dell’account per adempiere a obblighi legali.

| **Firma Utente (Digitale / Dattiloscritta)** | **Data** | **ID Utente / Indirizzo Wallet** |
|----------------------------------------------|----------|----------------------------------|
|                                              |          |                                  |
