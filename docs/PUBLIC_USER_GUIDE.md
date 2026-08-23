# Guida pubblica a MyZubster

Questa guida spiega come usare MyZubster da utente, contributor e tester senza confondere funzionalità pubbliche, build di sviluppo e componenti ancora in revisione.

> **Principio di trasparenza:** una funzione descritta nel repository non è automaticamente una funzione production-ready. Le sezioni sotto distinguono ciò che è pubblico e utilizzabile da ciò che è ancora in review, debug o sperimentale.

## Stato rapido

| Area | Stato pubblico | Cosa significa |
|---|---|---|
| Sito e superfici web MyZubster | **MVP / active development** | Utilizzabili per esplorazione e test; alcune aree possono cambiare. |
| Community / marketplace pubblico | **MVP** | Account, mappa/community e annunci sono superfici applicative in sviluppo attivo. |
| Zorgax | **Development / configuration-dependent** | La UI può essere aperta; le funzioni AI complete dipendono dalla configurazione del backend. |
| Fumetto / Chronicle / visual | **Public narrative/documentation** | Servono a spiegare o raccontare il sistema; non sono evidence reale. |
| Google TV / Android TV | **Debug / in review** | APK debug disponibile; compatibilità fisica con TV reale deve ancora essere validata. |
| Creator personaggio TV | **In review** | Flusso implementato in PR, non ancora dichiarato production-ready. |
| Sincronizzazione personaggio account | **In review** | API autenticata implementata in PR, non ancora dichiarata production-ready. |
| Wallet verification | **Core tested / not runtime-enabled** | Verifica firma isolata e testata; non è ancora un flusso marketplace production. |
| NFT / smart contracts | **Experimental / review required** | Contratti e verifier sono separati, testati localmente, ma non auditati/deployati come release production. |
| MYZ | **Internal reward/accounting layer** | Non equivale automaticamente a denaro, token on-chain o pagamento esterno. |

## 1. Entrare in MyZubster dal Web

Sito canonico:

`https://www.myzubster.com/`

Il flusso concettuale principale è:

`OBSERVE → DOCUMENT → CONNECT → COLLABORATE → VERIFY → PUBLISH → REWARD / SETTLEMENT`

In pratica puoi esplorare le superfici pubbliche, consultare mappe/community/visual, registrare un account dove disponibile, partecipare come contributor attraverso GitHub e aprire Zorgax quando il servizio backend è configurato.

## 2. Account MyZubster

La superficie Community include registrazione e login:

`https://www.myzubster.com/community`

Dopo il login, la sessione web usa il token applicativo MyZubster. Non condividere mai password, token di sessione, seed phrase, private key, credenziali API o file `.env`.

Le informazioni wallet eventualmente mostrate nei profili devono essere **solo indirizzi pubblici scelti dall’utente**.

## 3. Community, mappa e marketplace

Apri:

`https://www.myzubster.com/community`

oppure:

`https://www.myzubster.com/marketplace`

La superficie Community permette di esplorare la mappa, luoghi verdi, profili community e annunci.

Per gli annunci e gli scambi:

- usa informazioni pubbliche e non sensibili;
- evita indirizzi privati precisi quando non necessari;
- non inserire chiavi private o seed;
- descrivi chiaramente se un annuncio è regalo, baratto o usa una valuta prevista dal modulo;
- per animali, usa la sezione in modo responsabile per adozioni, smarriti/trovati o servizi.

## 4. Usare Zorgax

Percorso previsto:

`https://www.myzubster.com/zorgax`

Zorgax è l'assistente AI dell'ecosistema MyZubster. Può essere usato come punto di accesso conversazionale per comprendere il progetto, orientarsi tra i moduli e, nelle versioni in sviluppo, accompagnare la creazione del personaggio.

### Importante

La disponibilità della pagina non garantisce che il modello AI backend sia operativo. Se il backend/API non è configurato, la UI può risultare disponibile mentre le risposte AI complete non lo sono.

Non inviare a Zorgax password, token, seed phrase, private key, segreti aziendali o dati personali non necessari.

## 5. Fumetto, Chronicle e visual

Percorso pubblico:

`https://www.myzubster.com/fumetto`

I visual, Chronicle e fumetti aiutano a capire l'universo MyZubster.

**Non sono automaticamente evidence.** Un'immagine, un fumetto, uno screenshot o un concept AI non dimostra da solo che un'azione fisica, un pagamento, una partnership o un deployment siano avvenuti.

Quando un asset è marcato `CONCEPT-NOT-EVIDENCE`, va interpretato letteralmente come concept.

## 6. MyZubster Google TV / Android TV

È disponibile una **debug build** pubblica per test.

GitHub prerelease:

`https://github.com/MyZubster-Ecosystem/myzubster/releases/tag/google-tv-debug-001`

Asset: `app-debug.apk`

SHA-256:

`f8a6f9c53b0647c282a0c4fcafd969d6885f6b0e59e7723895769afe088fa704`

### Attenzione

Questa è una **build debug**, non una release Play Store e non una build production firmata.

Prima dell'installazione verifica l'hash:

```powershell
Get-FileHash .\app-debug.apk -Algorithm SHA256
```

### Installazione con ADB

Abilita le opzioni sviluppatore e il debugging sul dispositivo Google TV / Android TV, autorizza il computer e verifica la connessione:

```bash
adb devices
```

Poi installa:

```bash
adb install -r app-debug.apk
```

La guida tecnica completa è in [`docs/google-tv/README.md`](google-tv/README.md).

### Cosa testare sulla TV

