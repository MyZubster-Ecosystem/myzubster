# MyZubster — nuove implementazioni Agosto 2026

Questo documento riassume le principali implementazioni realizzate recentemente nell'ecosistema MyZubster, con particolare attenzione a Marketplace, identità social, Zorgax, LIFE 2027 e interoperabilità Metaverse/crypto.

> Stato del documento: fotografia tecnica aggiornata al 28 agosto 2026. Alcune funzionalità sono già in `main`; altre sono ancora in pull request e non vanno considerate attive in produzione finché non vengono mergiate, deployate e configurate con i relativi secret/provider esterni.

## 1. Marketplace persistente

Il Marketplace è passato da una superficie principalmente dimostrativa a un sistema persistente basato su MongoDB.

Funzioni introdotte:

- modello persistente `MarketplaceListing`;
- creazione annunci autenticata;
- filtri per categoria, valuta e località;
- annunci pubblici attivi e area personale del venditore;
- modalità economiche `FREE`, `BARTER`, `MYZ`, `XMR`, `TARI`;
- blocco della vendita diretta di animali;
- protezione da inserimento di seed phrase, private key e materiale wallet sensibile;
- gestione stato annuncio e rimozione owner-only.

PR di riferimento: **#801 — merged**.

## 2. Ordini, reputazione e segnalazioni

È stato aggiunto il primo livello di trust del Marketplace:

- richieste/ordini tra buyer e seller;
- stati `REQUESTED`, `ACCEPTED`, `REJECTED`, `COMPLETED`, `CANCELLED`;
- recensioni 1–5 stelle collegate a uno scambio reale;
- reputazione utente;
- segnalazioni per frode, spam, harassment, contenuti proibiti o unsafe;
- prevenzione delle review duplicate per autore/ordine.

Non sono stati introdotti escrow, custody o conferme di pagamento automatiche.

PR di riferimento: **#802 — merged**.

## 3. Marketplace Operations

È stato aggiunto il pannello operativo per gestire concretamente gli scambi:

- inbox “I miei scambi”;
- accettazione/rifiuto/cancellazione/completamento;
- prenotazione atomica dello stock quando una richiesta viene accettata;
- ripristino dello stock se una richiesta accettata viene cancellata;
- chiusura automatica dell'annuncio quando lo stock arriva a zero;
- review dopo completamento;
- coda moderator/admin per le segnalazioni;
- log delle decisioni di moderazione;
- pausa, chiusura e riattivazione annunci;
- test end-to-end dei flussi principali.

PR di riferimento: **#804 — merged**.

## 4. Seller monetization e messaggistica privata

È stata sviluppata una monetizzazione Seller, insieme a messaggistica privata e abuse controls.

### Seller membership

- piano `SELLER_MONTHLY`;
- prezzo predefinito €9,90/mese, configurabile con `MARKETPLACE_SELLER_MONTHLY_EUR`;
- buyer gratuiti;
- pubblicazione/riattivazione annunci consentita solo ai Seller `ACTIVE`;
- richiesta di sottoscrizione con billing reference univoco;
- attivazione soltanto dopo una reference di pagamento esterno verificata da admin/moderator;
- stati `PENDING_PAYMENT`, `ACTIVE`, `SUSPENDED`, `EXPIRED`, `CANCELLED`.

### Messaggistica

- messaggi privati persistenti legati a un ordine esistente;
- solo buyer e seller coinvolti possono leggere/scrivere;
- chat chiusa su ordini rifiutati o cancellati;
- rate limit su mutazioni, chat e report;
- blocco delle richieste duplicate;
- limite lunghezza messaggio;
- nessun contatto pubblico obbligatorio.

Questa parte **non rappresenta ricavi già incassati** e non introduce custody, escrow o trasferimenti automatici.

PR di riferimento: **#805 — open**.

## 5. Login social verificato e identità Zorgax/Metaverse

È stato implementato un nuovo flusso di accesso tramite provider social verificati.

Provider attualmente implementati:

- Google;
- GitHub;
- Facebook.

Flusso:

`OAuth provider → identità verificata → creazione/collegamento account MyZubster → creazione/collegamento personaggio Metaverse persistente → sessione MyZubster`

Caratteristiche:

- persistenza delle identità social nel modello `User`;
- unicità degli ID provider;
- account-linking con email verificata quando disponibile;
- personaggio Metaverse persistente con provider di identità verificato;
- token provider non salvati nel profilo pubblico;
- Google Login separato dal consenso Gmail: il login non autorizza automaticamente la lettura della mailbox.

