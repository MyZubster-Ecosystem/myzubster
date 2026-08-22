# MyZubster — usare ChatGPT con i tool, anche da cellulare

Questa guida spiega il modo più semplice per lavorare su MyZubster usando **ChatGPT come centro operativo**, con GitHub come fonte tecnica principale e Slack, Notion e Google Drive come strumenti collegati.

> La disponibilità dei tool/app dipende dal piano ChatGPT, dal workspace, dai permessi e dalla piattaforma. Su iOS/Android usa l'ultima versione di ChatGPT. Se un tool non appare sul cellulare, controlla le app/plugin disponibili nelle impostazioni del tuo account/workspace.

## Idea base

```text
CELLULARE / CHATGPT
        ↓
   chiedi in linguaggio naturale
        ↓
┌─────────────────────────────┐
│ GitHub  → codice/evidence   │
│ Slack   → coordinamento     │
│ Notion  → documentazione    │
│ Drive   → file/documenti    │
│ Gmail   → email             │
│ Calendar→ agenda/eventi     │
│ Web     → fonti pubbliche   │
└─────────────────────────────┘
        ↓
  verifica prima delle azioni
        ↓
      RISULTATO
```

## 1. GitHub — strumento principale

Usa GitHub per:

- leggere repository e file;
- cercare codice;
- leggere issue e pull request;
- creare o aggiornare documentazione;
- creare issue;
- lavorare sui PR;
- controllare commit, diff, test e CI;
- mantenere evidence e provenance verificabili.

Esempi da scrivere a ChatGPT:

```text
Cerca nel repository MyZubster dove è implementato il wallet.
```

```text
Leggi le issue aperte e dimmi quali sono adatte a un nuovo contributor.
```

```text
Controlla questo PR, leggi il diff e dimmi rischi e test mancanti.
```

```text
Crea una issue GitHub con questa proposta, senza modificare il codice.
```

```text
Aggiorna il README con questa nuova procedura e dimmi esattamente cosa hai modificato.
```

### Regola

Per codice, issue, PR, commit, test ed evidence, **GitHub è la fonte di verità**. Non considerare una conversazione ChatGPT o Slack come prova tecnica sufficiente.

## 2. Slack — persone e coordinamento

Usa Slack per:

- cercare discussioni;
- riassumere thread e canali accessibili;
- recuperare decisioni recenti;
- pubblicare aggiornamenti quando l'azione è disponibile;
- coordinare contributor.

Esempi:

```text
Cerca su Slack le ultime discussioni su LIFE 2026 e riassumi decisioni e azioni.
```

```text
Prepara un aggiornamento del progetto usando GitHub e Slack, separando fatti verificati e discussioni.
```

```text
Pubblica nel canale community un breve riepilogo di questo PR.
```

Slack serve al coordinamento. Le decisioni tecniche importanti vanno riportate in GitHub o nella documentazione durevole.

## 3. Notion — documentazione durevole

Usa Notion per:

- cercare policy e documentazione interna;
- consolidare guide;
- mantenere pagine di onboarding;
- aggiornare stato e procedure, se le azioni di scrittura sono abilitate.

Esempi:

```text
Cerca in Notion la policy contributor e confrontala con CONTRIBUTING.md su GitHub.
```

```text
Trova eventuali contraddizioni tra Notion e GitHub. Non modificare nulla: fammi prima il report.
```

GitHub resta autorevole per il repository; Notion serve alla conoscenza organizzativa durevole.

## 4. Google Drive — documenti e materiali condivisi

Google Drive in ChatGPT può riunire l'accesso a Drive, Docs, Sheets e Slides quando disponibile e autorizzato.

Usalo per:

- cercare documenti;
- leggere Docs;
- analizzare Sheets;
- lavorare con Slides;
- confrontare documenti Drive con repository GitHub;
- creare o aggiornare file quando l'azione relativa è disponibile.

Esempi:

```text
Trova su Drive i documenti LIFE 2026 più recenti e confrontali con il repository.
```

```text
Analizza questo Sheet e dimmi quali dati devono essere documentati su GitHub.
```

```text
Cerca il documento partner più recente, ma non pubblicare informazioni private.
```

## 5. Gmail e Calendar

Quando collegati e autorizzati, ChatGPT può aiutare a lavorare con email e calendario.

Esempi:

```text
Cerca le email recenti relative a MyZubster e riassumi solo quelle che richiedono un'azione.
```

