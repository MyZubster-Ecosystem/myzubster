# MyZubster DAO — README

> Guida evidence-first alla governance MyZubster. Questo documento descrive il modello implementato e i suoi confini; non implica che ogni funzione DAO sia già production-ready o on-chain.

## Cos'è la DAO MyZubster

La DAO è il livello di governance con cui la comunità può strutturare proposte, discussione, voto e decisioni su evoluzione dell'ecosistema MyZubster.

Nel codice corrente una proposta può riguardare:

- `funding` — richieste di finanziamento;
- `feature` — nuove funzionalità;
- `policy` — regole/policy;
- `treasury` — operazioni relative alla tesoreria;
- `parameter_change` — modifica di parametri;
- `other` — altre proposte.

La presenza del modello DAO non significa automaticamente governance decentralizzata on-chain, custodia di fondi o esecuzione autonoma di trasferimenti.

## Flusso generale

```text
Membro / contributor
        ↓
     Proposta
        ↓
       DRAFT
        ↓
      ACTIVE
        ↓
 discussione + voto
        ↓
 quorum + soglia approvazione
        ↓
  PASSED / REJECTED
        ↓
 eventuale esecuzione autorizzata
        ↓
     EXECUTED
```

Una proposta può anche essere `CANCELLED`.

## Stati delle proposte

Il modello applicativo corrente prevede:

- `draft` — proposta preparata ma non ancora in votazione;
- `active` — proposta aperta alla governance;
- `passed` — proposta che ha superato le condizioni previste;
- `rejected` — proposta respinta;
- `executed` — eventuale azione prevista è stata eseguita;
- `cancelled` — proposta annullata.

`passed` e `executed` sono concetti diversi. L'approvazione non deve essere trattata come prova che un pagamento, deploy o altra operazione esterna sia realmente avvenuta.

## Struttura di una proposta

Una proposta contiene concettualmente:

```text
id
title
description
category
proposerId
status
quorum
approvalThreshold
votingStartsAt
votingEndsAt
votesFor
votesAgainst
votesAbstain
totalVotingPower
executionPayload
executedAt
comments
```

Titolo e descrizione devono spiegare chiaramente cosa viene chiesto e quali conseguenze avrebbe l'approvazione.

## Quorum

Il `quorum` rappresenta la partecipazione minima richiesta prima che una votazione possa essere considerata valida secondo le regole applicative.

Il valore di default presente nel modello è `50`, espresso come percentuale prevista dal modello.

Il README non deve però trasformare un valore di default software in una regola costituzionale immutabile: eventuali policy canoniche approvate devono avere precedenza.

## Soglia di approvazione

`approvalThreshold` rappresenta la percentuale minima di voti favorevoli prevista per il passaggio della proposta.

Il valore applicativo di default corrente è `50`.

Quorum e soglia di approvazione rispondono a due domande diverse:

```text
Quorum              → hanno partecipato abbastanza aventi diritto?
Approval threshold  → tra i voti rilevanti, ci sono abbastanza favorevoli?
```

## Tipi di voto

Il tally applicativo distingue:

- voti `FOR`;
- voti `AGAINST`;
- voti `ABSTAIN`.

Il sistema mantiene anche `totalVotingPower`.

La documentazione deve evitare di dichiarare che il voting power corrisponde necessariamente a token on-chain finché il meccanismo effettivo di attribuzione e verifica non è dimostrato.

## Discussione

Le proposte possono contenere commenti con autore, testo e data.

La discussione serve a raccogliere motivazioni, rischi, condizioni, alternative ed evidenze prima della decisione.

Non inserire nei commenti seed phrase, private key, password, token, dati personali non necessari o credenziali di tesoreria.

## Zorgax nella DAO

Zorgax è implementato come **membro AI consultivo**, non come soggetto con potere vincolante.

Il backend dichiara esplicitamente:

```text
entityId: ZORGAX-001
role: advisory_ai_member
binding: false
votingWeight: 0
```

Quindi Zorgax può:

- analizzare una proposta `draft` o `active`;
- indicare `for`, `against` o `abstain` come posizione consultiva;
- assegnare una confidence;
- spiegare la motivazione;
- evidenziare rischi;
- proporre condizioni;
- registrare la propria analisi con un digest SHA-256 dello snapshot della proposta.

Zorgax **non può**:

- aggiungere voting power al tally;
- esprimere un voto token-weighted vincolante;
- approvare autonomamente una spesa;
- dichiarare che la comunità ha raggiunto consenso;
- eseguire autonomamente una transazione di tesoreria;
- trasformare una propria analisi in decisione umana.

Il backend corrente restituisce esplicitamente `humanRatificationRequired: true`.

## Perché il digest della proposta

Quando Zorgax analizza una proposta, il sistema costruisce uno snapshot e calcola un SHA-256.

Questo permette di associare l'analisi alla versione dei dati che Zorgax ha effettivamente ricevuto.

Se successivamente titolo, parametri, tally o execution payload cambiano, una vecchia analisi non deve essere presentata come se riguardasse automaticamente la nuova versione.

## Proposte di funding e treasury

Sono il caso più sensibile.

Una proposta approvata non equivale a:

```text
fondi disponibili
≠ fondi riservati
≠ transazione inviata
≠ transazione confermata
≠ pagamento verificato
```

Per fondi reali bisogna mantenere separati almeno:

```text
DAO proposal
   ↓
DAO approval
   ↓
Treasury authorization/reservation
   ↓
Payment submission
   ↓
Independent verification
   ↓
CONFIRMED / PAID
```

Se manca la prova dell'ultimo passaggio, lo stato finanziario deve rimanere pending/unsettled/unverified secondo la policy applicabile.

## Execution payload

Una proposta può avere un `executionPayload`.

