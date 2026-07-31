# GDPR Compliance Checklist

**Version:** 1.0.0  
**Effective Date:** 2026-07-31  
**Last Updated:** 2026-07-31

## 1. Data Inventory

| Data Category | Sources | Storage Location | Retention Period | Sensitive (Art. 9) | Notes |
|---------------|---------|------------------|------------------|-------------------|-------|
| **User Identity** | Registration form, OAuth | Italian VPS database | Account lifetime + 7 years | No | Encrypted at rest |
| **Contact Data** | Account settings, support tickets | Italian VPS database | Account lifetime + 7 years | No | Encrypted at rest |
| **NFC Pet Tag Data** | NFC scans, Arduino readers | Italian VPS + Edge cache | 2 years after last scan | No | Device ID separated from owner data |
| **Arduino Sensor Readings** | IoT devices, cloud sync | Italian VPS + Edge cache | 1 year | No | Environmental data only |
| **Geolocation Data** | GPS, IP, Map pins | Italian VPS database | 2 years | No | Anonymized after 6 months for analytics |
| **Global Plant Map Data** | User submissions, AI analysis | Italian VPS + CDN | Indefinite (public) | No | Public by design |
| **Seed Exchange Data** | P2P messages, trades | Italian VPS database | 5 years | No | Messages encrypted in transit |
| **Transaction Records** | XMR blockchain, escrow logs | Blockchain (immutable) | Indefinite | No | Wallet addresses pseudonymized |
| **Tari NFT Data** | Tari blockchain | Blockchain (immutable) | Indefinite | No | Contribution certificates |
| **AI Analysis Results** | Automated processing | Italian VPS database | 1 year | No | Retained for model improvement |
| **Community Voting Data** | Voting platform | Italian VPS database | 2 years | No | Anonymized for analytics |
| **Consent Records** | Consent management platform | Italian VPS database | 6 years | No | Required for compliance proof |

### Special Category Data (Art. 9 GDPR)

| Data Type | Processing Basis | Safeguards |
|-----------|------------------|------------|
| **Biometric NFC Data** | Explicit consent | Hashed templates, 5-year retention, immediate deletion on withdrawal |
| **Health Data (Pets)** | Explicit consent | Encrypted, access-limited, 2-year retention |
| **Geolocation** | Explicit consent | Granular per-feature consent, 6-month anonymization |

## 2. Processing Records (RoPA)

### Record of Processing Activities

| Field | Details |
|-------|---------|
| **Controller** | MyZubster (Italian VPS) |
| **DPO** | dpo@myzubster.example |
| **Purpose** | Platform operation, AI verification, escrow transactions, community governance |
| **Categories of Data Subjects** | Users, pet owners, gardeners, seed traders, contributors |
| **Categories of Recipients** | Cloud hosting provider, payment processors (XMR), blockchain networks, AI service providers |
| **International Transfers** | None (all data stored in EU/Italy) |
| **Retention Periods** | As per Data Inventory table above |
| **Security Measures** | Encryption (AES-256), TLS 1.3, access controls, regular audits |

### Sub-Processors

| Processor | Service | Location | GDPR Compliance | DPA Signed |
|-----------|---------|----------|-----------------|------------|
| **Italian Cloud Host** | VPS infrastructure | Italy/EU | Yes | Yes |
| **XMR Network** | Cryptocurrency transactions | Decentralized | N/A (blockchain) | N/A |
| **Tari Network** | NFT minting | Decentralized | N/A (blockchain) | N/A |
| **CDN Provider** | Static asset delivery | EU | Yes | Yes |
| **Email Service** | Transactional emails | EU | Yes | Yes |

## 3. Legal Bases

| Processing Activity | Legal Basis | GDPR Article |
|---------------------|-------------|--------------|
| **Account Registration** | Contract performance | Art. 6(1)(b) |
| **AI Analysis & Verification** | Contract performance + Legitimate interest | Art. 6(1)(b) + Art. 6(1)(f) |
| **Community Voting** | Contract performance | Art. 6(1)(b) |
| **Escrow Transactions** | Contract performance | Art. 6(1)(b) |
| **NFC Pet Tag Processing** | Explicit consent | Art. 6(1)(a) |
| **Arduino Sensor Data** | Explicit consent | Art. 6(1)(a) |
| **Geolocation Data** | Explicit consent | Art. 6(1)(a) |
| **Marketing Communications** | Consent | Art. 6(1)(a) |
| **Security & Fraud Prevention** | Legitimate interest | Art. 6(1)(f) |
| **Legal Compliance** | Legal obligation | Art. 6(1)(c) |
| **Biometric Data (NFC)** | Explicit consent | Art. 9(2)(a) |
| **Health Data (Pets)** | Explicit consent | Art. 9(2)(a) |

