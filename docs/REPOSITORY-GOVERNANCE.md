# MyZubster Repository Governance

Questa guida definisce come organizzare repository, dati, media, deployment e backup nell'ecosistema MyZubster.

## 1. Regola principale

Un repository deve avere una responsabilità chiara e spiegabile in una frase.

Esempio di separazione:

```text
MyZubster-Ecosystem/
├── myzubster                  # core, API, dati, mappe e workflow principali
├── MyZubsterWeb               # frontend pubblico
├── MyZubster-Social           # componenti social
├── MyZubster-Robot            # robotica
├── MyZubster-App              # applicazioni client
├── MyZubster-Marketplace      # marketplace
├── myzubster-animal-registry  # registro animali
└── I-ECO-01                   # ambiente / IoT
```

Se un repository non ha uno scopo chiaro, va consolidato, rinominato, archiviato o documentato meglio.

## 2. Stato ufficiale dei repository

Ogni repository dovrebbe dichiarare uno stato:

```text
ACTIVE
EXPERIMENTAL
MAINTENANCE
DEPRECATED
ARCHIVED
```

Nel README:

```markdown
**Project status:** ACTIVE
```

## 3. Struttura consigliata per il repository principale

```text
myzubster/
├── src/                  # codice applicativo
├── public/               # frontend e media pubblici
│   ├── index.html
│   ├── photos.html
│   └── media/
├── data/                 # dataset strutturati
│   ├── observations.geojson
│   ├── botanical-observations/
│   └── urban-observations/
├── docs/                 # documentazione
│   ├── OBSERVATION-WORKFLOW.md
│   └── REPOSITORY-GOVERNANCE.md
├── tests/                # test
├── scripts/              # utility operative
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── package.json
```

## 4. Separazione delle responsabilità

### Codice

```text
src/
backend/
frontend/
scripts/
```

### Dati

```text
data/
```

### Documentazione

```text
docs/
```

### Media pubblici

```text
public/media/
```

### Test

```text
tests/
backend/tests/
```

Evitare cartelle che mischiano codice, backup, media e dump.

## 5. Struttura geografica dei media

Per l'espansione internazionale, il modello target è:

```text
public/media/
└── <country>/
    └── <region>/
        └── <city>/
            ├── civic/
            ├── gardens/
            ├── heritage/
            ├── landmarks/
            ├── services/
            ├── squares/
            └── streets/
```

La struttura corrente di Rimini può restare operativa e migrare gradualmente senza rompere URL pubblici esistenti.

## 6. Naming dei repository

Preferire nomi coerenti e stabili.

Linee guida:

- evitare repository duplicati con nomi quasi uguali;
- usare un nome che descriva il dominio;
- evitare suffissi come `final`, `new`, `test2`, `backup`;
- usare repository separati solo quando esiste una reale separazione tecnica o organizzativa.

## 7. Naming di branch e commit

Branch consigliate:

```text
feat/<descrizione>
fix/<descrizione>
docs/<descrizione>
chore/<descrizione>
security/<descrizione>
```

Commit consigliati:

```text
feat: add public photo archive
fix: expose GeoJSON data directory
media: add Rimini field photos
data: add civic observation records
docs: document repository governance
```

## 8. Deployment e repository

La VPS è un ambiente di esecuzione, non l'archivio principale.

Modello ideale:

```text
PC / workstation
├── working copies
└── temporary import inbox

GitHub
├── source code
├── public datasets
└── selected public media

VPS
└── production deployment

Backup storage
├── database dumps
├── recovery archives
└── server snapshots
```

## 9. Backup

I backup non devono accumularsi nel repository operativo.

Evitare file come:

```text
server.js.backup-final
server.js.backup-final2
server.js.bak.20260816
```

Preferire una cartella esterna al repository:

```text
/root/backups/myzubster/YYYY-MM-DD/
```

oppure storage dedicato.

## 10. `.gitignore`

Valutare regole come:

```gitignore
# Local backups
*.bak
*.backup
*.backup-*
*.bak.*

# Temporary
*.tmp
*.temp
*~

# Logs
*.log

# Environment / secrets
.env
.env.*
!.env.example

# OS
.DS_Store
Thumbs.db
```

Prima di introdurre pattern ampi, verificare che non escludano file volutamente versionati.

## 11. Git add selettivo in produzione

Su VPS usare:

```bash
git add percorso/file
```

Evitare:

```bash
git add .
```

quando la working tree contiene backup, dump o esperimenti non tracciati.

## 12. Repository index dell'ecosistema

Creare e mantenere un indice con almeno:

```text
Repository
Purpose
Status
Production URL
Maintainer
Dependencies
Last reviewed
```

Esempio:

| Repository | Purpose | Status |
|---|---|---|
| myzubster | Core, mappe, dati e API | ACTIVE |
| MyZubsterWeb | Frontend pubblico | ACTIVE |
| MyZubster-Robot | Robotica | EXPERIMENTAL |
| myzubster-animal-registry | Registro animali | EXPERIMENTAL |

## 13. README minimo obbligatorio

Ogni repository dovrebbe contenere:

```text
What is this?
Purpose
Project status
Architecture / structure
Run locally
Data
Privacy
Contributing
Security
License
```

## 14. Privacy e sicurezza

Separare sempre:

### Public

Contenuti destinati esplicitamente alla pubblicazione.

### Private

Materiale personale, coordinate sensibili, documenti e dati non destinati a GitHub pubblico.

### Secret

Mai in Git:

- password;
- token;
- seed;
- private key;
- API key;
- credenziali database;
- file `.env` reali.

## 15. Ciclo di vita di un repository

```text
idea
  -> experimental
  -> active
  -> maintenance
  -> deprecated
  -> archived
```

Non è necessario cancellare un repository vecchio: archiviarlo preserva storia, commit e riferimenti.

## 16. Regole di migrazione

Quando si riorganizzano cartelle o media:

1. spostare i file;
2. aggiornare i riferimenti in GeoJSON e documentazione;
3. verificare gli URL HTTP;
4. controllare `git status`;
5. committare rename e aggiornamenti insieme;
6. evitare URL pubblici rotti.

## 17. Checklist repository

```text
[ ] Scopo chiaro
[ ] Stato dichiarato
[ ] README aggiornato
[ ] Codice separato dai dati
[ ] Media pubblici separati
[ ] Nessun secret
[ ] Backup fuori dal repository
[ ] .gitignore appropriato
[ ] Test disponibili
[ ] Deployment documentato
[ ] Maintainer definito
[ ] Repository index aggiornato
```

## 18. Obiettivo

La struttura deve permettere a una persona nuova di capire rapidamente:

- quale repository usare;
- dove trovare il codice;
- dove trovare dati e media;
- quali componenti sono attivi;
- cosa è pubblico;
- come contribuire;
- cosa non deve essere pubblicato.

La crescita dell'ecosistema deve aumentare la chiarezza, non la complessità operativa.