- apertura dal launcher;
- D-pad su/giù/destra/sinistra;
- tasto OK/Enter;
- tasto Back;
- caricamento WebView;
- leggibilità a distanza;
- ripresa dopo sospensione;
- assenza di crash.

Finché questi test non sono completati su hardware reale, la compatibilità TV resta **non certificata**.

## 7. Creare il personaggio MyZubster dalla TV

Il creator personaggio TV è attualmente **in review**.

Il flusso previsto è:

`MyZubster TV → Crea personaggio → Nome → Archetipo → Ruolo → Valore guida → Anteprima → Salva → Zorgax`

Archetipi previsti: Esploratore, Sentinella, Costruttore, Cronista.

Ruoli previsti: Custode, Contributor, Ricercatore, Creatore.

Valori guida previsti: Cura, Verifica, Collaborazione, Impatto.

### Persistenza

Il creator mantiene un draft locale sul dispositivo. Il completamento in review aggiunge anche la sincronizzazione nell'account MyZubster quando esiste una sessione autenticata.

La creazione del personaggio **non crea automaticamente un NFT** e non prova l'identità reale dell'utente.

## 8. Personaggio MyZubster e account

La sincronizzazione account è progettata per mantenere lo stesso profilo personaggio tra diversi client MyZubster.

Il profilo applicativo contiene dati come nome personaggio, archetipo, ruolo e valore guida. Questi dati sono dati applicativi, non una verifica legale dell'identità e non richiedono un wallet.

## 9. Wallet: cosa significa “verificato”

Il progetto sta sviluppando una verifica wallet EVM basata su challenge firmata.

L'obiettivo è dimostrare che l'utente controlla una determinata chiave pubblica **senza mai inviare la private key al server**.

Un flusso corretto deve usare challenge breve e a scadenza, nonce monouso, user ID autenticato, chain ID, indirizzo wallet e verifica della firma lato server.

La private key e la seed phrase devono restare sempre nel wallet dell'utente.

Il core di questo meccanismo è testato, ma non deve ancora essere interpretato come marketplace wallet production-ready.

## 10. NFT e personaggi on-chain

Il progetto include un percorso sperimentale per personaggi ERC-721 e marketplace.

Stato attuale:

- core smart contract isolato e testato localmente;
- verifica receipt di mint isolata e testata;
- nessun deploy production dichiarato da questa guida;
- nessun audit indipendente dichiarato;
- nessuna promessa di valore economico.

Prima di una vera attivazione on-chain servono almeno review/audit smart contract, chain e indirizzi approvati, configurazione RPC sicura, wallet verification integrata, replay protection, rate limiting, monitoraggio e policy metadata/marketplace.

**Non inviare mai private key o seed phrase a MyZubster.**

## 11. MYZ, reward e pagamenti

MYZ è attualmente descritto dal progetto come **unità interna di reward/accounting**.

Quindi:

- un saldo MYZ non prova un pagamento esterno;
- un merge GitHub non prova un pagamento;
- un issue chiuso non prova un pagamento;
- un NFT non garantisce valore economico;
- XMR, fiat o altri settlement esterni devono essere verificati separatamente quando realmente previsti e finanziati.

Le regole canoniche sono in [`BOUNTIES.md`](../BOUNTIES.md), [`TREASURY.md`](../TREASURY.md) e [`REWARDS_LEDGER.md`](../REWARDS_LEDGER.md).

## 12. Contribuire a MyZubster

Repository principale:

`https://github.com/MyZubster-Ecosystem/myzubster`

Per iniziare:

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster
npm ci
npm test
npm run build --if-present
```

Poi scegli un issue chiaro, leggi gli acceptance criteria, crea una branch, implementa una modifica piccola e verificabile, aggiungi test/evidence e apri una pull request.

Non presentare un PR come “completato” prima che review, merge e verifica reale siano avvenuti.

## 13. Come leggere lo stato di una funzionalità

Usa questa scala:

```text
CONCEPT
  ↓
CODE COMPLETE
  ↓
REVIEW READY
  ↓
MERGED
  ↓
DEPLOYED / RELEASED
  ↓
REAL-WORLD VERIFIED
  ↓
ADOPTED
```

Una funzione può essere tecnicamente implementata ma non ancora distribuita. Una build può essere distribuita ma non ancora verificata su hardware reale. Una feature funzionante non implica automaticamente adozione pubblica.

## 14. Segnalare problemi

Quando segnali un bug, includi solo informazioni non sensibili:

- pagina/modulo;
- dispositivo e browser/TV;
- versione o release;
- passaggi per riprodurre;
- risultato atteso;
- risultato ottenuto;
- screenshot sanitizzato se utile.

Non pubblicare token, password, cookie, private key, seed phrase o dati personali non necessari.

## 15. Percorso consigliato per un nuovo utente

```text
1. Apri www.myzubster.com
2. Leggi Come funziona / README
3. Esplora Community e mappa
4. Apri fumetto/visual per capire l'universo
5. Prova Zorgax se il backend è disponibile
6. Se vuoi contribuire, passa al repository GitHub
7. Se vuoi testare Google TV, usa solo la prerelease debug e verifica l'hash
8. Tratta character creator, wallet e NFT secondo lo stato indicato, senza considerarli production finché i gate non sono chiusi
```

## Regola finale

MyZubster è un ecosistema open-source in sviluppo attivo. Mantieni sempre separate:

- **documentazione** da **evidence**;
- **codice** da **deployment**;
- **reward interno** da **pagamento esterno**;
- **personaggio applicativo** da **identità reale**;
- **personaggio** da **NFT**;
- **wallet pubblico** da **private key/seed**.

Questa separazione è parte del modello di sicurezza e trasparenza di MyZubster.