### Legitimate Interest Assessment (LIA)

| Interest | Balancing Test | Safeguards |
|----------|----------------|------------|
| **Platform Security** | Overriding | Encryption, access logs, audit trails |
| **Fraud Prevention** | Overriding | Transaction monitoring, escrow holds |
| **AI Model Improvement** | Balanced | Anonymization, opt-out available |
| **Community Trust** | Overriding | Transparent voting, reputation scores |

## 4. Consent Management

### Consent Records

| Feature | Consent Required | Granularity | Withdrawal Method | Record Retention |
|---------|------------------|-------------|-------------------|------------------|
| **NFC Pet Tagging** | Yes | Per-petrol | Account settings | 6 years |
| **Arduino Sensors** | Yes | Per-device | Account settings | 6 years |
| **Geolocation** | Yes | Per-feature | Account settings | 6 years |
| **Biometric NFC Data** | Yes | Explicit per-session | Account settings | 6 years |
| **Marketing Emails** | Yes | Opt-in | Unsubscribe link | 6 years |
| **Analytics Cookies** | Yes | Banner choice | Cookie settings | 6 years |

### Consent Withdrawal Process

1. User navigates to Account Settings > Privacy & Consent
2. Toggles consent switches for each feature
3. System immediately ceases processing (except where legal obligation requires retention)
4. Confirmation email sent
5. Audit log updated

### Cookie Consent (ePrivacy)

| Cookie Type | Purpose | Duration | Consent Required |
|-------------|---------|----------|------------------|
| **Essential** | Session management, CSRF protection | Session | No |
| **Functional** | Preferences, language settings | 1 year | No |
| **Analytics** | Usage statistics, AI training data | 2 years | Yes |
| **Marketing** | Personalized content | 1 year | Yes |
| **Blockchain** | Wallet session, transaction signing | Session | No |

## 5. User Rights

| Right | Description | Process | Timeline |
|-------|-------------|---------|----------|
| **Right of Access** | Obtain copy of personal data | Online request form | 30 days |
| **Right to Rectification** | Correct inaccurate data | Account settings or support ticket | 30 days |
| **Right to Erasure** | Delete personal data ("right to be forgotten") | Online request form | 30 days |
| **Right to Restriction** | Limit processing in certain cases | Online request form | 30 days |
| **Right to Data Portability** | Receive data in machine-readable format | Online request form | 30 days |
| **Right to Object** | Oppose processing based on legitimate interest | Online request form | 30 days |
| **Rights Related to Automated Decision-Making** | Human review of AI decisions | Support escalation | 72 hours |
| **Right to Withdraw Consent** | Withdraw consent at any time | Account settings | Immediate |

### Complaint Mechanism

Users may lodge complaints with:
- **Italian Data Protection Authority (Garante):** https://www.garanteprivacy.it
- **European Data Protection Board:** For cross-border issues
- **MyZubster Internal Appeal:** support@myzubster.example

## 6. Data Protection Impact Assessment (DPIA)

### High-Risk Processing Activities

| Activity | Risk Level | DPIA Completed | Mitigations |
|----------|------------|----------------|-------------|
| **AI Analysis of Plant/Pet Data** | Medium | Yes | Anonymization, human oversight, accuracy monitoring |
| **Community Voting on User Content** | Medium | Yes | Transparency, appeal mechanism, anti-gaming measures |
| **Blockchain Recording (XMR/Tari)** | High | Yes | Pseudonymization, minimal on-chain data, encryption |
| **NFC Biometric Processing** | High | Yes | Explicit consent, hashing, limited retention, separate storage |
| **Geolocation Tracking** | High | Yes | Granular consent, anonymization, 6-month limit |
| **Seed Exchange P2P Messaging** | Medium | Yes | End-to-end encryption, moderation, reporting tools |

### DPIA Findings

| Finding | Recommendation |
|---------|----------------|
| **XMR Transactions** | Pseudonymous by design; wallet addresses not linked to identity on-chain |
| **Tari NFTs** | Contribution metadata stored off-chain; only hash on-chain |
| **NFC Data** | Biometric templates hashed with salt; cannot be reversed |
| **Geolocation** | User can disable per-feature; aggregated data anonymized |
| **AI Processing** | Human-in-the-loop for high-stakes decisions; explainability reports available |

