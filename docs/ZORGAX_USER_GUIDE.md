# Zorgax — Guida pratica all'uso

> Guida utente per capire cosa fa Zorgax, come chiedergli di lavorare e come interpretare correttamente i suoi risultati nel contesto MyZubster.

## Cos'è Zorgax

Zorgax è il livello operativo e di intelligence di MyZubster. Aiuta a osservare lo stato dell'ecosistema, verificare evidenze, diagnosticare problemi, proporre modifiche delimitate, creare documentazione e visuali, monitorare segnali pubblici e coordinare lavoro tramite GitHub.

Zorgax non sostituisce la verifica umana e non trasforma automaticamente una segnalazione in un fatto confermato.

```text
OSSERVA → VERIFICA → CLASSIFICA → AGISCE IN MODO DELIMITATO → DOCUMENTA → REVISIONE UMANA
```

## Cosa puoi chiedere a Zorgax

Puoi usare Zorgax per attività come:

- controllare CI, build, deploy e stato operativo;
- diagnosticare una PR o un workflow GitHub;
- trovare problemi di sicurezza o dipendenze critiche;
- creare o aggiornare documentazione;
- preparare una Draft PR su branch dedicato;
- controllare segnali pubblici di adozione o contributi esterni;
- verificare fonti ufficiali LIFE / UE / MASE;
- creare visuali MyZubster evidence-first;
- coordinare i flussi TV, orti, personaggi e Chronicle;
- separare chiaramente evidence reale, documentazione visuale e narrazione.

## Come formulare una richiesta

Una richiesta efficace contiene tre elementi:

1. **Obiettivo** — cosa vuoi ottenere.
2. **Ambito** — repository, PR, feature o area interessata.
3. **Vincoli** — cosa non deve essere toccato.

Esempio:

```text
Controlla la Draft PR della TV, trova il problema più importante,
correggilo solo se è verificato e a basso rischio.
Non mergiare e non modificare segreti.
```

Oppure:

```text
Crea una guida GitHub su come monitorare il proprio orto dalla TV.
Usa branch dedicato e Draft PR.
```

## Modalità Ecosystem Operator

Quando gli chiedi di agire come Zorgax Ecosystem Operator, Zorgax dovrebbe scegliere autonomamente una sola priorità concreta tra:

- sicurezza, secrets e dipendenze critiche;
- CI, build, deploy e salute operativa;
- repository, PR e issue rilevanti;
- documentazione e visuali evidence-first;
- segnali pubblici verificabili di adozione;
- Programma LIFE e fonti ufficiali;
- web intelligence su fonti primarie e indipendenti.

La regola è: **un intervento utile e verificato per esecuzione è meglio di molte modifiche speculative.**

## Come Zorgax deve lavorare su GitHub

Per modifiche al codice o alla documentazione:

```text
main/master
   │
   └── branch dedicato
          │
          └── modifica delimitata
                 │
                 └── Draft PR
                        │
                        └── review umana
```

Zorgax non dovrebbe:

- fare push diretto su `main` o `master`;
- fare force push;
- mergiare automaticamente;
- cambiare secrets, credenziali, billing o permessi;
- modificare dati persistenti senza un gate esplicito;
- leggere o pubblicare `.env`, token, password, seed o private key.

## Come interpreta CI e incidenti

Zorgax separa sempre:

```text
SINTOMO
↓
CAUSA VERIFICATA
↓
IPOTESI ANCORA NON PROVATA
```

Esempio:

```text
Sintomo: workflow = action_required
Causa verificata: GitHub ha bloccato l'esecuzione prima dei job
Non dimostrato: test falliti o regressione del codice
```

Questo evita di attribuire un errore al codice senza evidenza.

## Come interpreta adozione e contributi

Zorgax usa una scala conservativa:

```text
DISCOVERY
INTEREST
FORK
CONTRIBUTION
INTEGRATION
DEPLOYMENT
VERIFIED_ADOPTION
```

Un fork non è un'adozione.
Una PR non è un deployment.
Un commento positivo non è una partnership.
Un pagamento dichiarato non è un pagamento verificato senza evidenza indipendente.

## Evidence, visuali e Chronicle

Zorgax distingue tre categorie fondamentali:

### Evidence reale

Esempi:

- stato GitHub verificabile;
- output CI;
- commit o PR;
- fonte istituzionale ufficiale;
- stream reale autorizzato;
- osservazione reale documentata.

### DOCUMENTATION_VISUAL

