# MyZubster Observation Workflow

Questa guida definisce il flusso privacy-first per trasformare un'osservazione del mondo reale in un record verificabile e pubblicabile.

## Principio

```text
osservazione → staging privato → rimozione EXIF → classificazione sensibilità
             → cifratura posizione esatta → proiezione pubblica → verifica → pubblicazione
```

## 1. Acquisizione

Raccogli il minimo necessario: fotografia, soggetto, categoria, data quando utile e località generale. La posizione GPS esatta è opzionale e deve essere acquisita solo con consenso esplicito e uno scopo documentato.

Non raccogliere coordinate precise per abitazioni, giardini privati, animali domestici, nidi, tane, specie vulnerabili o luoghi personali sensibili.

## 2. Staging privato

Le immagini nuove entrano in una cartella non pubblica, per esempio `photos/inbox/`. Prima della pubblicazione:

1. rimuovi metadati GPS/EXIF;
2. verifica che l'immagine non mostri numeri civici, targhe o dettagli personali non necessari;
3. assegna una classificazione `private`, `approximate` o `public`;
4. registra il consenso quando sono presenti dati di posizione.

## 3. Naming

Usa identificatori stabili senza coordinate, indirizzi, wallet o altri dati personali:

```text
YYYY-MM-DD_soggetto_citta_categoria_numero.ext
```

Esempio:

```text
2026-08-18_quercia_rimini_plant_001.jpg
```

## 4. Politica di geolocalizzazione

- `private`: nessuna coordinata o città pubblica; può essere mostrato solo il paese;
- `approximate`: coordinate arrotondate a due decimali, senza indirizzo;
- `public`: coordinate esatte solo dopo consenso esplicito e revisione della sensibilità.

Animali, specie a rischio e osservazioni in proprietà private devono restare `private`. La posizione esatta, quando necessaria, viene cifrata nel database e non entra in Git.

## 5. Record pubblici

Un record privato in GeoJSON usa `geometry: null`:

```json
{
  "type": "Feature",
  "geometry": null,
  "properties": {
    "id": "observation-001",
    "country": "Italy",
    "location_visibility": "private",
    "location_precision": "hidden"
  }
}
```

Non inserire nei record pubblici `latitude`, `longitude`, indirizzi stradali, link diretti a mappe, wallet o coordinate nei nomi dei file.

## 6. Validazione

```bash
python3 -m json.tool data/observations.geojson >/dev/null
git diff --cached --check
git status --short
```

Verifica inoltre che le immagini pubblicate non conservino GPS/EXIF e che ogni posizione pubblica rispetti consenso e sensibilità.

## 7. Checklist

```text
[ ] Dati minimi raccolti
[ ] Consenso posizione registrato, se applicabile
[ ] Sensibilità classificata
[ ] EXIF/GPS rimosso dai media pubblici
[ ] Posizione esatta cifrata o scartata
[ ] Proiezione pubblica verificata
[ ] Nessun indirizzo, wallet o coordinata nel repository
[ ] ID stabile creato
[ ] JSON/GeoJSON validato
[ ] Diff controllato e commit selettivo
```