## 7. Breach Notification

### Internal Breach Response

| Step | Action | Responsible | Timeline |
|------|--------|-------------|----------|
| 1 | Detection & containment | Security team | Immediate |
| 2 | Assessment & classification | DPO + Legal | 24 hours |
| 3 | Notification to authority | DPO | 72 hours |
| 4 | User notification | Communications | 72 hours (if high risk) |
| 5 | Remediation | Engineering | Ongoing |
| 6 | Post-incident review | DPO | 7 days |

### Regulatory Notification Thresholds

| Scenario | Notification Required | Authority |
|----------|----------------------|-----------|
| **Personal Data Breach** | Yes (Art. 33 GDPR) | Garante per la protezione dei dati personali |
| **High Risk to Rights** | Yes (Art. 34 GDPR) | Affected users |
| **Cryptocurrency Theft** | Yes (if personal data involved) | Garante + Financial authorities |
| **Blockchain Immutable Data** | Yes (if off-chain personal data compromised) | Garante |

### Breach Notification Template

```
[MyZubster Internal Reference]
[Date of Detection]
[Categories of Data Subjects Affected]
[Categories of Personal Data Breached]
[Approximate Number of Data Subjects]
[Likely Consequences]
[Measures Taken]
[Contact Details of DPO]
```

## 8. DPO Appointment

### Data Protection Officer

| Field | Details |
|-------|---------|
| **Name** | [DPO Name] |
| **Title** | Data Protection Officer |
| **Email** | dpo@myzubster.example |
| **Phone** | +39 [number] |
| **Address** | MyZubster, [Italian registered office address], Italy |
| **Response Time** | Within 30 days for all GDPR requests |
| **Responsibilities** | Monitor compliance, advise on DPIA, cooperate with Garante, handle user requests |

### DPO Responsibilities

1. **Compliance Monitoring:** Regular audits of processing activities
2. **Advisory Role:** Guidance on GDPR compliance, data protection by design
3. **Incident Response:** Lead breach notification and response
4. **User Rights:** Manage access, rectification, erasure requests
5. **Training:** Conduct staff GDPR training sessions
6. **Regulatory Liaison:** Interface with Garante and EU authorities

### DPO Independence

The DPO reports directly to executive management and has:
- No conflict of interest with other roles
- Direct access to all data processing systems
- Authority to escalate to the Garante independently
- Protected status under employment law (where applicable)

## 9. Compliance Monitoring

### Annual Compliance Review

| Area | Review Frequency | Responsible | Status |
|------|------------------|-------------|--------|
| **Data Inventory** | Quarterly | DPO | ✅ Maintained |
| **Processing Records** | Quarterly | DPO | ✅ Maintained |
| **Consent Management** | Monthly | Engineering | ✅ Active |
| **User Rights Requests** | Monthly | Support | ✅ < 30 day response |
| **Security Audits** | Semi-annual | Security team | ✅ Scheduled |
| **DPIA Reviews** | Annual | DPO | ✅ Completed |
| **Breach Preparedness** | Annual | DPO + Security | ✅ Tested |
| **Staff Training** | Annual | DPO | ✅ Scheduled |

### Compliance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Data Subject Request Response Time** | < 30 days | < 15 days |
| **Consent Withdrawal Processing** | < 24 hours | < 4 hours |
| **Breach Notification to Authority** | < 72 hours | < 48 hours |
| **User Notification for High-Risk Breaches** | < 72 hours | < 48 hours |
| **DPO Response Time** | < 30 days | < 7 days |

## 

# Elenco di Verifica per la Conformità GDPR

**Versione:** 1.0.0  
**Data di Entrata in Vigore:** 2026-07-31  
**Ultimo Aggiornamento:** 2026-07-31

## 1. Inventario dei Dati

