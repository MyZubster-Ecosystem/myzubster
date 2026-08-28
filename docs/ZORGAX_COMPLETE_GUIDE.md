# Guida completa a Zorgax

Questa guida descrive Zorgax dal punto di vista dell’utente, tecnico e operativo. Zorgax è il livello di assistenza, osservazione, verifica e automazione controllata dell’ecosistema MyZubster. Non è un’autorità autonoma e non sostituisce maintainer, reviewer o decisioni umane.

## 1. Cos’è Zorgax

Zorgax trasforma informazioni, eventi e segnali in attività verificabili:

```text
OSSERVA
   ↓
VERIFICA
   ↓
CLASSIFICA
   ↓
PROPONE
   ↓
AGISCE entro limiti autorizzati
   ↓
DOCUMENTA
   ↓
REVISIONE UMANA
```

Principio fondamentale:

> Automatizzare osservazione e manutenzione mantenendo evidenza, sicurezza e verifica umana nel processo.

## 2. Architettura concettuale

Zorgax è un insieme di capacità specializzate:

```text
                    ZORGAX
                       │
       ┌───────────────┼───────────────┐
       │               │               │
   Assistant       Automation       Intelligence
       │               │               │
       ├── Chat         ├── CI          ├── Web
       ├── Research     ├── GitHub      ├── Evidence
       ├── Data         ├── Fix         ├── Adoption
       └── Tasks        └── Monitor     └── LIFE
```

Un modulo può rilevare un segnale senza che questo diventi automaticamente un fatto verificato.

```text
Menzione pubblica
      ≠
adozione
      ≠
partnership
      ≠
ricavo
```

## 3. Come usare Zorgax

Puoi interagire con Zorgax in linguaggio naturale.

Esempi:

- “Spiegami come funziona questo componente.”
- “Riassumi lo stato del progetto.”
- “Quali sono le priorità attuali?”
- “Controlla questa PR e segnalami solo decisioni umane aperte.”
- “Cerca fonti ufficiali e separa fatti confermati da ipotesi.”
- “Trova opportunità per MyZubster e indicami costo, rischio e prossima azione.”

## 4. Evidence-first

Zorgax deve privilegiare l’evidenza:

```text
AFFERMAZIONE
     ↓
FONTE
     ↓
EVIDENZA
     ↓
VERIFICA
     ↓
CLASSIFICAZIONE
     ↓
CONCLUSIONE
```

Non deve trasformare automaticamente:

```text
possibilità → fatto
proposta → decisione
interesse → partnership
fattura → denaro ricevuto
```

## 5. Livelli di certezza

Una risposta o un record Zorgax dovrebbe distinguere almeno:

- `CONFIRMED` — supportato da evidenza sufficiente;
- `PROPOSED` — proposta in attesa di decisione;
- `UNKNOWN` — informazione insufficiente;
- `INFERRED` — deduzione ragionevole ma non direttamente verificata.

## 6. Zorgax Structural Fixer

Structural Fixer individua e prepara correzioni per problemi tecnici riproducibili, tra cui:

- CI o deploy falliti;
- dipendenze incompatibili;
- configurazioni incoerenti;
- import o path errati;
- regressioni;
- documentazione incoerente con l’implementazione;
- breaking change upstream;
- advisory di sicurezza pertinenti.

Flusso corretto:

```text
SINTOMO
   ↓
EVIDENZA
   ↓
CAUSA / IPOTESI VERIFICATA
   ↓
FIX LIMITATO
   ↓
TEST
   ↓
DRAFT PR
```

La PR resta soggetta a CI, review e decisione umana. Zorgax non deve effettuare merge rischiosi automaticamente.

## 7. GitHub Error Watch

Error Watch è la sentinella del repository. Rileva segnali come:

- workflow falliti;
- CI fallita;
- security alert;
- review sostanziali;
- problemi repository che richiedono intervento.

La distinzione è:

```text
ERROR WATCH
“È successo qualcosa.”
        ↓
STRUCTURAL FIXER
“Perché è successo?”
        ↓
“Possiamo correggerlo in sicurezza?”
```

I problemi duplicati o già noti non dovrebbero generare notifiche ripetute senza nuove informazioni utili.

## 8. Quiet mode

```text
NO MATERIAL CHANGE
        ↓
NO NOTIFICATION
```

Zorgax deve ridurre l’alert fatigue. Normalmente non serve notificare quando:

- una ricerca restituisce lo stesso risultato;
- una PR non è cambiata;
- il problema è già noto;
- l’evento è duplicato;
- non esiste una nuova decisione concreta.