```text
Controlla il calendario e prepara un briefing per il prossimo incontro MyZubster usando anche i documenti pertinenti.
```

Non copiare automaticamente email private nel repository pubblico.

## 6. Web — verifica pubblica

Usa la ricerca web quando servono informazioni pubbliche e aggiornate:

```text
Verifica sul web questa affermazione e dammi le fonti.
```

```text
Cerca se questa libreria ha avuto nuove release o problemi di sicurezza pubblici.
```

```text
Confronta quello che dichiara MyZubster con fonti pubbliche indipendenti.
```

Distingui sempre:

- **repository evidence**;
- **dichiarazione del progetto**;
- **fonte esterna indipendente**;
- **ipotesi/proposta**.

## 7. Come lavorare dal cellulare

Su iPhone o Android il flusso consigliato è semplice:

1. apri ChatGPT;
2. entra nella conversazione/progetto MyZubster;
3. chiedi direttamente cosa vuoi ottenere;
4. specifica la fonte quando serve: `usa GitHub`, `cerca Slack`, `controlla Notion`, `cerca Drive`;
5. fai leggere e verificare prima di chiedere modifiche importanti;
6. per operazioni di scrittura, indica chiaramente cosa deve essere creato o aggiornato;
7. chiedi sempre il risultato finale: file, issue, PR, messaggio o documento modificato.

Non è necessario scrivere comandi API dal telefono: quando il tool è disponibile e autorizzato, puoi descrivere l'azione in linguaggio naturale.

## 8. Prompt rapido per il cellulare

Puoi usare questo schema:

```text
OBIETTIVO: cosa voglio ottenere

USA:
- GitHub per codice/evidence
- Slack per discussioni
- Notion per documentazione
- Drive per file
- Web per verifica pubblica

REGOLE:
- non inventare dati mancanti
- distingui fatti, dichiarazioni e proposte
- non pubblicare dati privati
- prima verifica, poi modifica
- alla fine dimmi cosa hai realmente modificato
```

Esempio:

```text
Obiettivo: aggiornare lo stato del progetto.

Controlla prima GitHub, poi Slack e Notion.
Trova solo novità verificabili.
Se trovi documentazione obsoleta, aggiornala su GitHub.
Non pubblicare email o dati privati.
Alla fine dammi file modificati, commit e cose ancora da verificare.
```

## 9. Modalità sicura per azioni importanti

Per cambiamenti delicati usa due passaggi.

### Passaggio A — READ ONLY

```text
Analizza GitHub, Slack, Notion e Drive. Non modificare nulla. Dammi problemi, fonti e piano di modifica.
```

### Passaggio B — EXECUTE

Dopo aver controllato il piano:

```text
Procedi con le modifiche approvate. Non fare altre modifiche. Riporta ogni azione completata e gli eventuali errori.
```

## 10. Cosa NON mettere in ChatGPT/GitHub pubblico

Non pubblicare:

- password;
- API key;
- seed phrase;
- private key;
- token di accesso;
- dati personali non necessari;
- documenti partner confidenziali;
- email private integrali;
- target di security testing non autorizzati.

Se trovi un segreto nel repository, non copiarlo in chat o in altri documenti: segnala il problema e procedi con una bonifica appropriata.

## 11. Workflow MyZubster consigliato

```text
CHATGPT MOBILE
      ↓
READ / SEARCH
      ↓
GitHub + Slack + Notion + Drive + Web
      ↓
VERIFY
      ↓
PLAN
      ↓
EXECUTE CON TOOL AUTORIZZATO
      ↓
GitHub issue / commit / PR / docs
      ↓
Slack update
      ↓
Notion status
```

## 12. Regola finale

**ChatGPT orchestra il lavoro. GitHub conserva il codice e l'evidence. Slack coordina le persone. Notion conserva la documentazione organizzativa. Drive conserva i materiali condivisi. Il Web serve alla verifica pubblica.**

Dal cellulare puoi quindi usare ChatGPT come interfaccia unica, purché ogni app/tool necessario sia collegato, disponibile sul tuo piano/workspace e autorizzato con i permessi appropriati.

## Link utili

- MyZubster: https://www.myzubster.com
- Come funziona: https://www.myzubster.com/come-funziona
- GitHub: https://github.com/MyZubster-Ecosystem
- Slack/Notion guide: [`SLACK_NOTION.md`](SLACK_NOTION.md)
- Contributor guide: [`../JOIN.md`](../JOIN.md)