| Categoria di Dati | Fonti | Luogo di Conservazione | Periodo di Conservazione | Sensibile (Art. 9) | Note |
|-------------------|-------|------------------------|--------------------------|-------------------|-------|
| **Identità Utente** | Modulo registrazione, OAuth | Database VPS italiano | Durata account + 7 anni | No | Cifrato a riposo |
| **Dati di Contatto** | Impostazioni account, ticket support | Database VPS italiano | Durata account + 7 anni | No | Cifrato a riposo |
| **Dati Tag NFC Animali** | Scansioni NFC, lettori Arduino | VPS italiano + cache edge | 2 anni dopo ultima scansione | No | ID dispositivo separato dai dati proprietario |
| **Letture Sensori Arduino** | Dispositivi IoT, sync cloud | VPS italiano + cache edge | 1 anno | No | Solo dati ambientali |
| **Dati di Geolocalizzazione** | GPS, IP, pin mappa | Database VPS italiano | 2 anni | No | Anonimizzati dopo 6 mesi per analytics |
| **Dati Mappa Globale Piante** | Invii utenti, analisi AI | VPS italiano + CDN | Indefinito (pubblico) | No | Pubblico per design |
| **Dati Scambio Semi** | Messaggi P2P, scambi | Database VPS italiano | 5 anni | No | Messaggi cifrati in transito |
| **Record Transazionali** | Blockchain XMR, log escrow | Blockchain (immutabile) | Indefinito | No | Indirizzi wallet pseudonimizzati |
| **Dati Tari NFT** | Blockchain Tari | Blockchain (immutabile) | Indefinito | No | Certificati di contributo |
| **Risultati Analisi AI** | Elaborazione automatica | Database VPS italiano | 1 anno | No | Conservati per miglioramento modello |
| **Dati Votazioni Community** | Piattaforma votazioni | Database VPS italiano | 2 anni | No | Anonimizzati per analytics |
| **Record di Consenso** | Piattaforma gestione consensi | Database VPS italiano | 6 anni | No | Necessari per prova conformità |

### Dati di Categoria Speciale (Art. 9 GDPR)

| Tipo di Dato | Base di Trattamento | Salvaguardie |
|--------------|---------------------|--------------|
| **Dati Biometrici NFC** | Consenso esplicito | Template con hash, conservazione 5 anni, cancellazione immediata alla revoca |
| **Dati di Salute (Animali)** | Consenso esplicito | Cifrati, accesso limitato, conservazione 2 anni |
| **Geolocalizzazione** | Consenso esplicito | Consenso granulare per funzionalità, anonimizzazione dopo 6 mesi |

## 2. Registri delle Attività di Trattamento (RoPA)

### Registro delle Attività di Trattamento

| Campo | Dettagli |
|-------|----------|
| **Titolare del Trattamento** | MyZubster (VPS italiano) |
| **DPO** | dpo@myzubster.example |
| **Finalità** | Operazione piattaforma, verifica AI, transazioni escrow, governance community |
| **Categorie di Interessati** | Utenti, proprietari di animali, giardinieri, commercianti di semi, contributor |
| **Categorie di Destinatari** | Provider cloud hosting, processori di pagamento (XMR), reti blockchain, provider servizi AI |
| **Trasferimenti Internazionali** | Nessuno (tutti i dati conservati in UE/Italia) |
| **Periodi di Conservazione** | Come da tabella Inventario Dati sopra |
| **Misure di Sicurezza** | Cifratura (AES-256), TLS 1.3, controlli accessi, audit periodici |

### Sub-Processors

| Processore | Servizio | Posizione | Conformità GDPR | DPA Firmato |
|------------|----------|-----------|-----------------|-------------|
| **Cloud Host Italiano** | Infrastruttura VPS | Italia/UE | Sì | Sì |
| **Rete XMR** | Transazioni criptovaluta | Decentralizzata | N/A (blockchain) | N/A |
| **Rete Tari** | Coniazione NFT | Decentralizzata | N/A (blockchain) | N/A |
| **Provider CDN** | Distribuzione contenuti statici | UE | Sì | Sì |
| **Servizio Email** | Email transazionali | UE | Sì | Sì |

## 3. Basi Giuridiche

| Attività di Trattamento | Base Giuridica | Articolo GDPR |
|-------------------------|----------------|---------------|
| **Registrazione Account** | Esecuzione contrattuale | Art. 6(1)(b) |
| **Analisi AI e Verifica** | Esecuzione contrattuale + Legittimo interesse | Art. 6(1)(b) + Art. 6(1)(f) |
| **Votazioni Community** | Esecuzione contrattuale | Art. 6(1)(b) |
| **Transazioni Escrow** | Esecuzione contrattuale | Art. 6(1)(b) |
| **Elaborazione Tag NFC Animali** | Consenso esplicito | Art. 6(1)(a) |
| **Dati Sensori Arduino** | Consenso esplicito | Art. 6(1)(a) |
| **Dati di Geolocalizzazione** | Consenso esplicito | Art. 6(1)(a) |
| **Comunicazioni Marketing** | Consenso | Art. 6(1)(a) |
| **Sicurezza e Prevenzione Frodi** | Legittimo interesse | Art. 6(1)(f) |
| **Conformità Legale** | Obbligo legale | Art. 6(1)(c) |
| **Dati Biometrici (NFC)** | Consenso esplicito | Art. 9(2)(a) |
| **Dati di Salute (Animali)** | Consenso esplicito | Art. 9(2)(a) |

