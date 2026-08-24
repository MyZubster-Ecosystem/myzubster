# MyZubster DAO verificabile

Stato: **MVP implementato, off-chain, non ancora ratificante**

Versione schema: `1.0.0`

Fonte canonica: [`frontend/src/data/daoGovernance.json`](../frontend/src/data/daoGovernance.json)

## Cosa è stato implementato

La DAO è un sistema di governance Git-native con artefatti firmati Ed25519. Non è una pagina che associa un nome arbitrario a un voto e non è presentata come uno smart contract già distribuito.

- ogni proposta è versionata e ha un digest SHA-256 deterministico;
- ogni identità è una coppia Ed25519 generata nel browser;
- la chiave privata resta non esportabile in IndexedDB;
- una scheda contiene network, proposta, digest, scelta, nonce e data di firma;
- il server verifica firma, DID, digest e finestra temporale senza custodire la chiave;
- il ledger Git è la fonte di verità pubblica e replicabile;
- comunità e steward costituiscono due camere separate;
- quorum e soglia del 60% devono essere soddisfatti in entrambe;
- una ratifica ha un timelock di 48 ore;
- nessun trasferimento di tesoreria o settlement MYZ è automatico;
- Zorgax e tutte le entità AI sono consultive e hanno peso vincolante zero.

## Perché “off-chain Git-native”

Il repository non contiene oggi un token di voto distribuito, un registro identità Sybil-resistant o uno smart contract già distribuito. Dichiarare la DAO “on-chain” sarebbe quindi scorretto.

Git fornisce cronologia, revisione, mirroring e contenuti verificabili. Le firme Ed25519 rendono indipendente la verifica degli autori dei singoli artefatti. GitHub è il relay iniziale del workflow, ma un clone del repository conserva il ledger e può verificarlo senza fidarsi del server web.

Questo modello non elimina tutti i punti di coordinamento: l'ammissione dei membri e il merge del ledger restano processi umani revisionati. Lo stato `BOOTSTRAP` lo rende esplicito.

## Modello di decisione

Una proposta passa soltanto quando, dopo la chiusura:

1. la camera `community` raggiunge quorum 3;
2. la camera `stewards` raggiunge quorum 2;
3. in entrambe le camere i voti `for` sono almeno il 60% dei voti decisivi (`for + against`);
4. tutte le schede conteggiate appartengono a membri umani attivi nel registro;
5. sono trascorse 48 ore di timelock;
6. un maintainer applica la modifica attraverso una pull request con evidenze.

L'astensione partecipa al quorum ma non al denominatore dell'approvazione.

## Identità e resistenza Sybil

Una chiave pubblica da sola non dimostra che dietro vi sia una persona unica. Per questo:

- una nuova chiave può produrre una scheda osservatore verificabile;
- la scheda osservatore non entra nel quorum;
- l'ammissione richiede prova di controllo, dichiarazione dei conflitti e due reviewer indipendenti;
- solo una pull request al registro canonico attribuisce una o più camere alla chiave;
- un attore `ai` non può ricevere peso vincolante.

Prima dell'ammissione del primo nucleo di membri, nessuna proposta può essere ratificata. Questo è un blocco di sicurezza, non un errore operativo.

## Deleghe

Le deleghe usano lo stesso formato firmato e possono essere globali o limitate a una proposta. La Costituzione limita la profondità a un solo passaggio per evitare catene opache.

- una delega non è canonica finché non entra nel ledger;
- l'auto-delega è rifiutata;
- la revoca è un nuovo artefatto firmato;
- il voto diretto del delegante deve avere precedenza su una delega;
- una delega scaduta non può essere conteggiata.

L'aggregatore canonico applica la delega diretta al voto del delegato usando le camere del delegante. Un voto diretto del delegante prevale sempre; catene di profondità superiore a uno non vengono seguite e i cicli bloccano il merge. La revoca firmata più recente per lo stesso scope disattiva la delega precedente.

## Merge gate del ledger

Il workflow `DAO Ledger Integrity` viene eseguito per ogni modifica al registro o al verificatore. `scripts/validate-dao-ledger.js` blocca il merge quando rileva:

- firma o chiave Ed25519 non valida;
- DID non derivato dalla chiave pubblica;
- membro osservatore o AI in un artefatto vincolante;
- più schede dello stesso DID per la stessa proposta;
- nonce o ricevuta riutilizzati;
- digest di ricevuta non corrispondente;
- delega ciclica, scaduta, auto-diretta o verso uno scope sconosciuto;
- quorum, soglie o finestre temporali malformati;
- esecuzione automatica o settlement esterno abilitati nel registro.

Il risultato è disponibile anche su `GET /api/dao/integrity`.

## Collegamento a entità e bounty

`MIP-001` propone la ratifica del programma `MYZ-ENTITY-COMPLETION-001`, che include 24 bounty per completamento operativo e kit visuali. `MIP-002` propone lo standard visuale. `MIP-003` avvia l'ammissione degli steward umani.

Una ratifica non finanzia automaticamente una bounty e non crea una promessa di pagamento esterno. MYZ resta un'unità di contabilità interna finché non esiste una politica finanziaria separata, lecita, finanziata e auditabile.

## API

| Metodo | Endpoint | Funzione |
|---|---|---|
| `GET` | `/api/dao` | Registro, Costituzione, riepilogo e proposte |
| `GET` | `/api/dao/constitution` | Regole di governance |
| `GET` | `/api/dao/members` | Membri ammessi senza dati privati |
| `GET` | `/api/dao/integrity` | Esito del validatore canonico |
| `GET` | `/api/dao/proposals` | Proposte e tally per camera |
| `GET` | `/api/dao/proposals/:id` | Proposta, digest e stato |
| `POST` | `/api/dao/ballots/verify` | Verifica stateless di una scheda firmata |
| `POST` | `/api/dao/delegations/verify` | Verifica stateless di delega o revoca |

Gli endpoint di verifica restituiscono una ricevuta e un collegamento per proporre l'artefatto al ledger. La ricevuta ha `canonical: false` finché l'artefatto non è revisionato e mergiato.

## Formato della scheda

```json
{
  "payload": {
    "schemaVersion": "1.0.0",
    "networkId": "myzubster-dao-v1",
    "proposalId": "MIP-001",
    "proposalDigest": "sha256:…",
    "voterDid": "did:myz:…",
    "publicKeySpki": "MCowBQYDK2VwAyEA…",
    "choice": "for",
    "reason": "…",
    "nonce": "32-caratteri-esadecimali",
    "issuedAt": "2026-08-25T12:00:00.000Z"
  },
  "signature": "base64…"
}
```

Le chiavi dell'oggetto sono serializzate in ordine lessicografico prima della firma. La stessa funzione `stableStringify` è presente nel client e nel verificatore Node.

## Controlli di sicurezza già coperti

- alterazione della scelta dopo la firma;
- sostituzione del DID;
- digest di proposta obsoleto o falso;
- voto fuori finestra;
- algoritmo diverso da Ed25519;
- nonce malformato;
- auto-delega;
- quorum incompleto;
- rate limit sugli endpoint di verifica;
- esecuzione automatica disabilitata.

## Passi necessari prima di una ratifica reale

1. Revisione indipendente del codice crittografico e del threat model.
2. Ammissione trasparente dei primi membri umani.
3. Rendere obbligatorio il check `DAO Ledger Integrity` nelle regole del branch `main`.
4. Proteggere il branch canonico con requisito di almeno due approvazioni indipendenti.
5. Backup/mirror del repository e procedura di recovery.
6. Eventuale contratto on-chain separato, solo dopo scelta della chain, audit e decisione esplicita della comunità.