Instagram e X non sono ancora provider attivi.

PR di riferimento: **#806 — merged**.

## 6. Login pubblico su MyZubster

Il login social è stato portato nella superficie pubblica del sito.

Sono stati aggiunti:

- CTA Google/GitHub/Facebook;
- link “Accedi / Registrati” nella navigazione;
- pagina SPA `/social-login`;
- compatibilità con callback `/social-login.html`;
- exchange del ticket social breve con sessione MyZubster;
- salvataggio locale dell'ID personaggio Metaverse associato.

PR di riferimento: **#808 e #809 — merged**.

## 7. Interoperabilità Metaverse + crypto

È stato sviluppato un bridge non-custodial per collegare identità MyZubster/Zorgax con metaversi esterni.

Primi mondi supportati:

- Decentraland — `MANA`;
- The Sandbox — `SAND`.

Funzioni:

- collegamento di indirizzi EVM pubblici;
- challenge di firma `personal_sign` valida 5 minuti;
- verifica server-side del firmatario;
- `verifiedAt` solo se l'indirizzo firmatario coincide con quello registrato;
- lettura read-only di `balanceOf(address)` per MANA/SAND;
- endpoint per elencare mondi, link, challenge, verifica, portfolio e unlink.

Boundary di sicurezza:

- nessuna seed phrase/private key;
- nessun transfer;
- nessun approval;
- nessuno swap;
- nessun cross-chain bridge automatico;
- nessun escrow;
- NFT/LAND non vengono inventati: discovery disattivata finché non viene integrato un indexer/provider affidabile.

PR di riferimento: **#807 — open**.

## 8. LIFE 2027 — automazione e governance

LIFE 2027 è stato strutturato come programma operativo con roadmap pubblica, aree di contributo e workflow verificabile.

Aree principali:

- Engineering / Zorgax;
- Circular Economy;
- LIFE Health & Research;
- Biography & Personal Research;
- Metaverse Characters;
- Pilot & Business.

È stata mantenuta una separazione rigorosa tra:

- interesse e rapporto professionale;
- contributo accettato e bounty;
- testimonianza personale e verifica indipendente;
- ricerca e affermazione causale;
- contenuti pubblici e dati sensibili/private.

Issue principale: **#797 — LIFE 2027 Master Program Roadmap & Public Index**.

## 9. LIFE circular economy

Sono stati definiti percorsi per:

- canapa industriale e materiali circolari;
- fibre, tessili, biocompositi e biomassa;
- prodotti assorbenti per l'igiene;
- recupero di materie prime seconde;
- riuso dell'acqua e MRV;
- pilot misurabili con baseline, KPI, evidence register e report finale.

Il perimetro evita di trattare cannabis regolamentata/THC/CBD come prodotto commerciale del pilot senza verifica normativa specifica.

Issue di riferimento: **#783, #785, #786, #788**.

## 10. LIFE Health e ricerca

È stata creata una struttura scientifica prudente per documentare esperienze personali e percorsi di salute senza trasformarli in affermazioni causali o consigli terapeutici.

Sono stati preparati pack documentali per:

- SerD/SerT;
- Centro Salute Mentale;
- consenso informato;
- governance privacy;
- data dictionary / CRF;
- piano analisi e pubblicazione;
- verifica tecnica difensiva;
- matrice esperienza/evidenza/valutazione clinica;
- safety e follow-up.

Le informazioni sanitarie restano fuori dai canali pubblici e dalle mailing list LIFE generali.

Issue di riferimento: **#791, #792, #793**.

## 11. Biography e personaggi Metaverse

È stata definita una pipeline per biografia, ricerca personale e personaggi digitali.

Classificazione fonti:

- `MEMORY`;
- `SELF_REPORTED`;
- `DOCUMENTED`;
- `INDEPENDENTLY_VERIFIED`.

Tipi di personaggio:

- `AUTOBIOGRAPHICAL_AVATAR`;
- `PSEUDONYMIZED_RESEARCH_CHARACTER`;
- `FICTIONAL_CHARACTER`.

Workflow proposto:

`DRAFT → CONSENT_CHECK → RIGHTS_CHECK → ASSET_REVIEW → NARRATIVE_REVIEW → APPROVED → PUBLISHED → VERSIONED`

Nessuna clonazione di voce/immagine o impersonazione senza autorizzazione.

Issue di riferimento: **#794, #795, #796**.

## 12. Zorgax email assistant

È stato sviluppato un sistema email basato su consenso esplicito.