Un diagramma, una mappa o un'infografica che spiega il sistema.

Non è una prova che il sistema sia effettivamente deployed o adottato.

### NARRATIVE_ILLUSTRATION

Un fumetto, ambiente cyberpunk, personaggio o scena narrativa.

Serve per storytelling e metaverso, non per dimostrare eventi del mondo reale.

```text
NARRAZIONE ≠ DOCUMENTAZIONE ≠ EVIDENCE
```

## Usare Zorgax con MyZubster TV

Dalla TV, Zorgax può diventare un punto di accesso alle funzioni intelligenti dell'ecosistema.

Esempi futuri o in revisione:

- aprire Zorgax dal proprio personaggio;
- chiedere lo stato del proprio orto;
- interpretare dati dei sensori;
- aprire My Garden Live;
- esplorare Chronicle e visuali;
- ricevere spiegazioni sullo stato di una missione.

Le azioni che modificano dati reali devono comunque rispettare autenticazione, ownership e autorizzazioni lato server.

## Zorgax e il proprio personaggio

Il personaggio MyZubster può rappresentare il contesto dell'utente nelle esperienze digitali.

Il flusso concettuale è:

```text
UTENTE
  ↓
PERSONAGGIO MYZUBSTER
  ↓
CONTESTO / RUOLO / PREFERENZE
  ↓
ZORGAX
  ↓
ESPERIENZE MYZUBSTER
```

Il personaggio non è automaticamente una prova di identità reale, un wallet o un NFT.

## Esempi di richieste utili

### Controllare l'ecosistema

```text
Agisci come Zorgax Ecosystem Operator e scegli la priorità più importante.
Completa un solo intervento verificato e sicuro.
```

### Diagnosi GitHub

```text
Controlla la PR #123, separa sintomo, causa e ipotesi.
Correggi solo se la modifica è delimitata e a basso rischio.
```

### Documentazione

```text
Crea una guida utente GitHub per questa funzione.
Non dichiararla production-ready se non è stata verificata end-to-end.
```

### Adozione

```text
Controlla questo segnale esterno e classificalo come DISCOVERY,
INTEREST, FORK, CONTRIBUTION, INTEGRATION, DEPLOYMENT o VERIFIED_ADOPTION.
```

### LIFE

```text
Controlla le ultime fonti ufficiali CINEA/UE per il Programma LIFE.
Non inventare partner, eligibility, budget, KPI o scadenze.
```

## Quando fidarsi del risultato

Un risultato Zorgax è più forte quando include:

- fonte verificabile;
- stato preciso;
- distinzione fra fatto e ipotesi;
- diff o modifica delimitata;
- test o controllo riproducibile;
- confini espliciti su ciò che non è stato verificato.

Esempio corretto:

```text
CI verde = test automatizzati superati
```

Esempio scorretto:

```text
CI verde = prodotto sicuramente funzionante su ogni dispositivo
```

## Stati di maturità

Per evitare confusione, interpreta le feature con una progressione simile:

```text
CONCEPT
IMPLEMENTED
IN_REVIEW
CI_VERIFIED
MERGED
DEPLOYED
REAL_WORLD_VERIFIED
ADOPTED
```

Questi stati non sono equivalenti.

## Sicurezza e privacy

Non fornire mai a Zorgax:

- password;
- seed phrase;
- private key;
- token API non necessari;
- segreti `.env`;
- credenziali di telecamere;
- dati personali non necessari.

Per telecamere, wallet e servizi autenticati, il design corretto usa autorizzazioni server-side e credenziali temporanee quando possibile.

## Regola finale

Zorgax deve essere usato come **operatore evidence-first**, non come generatore di dichiarazioni.

```text
VELOCE, MA VERIFICABILE
AUTONOMO, MA DELIMITATO
CREATIVO, MA CHIARO SULLA PROVENANCE
OPERATIVO, MA CON REVIEW UMANA
```

## Documentazione correlata

- [`ZORGAX_SYSTEM.md`](ZORGAX_SYSTEM.md) — architettura completa;
- [`ZORGAX_AUTOMATION.md`](ZORGAX_AUTOMATION.md) — automazioni operative;
- [`MYZUBSTER_METAVERSE.md`](MYZUBSTER_METAVERSE.md) — world layer / metaverso GitHub-native;
- [`TV-MODE.md`](TV-MODE.md) — esperienza TV;
- guide TV/personaggio e My Garden Live nelle rispettive Draft PR fino al merge.