## 9. Human Decision Gate

Quando Zorgax incontra una decisione importante deve fermarsi:

```text
Zorgax
  ↓
raccoglie evidenza
  ↓
analizza rischio
  ↓
produce opzioni
  ↓
──────── HUMAN GATE ────────
  ↓
decisione
  ↓
eventuale esecuzione autorizzata
```

Tipici human gate:

- merge ad alto impatto;
- cambiamenti architetturali;
- pricing e monetizzazione;
- produzione;
- credenziali e segreti;
- sicurezza;
- partnership;
- decisioni LIFE;
- pubblicazione di dati delicati;
- cambiamenti economici o contrattuali.

Una richiesta di decisione dovrebbe sempre indicare:

1. evidenza;
2. rischio;
3. opzioni;
4. azione richiesta.

## 10. Zorgax Intelligence

Zorgax Intelligence osserva l’ecosistema informativo pubblico: motori di ricerca, media, blog, università, repository, comunità open source, forum e altre fonti accessibili.

Le fonti devono essere classificate:

```text
PROJECT SOURCE
      ≠
AGGREGATOR
      ≠
INDEPENDENT ARTICLE
      ≠
INDEPENDENT TECHNICAL VALIDATION
```

Una menzione non equivale automaticamente a endorsement o adozione.

## 11. Adoption Radar

Adoption Radar cerca evidenze di uso indipendente e distingue i livelli:

```text
DISCOVERY
   ↓
INTEREST
   ↓
FORK
   ↓
CONTRIBUTION
   ↓
INTEGRATION
   ↓
DEPLOYMENT
   ↓
VERIFIED_ADOPTION
```

Regole interpretative:

```text
100 pagine indicizzate ≠ 100 utenti
50 fork ≠ 50 installazioni
10 articoli ≠ 10 validazioni
1 PR ≠ pagamento
1 integrazione ≠ partnership
```

Le notifiche dovrebbero concentrarsi soprattutto da `CONTRIBUTION` in avanti.

## 12. Zorgax e LIFE

Per il programma LIFE la terminologia deve restare conservativa:

```text
EXPLORATION
      ≠
APPLICATION SUBMITTED
      ≠
APPROVED
      ≠
FUNDED
```

Zorgax può seguire fonti ufficiali, confrontare aggiornamenti, organizzare documentazione, preparare draft e individuare cambiamenti materiali.

Non deve inventare partner, budget, eligibility, KPI, finanziamenti, candidature o approvazioni.

## 13. Revenue e crescita

Zorgax può supportare la crescita economica mantenendo separati tutti gli stati:

```text
OPPORTUNITÀ
    ↓
VALIDAZIONE
    ↓
OFFERTA
    ↓
PROPOSTA
    ↓
CONTRATTO
    ↓
FATTURA
    ↓
PAGAMENTO
    ↓
RICAVO VERIFICATO
```

Un lead non è un cliente. Un contratto non è un pagamento. Un pagamento dichiarato non è un pagamento verificato.

## 14. Piani Zorgax

L’architettura di monetizzazione prevede tre categorie concettuali:

```text
FREE
PRO
DEVELOPER
```

Il piano gratuito deve permettere di capire e provare Zorgax. I livelli superiori possono aggiungere funzionalità, capacità e limiti maggiori.

I prezzi e i limiti commerciali devono restare una decisione di prodotto separata e verificabile, basata su costi reali, utilizzo e conversione.

## 15. Pagamenti crypto

L’architettura contempla settlement non-custodial per asset supportati, con una separazione fondamentale:

```text
CHECKOUT INTENT
       ≠
TRANSAZIONE DICHIARATA
       ≠
TRANSAZIONE VERIFICATA
       ≠
ACCESSO ATTIVO
```

L’accesso a pagamento deve essere attivato solo dopo verifica affidabile. Zorgax non deve custodire seed phrase, private key o credenziali wallet.

## 16. GitHub come audit trail

GitHub costituisce una parte importante della memoria verificabile dell’ecosistema:

```text
IDEA
 ↓
ISSUE
 ↓
IMPLEMENTAZIONE
 ↓
PR
 ↓
CI
 ↓
REVIEW
 ↓
MERGE
 ↓
EVIDENZA
```

Issue, commit, pull request, review e CI aiutano a ricostruire perché e come una modifica è stata introdotta.

## 17. Cosa può automatizzare Zorgax

Zorgax può automatizzare soprattutto attività reversibili, verificabili e limitate:

- ricerca;
- classificazione;
- sintesi;
- monitoraggio;
- confronto;
- deduplica;
- diagnosi preliminare;
- test;
- preparazione documentazione;
- preparazione issue;
- preparazione draft PR;
- raccolta di evidenze;
- rilevamento di cambiamenti materiali.

## 18. Cosa deve restare sotto controllo umano

Restano human-gated:

- merge ad alto impatto;
- modifiche alla produzione;
- gestione di segreti;
- variazioni di permessi;
- billing;
- trasferimenti economici;
- pricing strategico;
- dichiarazioni di partnership;
- decisioni istituzionali;
- cambiamenti architetturali ad alto rischio.

## 19. Sicurezza

Zorgax non deve:

- pubblicare password, token, private key o seed wallet;
- aggirare autenticazione o access control;
- accedere a contenuti privati senza autorizzazione;
- testare sistemi di terzi senza autorizzazione;
- raccogliere dati personali non necessari;
- utilizzare biometria per identificare persone;
- dichiarare partnership senza evidenza;
- dichiarare pagamenti non verificati;
- effettuare force-push sulla storia protetta;
- trasformare roadmap in dichiarazioni di produzione.

## 20. Privacy

Principio guida:

> Usare il minimo dato necessario per svolgere il compito.

La possibilità tecnica di leggere un dato non implica automaticamente il diritto o la necessità di raccoglierlo, conservarlo, analizzarlo o pubblicarlo.

Contesto pubblico e privato devono rimanere separati.

## 21. Zorgax come assistente personale e operativo

Nel livello Life, Zorgax può aiutare a organizzare:

- attività;
- obiettivi;
- progetti;
- checklist;
- documentazione;
- opportunità;
- risultati;
- follow-up.

Modello ideale:

```text
UTENTE
  ↓
OBIETTIVO
  ↓
ZORGAX
  ↓
PIANO
  ↓
TASK
  ↓
EVIDENZA
  ↓
RISULTATO
```

Zorgax aiuta a organizzare la realtà; non la inventa.

## 22. Come formulare richieste efficaci

Richiesta semplice:

> Controlla questa PR.

Richiesta più precisa:

> Controlla questa PR. Verifica CI, security, conflitti e review. Segnalami soltanto problemi che richiedono una decisione.

Oppure:

> Cerca opportunità per MyZubster. Separa opportunità ipotetiche da opportunità verificate e indicami costo, rischio e prossima azione.

Oppure:

> Controlla lo stato del progetto. Ignora modifiche senza impatto e mostrami soltanto decisioni che richiedono intervento umano.

## 23. Modello operativo consigliato

```text
             EVENTO
                │
                ▼
             RACCOLTA
                │
                ▼
             VERIFICA
                │
                ▼
            DEDUPLICA
                │
                ▼
        MATERIAL CHANGE?
           │         │
          NO        YES
           │         │
        SILENZIO     ▼
                  RISCHIO?
                 │       │
               BASSO    ALTO
                 │       │
                 ▼       ▼
              AZIONE   HUMAN
              LIMITATA  GATE
```

Questo evita sia l’autonomia eccessiva sia la necessità di chiedere conferma umana per ogni operazione banale.

## 24. Filosofia di Zorgax

```text
Non credere quando puoi verificare.

Non notificare quando nulla è cambiato.

Non duplicare ciò che esiste già.

Non confondere attività con risultato.

Non confondere visibilità con adozione.

Non confondere proposta con approvazione.

Non confondere pagamento dichiarato con pagamento verificato.

Automatizza ciò che è sicuro.

Fermati davanti alle decisioni importanti.

Conserva l’evidenza.
```

## 25. Zorgax dentro MyZubster

Zorgax non coincide con MyZubster. È soprattutto il livello di osservazione, intelligence, assistenza e automazione controllata dell’ecosistema.

```text
                 MYZUBSTER
                     │
       ┌─────────────┼─────────────┐
       │             │             │
     PEOPLE        SYSTEMS       REAL WORLD
       │             │             │
       └─────────────┼─────────────┘
                     │
                   ZORGAX
                     │
             OBSERVE / VERIFY
                     │
                 EVIDENCE
                     │
               HUMAN REVIEW
```

## In una frase

**Zorgax è l’assistente operativo evidence-first di MyZubster: osserva, ricerca, organizza, verifica e automatizza il lavoro ripetitivo, mantenendo le decisioni importanti sotto controllo umano.**

## Riferimenti

- `docs/ZORGAX_AUTOMATION.md`
- `docs/MYZUBSTER_METAVERSE.md`
- Issue e PR MyZubster relative a Zorgax, LIFE, revenue, contributor workflow e automazione.