### Valutazione dell'Interesse Legittimo (LIA)

| Interesse | Bilanciamento | Salvaguardie |
|-----------|---------------|--------------|
| **Sicurezza Piattaforma** | Prevalente | Cifratura, log accessi, trail di audit |
| **Prevenzione Frodi** | Prevalente | Monitoraggio transazioni, blocchi escrow |
| **Miglioramento Modello AI** | Bilanciato | Anonimizzazione, opt-out disponibile |
| **Fiducia Community** | Prevalente | Votazioni trasparenti, punteggi reputazione |

## 4. Gestione dei Consensi

### Record di Consenso

| Funzionalità | Consenso Richiesto | Granularità | Metodo di Revoca | Conservazione Record |
|--------------|--------------------|-------------|------------------|----------------------|
| **Tag NFC Animali** | Sì | Per-animale | Impostazioni account | 6 anni |
| **Sensori Arduino** | Sì | Per-dispositivo | Impostazioni account | 6 anni |
| **Geolocalizzazione** | Sì | Per-funzionalità | Impostazioni account | 6 anni |
| **Dati Biometrici NFC** | Sì | Esplicito per-sessione | Impostazioni account | 6 anni |
| **Email Marketing** | Sì | Opt-in | Link di cancellazione | 6 anni |
| **Cookie Analytics** | Sì | Scelta banner | Impostazioni cookie | 6 anni |

### Processo di Revoca del Consenso

1. L'utente naviga su Impostazioni Account > Privacy e Consensi
2. Modifica gli switch di consenso per ogni funzionalità
3. Il sistema cessa immediatamente il trattamento (eccetto ove obbligo legale richieda conservazione)
4. Email di conferma inviata
5. Log di audit aggiornato

### Consenso Cookie (ePrivacy)

| Tipo di Cookie | Finalità | Durata | Consenso Richiesto |
|----------------|----------|--------|--------------------|
| **Essenziali** | Gestione sessione, protezione CSRF | Sessione | No |
| **Funzionali** | Preferenze, impostazioni lingua | 1 anno | No |
| **Analytics** | Statistiche utilizzo, dati addestramento AI | 2 anni | Sì |
| **Marketing** | Contenuti personalizzati | 1 anno | Sì |
| **Blockchain** | Sessione wallet, firma transazioni | Sessione | No |

## 5. Diritti dell'Interessato

| Diritto | Descrizione | Processo | Timeline |
|---------|-------------|----------|----------|
| **Diritto di Accesso** | Ottenere copia dei dati personali | Modulo di richiesta online | 30 giorni |
| **Diritto di Rettifica** | Correggere dati inesatti | Impostazioni account o ticket support | 30 giorni |
| **Diritto alla Cancellazione** | Cancellare dati personali ("diritto all'oblio") | Modulo di richiesta online | 30 giorni |
| **Diritto di Limitazione** | Limitare il trattamento in casi specifici | Modulo di richiesta online | 30 giorni |
| **Diritto alla Portabilità** | Ricevere dati in formato leggibile da macchina | Modulo di richiesta online | 30 giorni |
| **Diritto di Opposizione** | Opporsi al trattamento basato su legittimo interesse | Modulo di richiesta online | 30 giorni |
| **Diritti Relativi a Decisioni Automatizzate** | Revisione umana di decisioni AI | Escalation support | 72 ore |
| **Diritto di Revoca del Consenso** | Revocare il consenso in qualsiasi momento | Impostazioni account | Immediato |

### Meccanismo di Reclamo

Gli utenti possono presentare reclami a:
- **Garante per la protezione dei dati personali:** https://www.garanteprivacy.it
- **European Data Protection Board:** Per questioni transfrontaliere
- **Appello Interno MyZubster:** support@myzubster.example

## 6. Valutazione di Impatto sulla Protezione dei Dati (DPIA)

### Attività di Trattamento ad Alto Rischio