Caratteristiche:

- disattivato di default;
- opt-in esplicito;
- topic selezionabili: Zorgax, GitHub, LIFE, Marketplace, Contributors;
- preferenza per email GitHub verificata, poi Google verificata, poi email account;
- nessuno scraping di email pubbliche GitHub;
- unsubscribe;
- coda `QUEUED / SENT / SKIPPED / FAILED`;
- deduplicazione;
- massimo 4 email inviate per utente in 30 giorni;
- cron giornaliero;
- invio SMTP solo quando i secret di produzione vengono configurati.

Per LIFE, i messaggi generali sono separati da LIFE Health e non possono includere dati sanitari o sensibili.

PR di riferimento: **#810 — open**.

## 13. Zorgax dentro GitHub

Zorgax è stato collegato direttamente alle issue e pull request tramite GitHub Actions.

Uso previsto:

```text
/zorgax <richiesta>
```

oppure una menzione `@zorgax`.

Il workflow:

1. riceve il commento dell'utente;
2. legge solo un estratto limitato dell'issue/PR corrente;
3. invia la richiesta all'assistente Zorgax;
4. pubblica la risposta come commento GitHub;
5. ignora commenti generati da bot per evitare loop.

La label `zorgax` può pubblicare istruzioni di attivazione, ma non avvia automaticamente azioni invasive.

Boundary:

- no merge autonomi;
- no push autonomi;
- no pagamenti;
- no approvazioni di spesa;
- no pubblicazione di secret;
- no uso di dati sanitari/sensibili;
- no rappresentanza automatica di soggetti esterni.

PR di riferimento: **#810 — open**.

## 14. Sicurezza e principi comuni

Le nuove implementazioni seguono alcuni principi trasversali:

- **non-custodial by default** per crypto e wallet;
- **consenso esplicito** per email e dati personali;
- **separazione tra login e accesso mailbox**;
- **nessuna seed phrase/private key in database o repository**;
- **nessuna conferma di pagamento derivata dal client**;
- **audit trail** per operazioni sensibili;
- **rate limiting** e anti-abuse;
- **human gates** per pagamenti verificati, moderazione e decisioni sensibili;
- **privacy by design** per LIFE Health, biografia e Metaverse identity;
- **CI/Test/Lint + Security Audit** come gate prima dei merge principali.

## 15. Secret e configurazioni di deployment

Le funzionalità complete richiedono secret/configurazioni esterne che non devono essere committate nel repository.

Esempi:

```text
JWT_SECRET
OAUTH_STATE_SECRET
GOOGLE_LOGIN_CLIENT_ID
GOOGLE_LOGIN_CLIENT_SECRET
GITHUB_OAUTH_CLIENT_ID
GITHUB_OAUTH_CLIENT_SECRET
FACEBOOK_LOGIN_APP_ID
FACEBOOK_LOGIN_APP_SECRET
EVM_VERIFICATION_RPC_URL
ETHEREUM_RPC_URL
ZORGAX_SMTP_HOST
ZORGAX_SMTP_PORT
ZORGAX_SMTP_USER
ZORGAX_SMTP_PASS
ZORGAX_EMAIL_FROM
CRON_SECRET
```

## 16. Stato sintetico delle PR recenti

| PR | Area | Stato |
|---|---|---|
| #801 | Marketplace persistente | merged |
| #802 | Ordini, reputazione, report | merged |
| #804 | Operations, stock, moderation | merged |
| #805 | Seller membership + messaging | open |
| #806 | Social login + identity | merged |
| #807 | Metaverse crypto bridge | open |
| #808 | Login pubblico homepage | merged |
| #809 | Social login SPA production | merged |
| #810 | Zorgax email + GitHub automation + LIFE | open |

## 17. Prossimi gate consigliati

Prima di considerare tutto “live” servono ancora, a seconda del modulo:

1. merge delle PR ancora aperte dopo CI/Security verdi;
2. configurazione dei secret su Vercel/produzione;
3. test reali OAuth sui domini production;
4. test RPC reali per wallet verification e portfolio;
5. configurazione SMTP e cron per email;
6. verifica DNS/domain routing tra `myzubster.com` e `www.myzubster.com`;
7. hardening ulteriore di ticket OAuth, idempotenza Marketplace e transazioni stock/order;
8. monitoraggio runtime e audit dei primi utenti reali.

---

Questo README è pensato come indice operativo delle implementazioni recenti. Per dettagli tecnici puntuali, fare riferimento alle singole pull request, issue e documentazioni sotto `docs/`.
