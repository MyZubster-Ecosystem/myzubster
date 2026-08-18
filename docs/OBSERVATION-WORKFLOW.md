# MyZubster Observation Workflow

Questa guida definisce il flusso standard per trasformare un'osservazione del mondo reale in un record MyZubster organizzato, verificabile e pubblicabile.

## Principio

```text
osservazione reale
  -> foto originale
  -> nome file standard
  -> cartella per categoria
  -> metadati / GeoJSON
  -> verifica
  -> Git
  -> GitHub
  -> mappa / galleria
```

## 1. Acquisizione

Per ogni nuova osservazione raccogli, quando appropriato:

- fotografia originale;
- data e ora;
- coordinate GPS;
- soggetto;
- luogo;
- categoria;
- eventuale descrizione.

## 2. Inbox locale

Le nuove immagini devono arrivare inizialmente in una cartella di ingresso, ad esempio:

```text
photos/inbox/
```

Non rinominare o pubblicare direttamente durante l'acquisizione.

## 3. Classificazione

Categorie principali:

```text
street
square
landmark
civic
service
garden
plant
animal
heritage
personal
```

## 4. Naming dei file

Formato semplice:

```text
<luogo>-<soggetto>-<numero>.jpg
```

Esempi:

```text
fontana-della-pigna-001.jpg
comune-di-rimini-001.jpg
garden-papiro-001.jpg
garden-banano-001.jpg
garden-alloro-001.jpg
garden-susino-001.jpg
```

Formato esteso quando data e GPS sono rilevanti:

```text
YYYY-MM-DD_soggetto_citta_latitudine_longitudine_numero.jpg
```

## 5. Coordinate

Visualizzazione umana:

```text
latitude, longitude
```

GeoJSON:

```text
longitude, latitude
```

Esempio:

```json
{
  "type": "Point",
  "coordinates": [12.5661150, 44.0609273]
}
```

## 6. ID stabile dell'osservazione

Ogni record deve avere un identificatore stabile e indipendente dal titolo visualizzato.

Esempi:

```text
rimini-fontana-della-pigna-001
rimini-piazza-ferrari-001
rimini-via-clodia-001
rimini-garden-001-papiro-001
```

## 7. Struttura media

Standard corrente:

```text
public/media/
└── rimini/
    ├── civic/
    ├── gardens/
    ├── landmarks/
    ├── personal/
    ├── services/
    ├── squares/
    └── streets/
```

Esempio giardino:

```text
public/media/rimini/gardens/garden-001/
└── plants/
    ├── alloro/
    ├── banano/
    ├── papiro/
    └── susino/
```

## 8. Record GeoJSON

Il dataset principale è:

```text
data/observations.geojson
```

Ogni osservazione può contenere:

- `id`;
- `name`;
- `category`;
- `latitude`;
- `longitude`;
- `coordinate_system`;
- `coordinate_status`;
- `coordinate_source`;
- `image` o, in futuro, `media`;
- `github_record`;
- `google_maps`.

## 9. Una osservazione può avere più media

Il modello futuro preferito è:

```json
"media": [
  {
    "type": "image",
    "path": "/media/.../photo-001.jpg"
  },
  {
    "type": "image",
    "path": "/media/.../photo-002.jpg"
  }
]
```

Questo evita di confondere il concetto di osservazione con una singola fotografia.

## 10. Validazione prima del commit

GeoJSON:

```bash
python3 -m json.tool data/observations.geojson >/dev/null
```

Media pubblici:

```bash
curl -I http://127.0.0.1:5003/percorso/foto.jpg
```

Status Git:

```bash
git status --short
```

## 11. Git add selettivo

Sulle VPS di produzione evitare:

```bash
git add .
```

Preferire:

```bash
git add percorso/file1 percorso/file2
```

Poi:

```bash
git diff --cached --check
git status --short
```

## 12. Commit

Usare commit piccoli e descrittivi.

Prefissi consigliati:

```text
feat:
fix:
media:
data:
docs:
test:
refactor:
chore:
```

Esempi:

```text
media: add Piazza Ferrari photographs
data: add Fontana della Pigna observation
feat: add public photo archive
```

## 13. Pubblico, privato e segreto

### Public

- luoghi pubblici;
- monumenti;
- dataset pubblicabili;
- media destinati alla pubblicazione.

### Private

- materiale personale non destinato alla pubblicazione;
- coordinate domestiche precise;
- documenti privati;
- media riservati.

### Secret

Non devono mai entrare in Git:

- password;
- API keys;
- token;
- seed;
- chiavi private;
- credenziali.

## 14. Pubblicazione

L'obiettivo finale è collegare:

```text
foto
  -> record
  -> GPS
  -> GeoJSON
  -> pagina osservazione
  -> mappa
  -> galleria
```

## 15. Checklist rapida

```text
[ ] Foto acquisita
[ ] Nome normalizzato
[ ] Categoria scelta
[ ] Cartella corretta
[ ] GPS verificato
[ ] ID stabile creato
[ ] GeoJSON aggiornato
[ ] Media raggiungibile via HTTP
[ ] git add selettivo
[ ] diff controllato
[ ] commit descrittivo
[ ] push riuscito
[ ] mappa/galleria aggiornata
```