| Attività | Livello di Rischio | DPIA Completata | Mitigazioni |
|----------|--------------------|-----------------|--------------|
| **Analisi AI di Dati Piante/Animali** | Medio | Sì | Anonimizzazione, supervisione umana, monitoraggio accuratezza |
| **Votazioni Community su Contenuti Utente** | Medio | Sì | Trasparenza, meccanismo di appello, misure anti-gaming |
| **Registrazione Blockchain (XMR/Tari)** | Alto | Sì | Pseudonimizzazione, dati minimi on-chain, cifratura |
| **Elaborazione Biometrica NFC** | Alto | Sì | Consenso esplicito, hashing, conservazione limitata, storage separato |
| **Tracciamento Geolocalizzazione** | Alto | Sì | Consenso granulare, anonimizzazione, limite 6 mesi |
| **Messaggistica P2P Scambio Semi** | Medio | Sì | Cifratura end-to-end, moderazione, strumenti di segnalazione |

### Risultati DPIA

| Risultato | Raccomandazione |
|-----------|-----------------|
| **Transazioni XMR** | Pseudonime per design; indirizzi wallet non collegati a identità on-chain |
| **NFT Tari** | Metadati contributo conservati off-chain; solo hash on-chain |
| **Dati NFC** | Template biometrici con hash e salt; non reversibili |
| **Geolocalizzazione** | L'utente può disabilitare per-funzionalità; dati aggregati anonimizzati |
| **Elaborazione AI** | Uomo nel ciclo per decisioni ad alto impatto; report di spiegabilità disponibili |

## 7. Notifica di Violazione

### Risposta Interna alle Violazioni

| Passo | Azione | Responsabile | Timeline |
|------|--------|-------------|----------|
| 1 | Rilevamento e contenimento | Team sicurezza | Immediato |
| 2 | Valutazione e classificazione | DPO + Legale | 24 ore |
| 3 | Notifica all'autorità | DPO | 72 ore |
| 4 | Notifica agli utenti | Comunicazioni | 72 ore (se alto rischio) |
| 5 | Remediation | Engineering | In corso |
| 6 | Revisione post-incidente | DPO | 7 giorni |

### Soglie di Notifica Regolamentare

| Scenario | Notifica Richiesta | Autorità |
|----------|-------------------|----------|
| **Violazione Dati Personali** | Sì (Art. 33 GDPR) | Garante per la protezione dei dati personali |
| **Alto Rischio per i Diritti** | Sì (Art. 34 GDPR) | Utenti interessati |
| **Furto di Criptovalute** | Sì (se coinvolti dati personali) | Garante + Autorità finanziarie |
| **Dati Blockchain Immutabili** | Sì (se compromessi dati off-chain) | Garante |

### Template di Notifica Violazione

```
[Riferimento Interno MyZubster]
[Data di Rilevamento]
[Categorie di Interessati Coinvolti]
[Categorie di Dati Personali Violati]
[Numero Approssimativo di Interessati]
[Conseguenze Probabili]
[Misure Adottate]
[Recapiti DPO]
```

## 8. Nomina del DPO

### Data Protection Officer

| Campo | Dettagli |
|-------|----------|
| **Nome** | [Nome DPO] |
| **Titolo** | Data Protection Officer |
| **Email** | dpo@myzubster.example |
| **Telefono** | +39 [numero] |
| **Indirizzo** | MyZubster, [indirizzo sede legale italiana], Italia |
| **Tempo di Risposta** | Entro 30 giorni per tutte le richieste GDPR |
| **Responsabilità** | Monitorare conformità, consigliare su DPIA, cooperare con Garante, gestire richieste utenti |

### Responsabilità del DPO

1. **Monitoraggio Conformità:** Audit periodici delle attività di trattamento
2. **Ruolo Consultivo:** Guida sulla conformità GDPR, privacy by design
3. **Risposta Incidenti:** Guidare notifica e risposta alle violazioni
4. **Diritti Utenti:** Gestire richieste di accesso, rettifica, cancellazione
5. **Formazione:** Condurre sessioni di formazione GDPR per il personale
6. **Liaison Regolamentare:** Interfaccia con Garante e autorità UE

### Indipendenza del DPO

Il DPO riporta direttamente alla direzione esecutiva e ha:
- Nessun conflitto di interesse con altri ruoli
- Accesso diretto a tutti i sistemi di trattamento dati
- Autorità di escalation al Garante in modo indipendente
- Status protetto ai sensi del diritto del lavoro (ove applicabile)
