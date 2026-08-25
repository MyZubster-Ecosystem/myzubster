# MyZubster Observation Governance

## Purpose

MyZubster collega media, metadati e provenienza senza pubblicare wallet, coordinate precise o informazioni personali non necessarie. La privacy della posizione è il valore predefinito, non un'eccezione.

## Canonical flow

Capture → private staging → EXIF removal → sensitivity review → encrypted exact location (optional) → public projection → validation → publication.

## Public observation registry

`data/observations.json` e `data/observations.geojson` possono contenere:

- identificatore, titolo e descrizione;
- paese e, solo se non sensibile, area generale;
- categoria, tag, provenienza e stato;
- riferimenti a media già bonificati;
- digest SHA-256 e commit di riferimento;
- `location_visibility`, `location_precision` e stato del consenso.

Non devono contenere coordinate esatte, indirizzi, link diretti a mappe, wallet, dati di pagamento personali o metadati GPS/EXIF. I valori storici senza consenso verificabile sono `legacy-unverified` e restano privati.

## Location classes

| Classe | Dato pubblico | Uso |
| --- | --- | --- |
| `private` | paese, se appropriato | default; animali, abitazioni, giardini privati, specie e habitat sensibili |
| `approximate` | area e coordinate arrotondate a 2 decimali | solo con consenso e rischio basso |
| `public` | posizione esatta | solo con consenso esplicito e revisione documentata |

La posizione esatta ammessa per funzioni operative viene conservata come AES-256-GCM ciphertext. Le API pubbliche usano esclusivamente la proiezione consentita.

## Media privacy

Ogni immagine pubblica deve essere controllata per GPS/EXIF, indirizzi, targhe, volti e dettagli di proprietà privata. I nomi dei file non contengono coordinate. Una modifica al file produce un nuovo digest SHA-256 e richiede nuova verifica.

## Lifecycle

- `STAGED`: contenuto non pubblico in attesa di controllo;
- `VALIDATED`: tipo, metadati, sensibilità e destinazione verificati;
- `PUBLISHED`: contenuto bonificato e raggiungibile;
- `BOUNTY_LINKED`: riferimento di bounty verificato, senza wallet nel record;
- `VERIFIED`: integrità, provenienza e consenso controllati.

## Monero and payment safety

Non pubblicare indirizzi wallet dei contributori, seed, chiavi, password o credenziali RPC. I dettagli per un bounty vengono richiesti tramite un canale privato verificato solo dopo l'approvazione. Un riferimento pubblico a transazione è ammesso esclusivamente quando necessario e supportato da evidenza esplicita.

## Definition of done

Un'osservazione pubblica è completa quando media e metadati sono validi, il digest è registrato, la sensibilità è stata revisionata, il consenso è tracciato quando necessario, la proiezione non espone dati eccedenti e nessun segreto o dato di pagamento personale è presente.