Questo campo descrive dati destinati a un'eventuale fase di esecuzione, ma la sua presenza **non autorizza da sola** l'esecuzione.

Prima di collegare execution payload a sistemi reali servono:

- schema e allowlist delle azioni consentite;
- autenticazione e autorizzazione;
- validazione server-side;
- protezione replay/idempotenza;
- audit log;
- limiti per operazioni irreversibili;
- separazione della tesoreria;
- approvazione umana quando richiesta;
- verifica indipendente degli effetti esterni.

## Esempio pratico: nuova funzione TV

```text
1. Un membro propone: "Aggiungere funzione X a MyZubster TV"
2. Categoria: feature
3. La proposta entra in draft
4. Vengono documentati obiettivo, rischi e costo
5. La proposta diventa active
6. La comunità discute e vota
7. Zorgax può pubblicare un parere NON-BINDING
8. Si verifica quorum e approval threshold
9. Se passa → stato passed
10. Un branch/PR implementa la funzione
11. CI e device QA verificano l'implementazione
12. Solo dopo i gate tecnici si può distribuire
```

Il voto DAO non sostituisce code review, security review o QA.

## Esempio pratico: finanziamento

```text
1. Proposta funding/treasury
2. Importo, asset, destinatario logico e scopo documentati
3. Discussione
4. Zorgax evidenzia rischi/condizioni senza voto vincolante
5. Votazione
6. Se approvata → passed
7. Verifica disponibilità/autorizzazione treasury
8. Eventuale transazione tramite boundary autorizzato
9. Verifica indipendente
10. Solo con evidenza sufficiente → settled/paid
```

Una PR mergiata o una proposta `passed` non è prova di pagamento.

## DAO e bounty

DAO e bounty sono collegabili ma distinti.

La DAO può governare policy, parametri o eventuali allocazioni. Il bounty governa invece un lavoro concreto con requisiti, evidenza, review e reward lifecycle.

```text
DAO → decide una policy/allocazione
Bounty → definisce il lavoro
Contributor → produce evidenza
Review → verifica il lavoro
Reward → viene registrato
Settlement → richiede prova separata
```

## DAO e MYZ

La presenza di voting power o reward MYZ nell'applicazione non deve essere descritta automaticamente come token governance on-chain.

Finché non esiste evidenza tecnica verificata di un meccanismo on-chain, la documentazione deve parlare di **governance applicativa / ledger interno** dove appropriato.

## DAO e wallet

Partecipare alla governance non deve richiedere implicitamente la pubblicazione di seed, private key o credenziali wallet.

Un eventuale wallet è un confine separato dall'identità del personaggio, dall'account MyZubster e dal profilo DAO.

## Sicurezza

Per una DAO production-ready servono almeno:

- autenticazione robusta;
- identità del voter verificata secondo la policy;
- prevenzione del voto duplicato;
- calcolo deterministico del voting power;
- protezione da manipolazione del tally;
- finestre temporali validate server-side;
- quorum e threshold calcolati server-side;
- authorization forte per transizioni di stato;
- execution payload validato/allowlisted;
- audit log append-only o equivalente verificabile;
- separazione tra governance e custody finanziaria;
- nessun segreto nei record pubblici;
- test per accesso cross-user e privilege escalation.

## Evidence boundary

Usare sempre questa distinzione:

### DOCUMENTED
Il comportamento è descritto in documentazione.

### IMPLEMENTED
Esiste codice che implementa il comportamento.

### CI_VERIFIED
I test relativi al commit hanno realmente eseguito con successo.

### DEPLOYED
La versione verificata è distribuita nell'ambiente previsto.

### PRODUCTION_READY
Sono passati anche i gate di sicurezza, governance ed esecuzione necessari.

### ADOPTED
Esiste evidenza di uso reale da parte di soggetti esterni. Non si deduce dal numero di proposte o dal codice.

## Cosa non bisogna affermare senza prova

Non dichiarare automaticamente che:

- MyZubster è una DAO completamente decentralizzata;
- la governance è on-chain;
- MYZ è un token governance on-chain;
- un voto ha trasferito fondi;
- Zorgax ha diritto di voto vincolante;
- una proposta passed è già stata eseguita;
- una decisione DAO costituisce parere legale;
- un bounty approvato è stato pagato.

## Definition of Done della DAO

La DAO può essere definita end-to-end verificata quando è dimostrabile questo percorso:

```text
utente autorizzato
  → crea proposta valida
  → proposta diventa active secondo policy
  → voter autorizzati partecipano una sola volta
  → voting power è verificabile
  → tally/quorum/threshold sono corretti
  → proposta passa o viene respinta deterministicamente
  → eventuale esecuzione richiede authorization appropriata
  → effetto esterno è verificato separatamente
  → audit trail permette di ricostruire la decisione
```

Per proposte finanziarie, `PAID` richiede inoltre evidenza indipendente del settlement.

## Componenti di riferimento

Implementazione corrente rilevante:

- `backend/src/models/Proposal.js` — modello proposta, categorie, stati e tally;
- `backend/src/routes/zorgax-dao.js` — ruolo consultivo di Zorgax;
- `backend/src/models/ZorgaxDaoDecision.js` — record delle decisioni consultive;
- `frontend/src/components/ProposalBoard.js` — superficie UI delle proposte;
- `backend/tests/zorgaxDao.test.js` — test dedicati al ruolo DAO di Zorgax.

Per bounty e settlement valgono inoltre le policy canoniche del repository e `docs/ECOSYSTEM.md`.

---

**Principio fondamentale:** la DAO decide secondo le regole di governance; Zorgax consiglia; il codice implementa; i gate di sicurezza autorizzano; l'evidenza dimostra ciò che è realmente avvenuto.