# MyZubster — Privacy-first Visual Map Roadmap

## Vision

Costruire una mappa visuale mondiale utile senza trasformare fotografie di piante, animali, giardini o persone in un indice di posizioni sensibili.

## Location architecture

Ogni osservazione supporta due livelli separati:

1. un payload esatto opzionale, cifrato e accessibile solo al proprietario/amministratore autorizzato;
2. una proiezione pubblica `private`, `approximate` o `public`, derivata dal consenso e dalla sensibilità.

Animali, specie a rischio, abitazioni e proprietà private restano senza punto pubblico. I media pubblici sono privi di GPS/EXIF e i nomi dei file non includono coordinate.

## Public record model

```json
{
  "type": "Feature",
  "geometry": null,
  "properties": {
    "id": "observation-001",
    "country": "Italy",
    "category": "plant",
    "location_visibility": "private",
    "location_precision": "hidden",
    "consent_status": "recorded"
  }
}
```

Per una proiezione `approximate`, il server può produrre un punto arrotondato a due decimali. La posizione esatta non viene derivata dal client, dai nomi file o dai metadati dell'immagine.

## Storage workflow

```text
Phone / Camera
      ↓
Private staging archive
      ↓
EXIF removal + sensitivity review
      ↓
Exact-location encryption (optional)
      ↓
Consent-based public projection
      ↓
GitHub public media and metadata
```

## Roadmap

### Phase 1 — Privacy baseline

- cifratura AES-256-GCM delle posizioni esatte;
- consenso esplicito e timestamp server-side;
- default privato e migrazione dei record legacy;
- rimozione di coordinate, indirizzi e link diretti dai dataset pubblici;
- bonifica EXIF/GPS dei media.

### Phase 2 — Safe exploration

- navigazione per paese/regione/città senza punti per record privati;
- clustering di sole proiezioni approssimate o pubbliche;
- filtri per specie e categoria che non consentano re-identificazione;
- moderazione dedicata per fauna e specie vulnerabili.

### Phase 3 — Consent lifecycle

- revoca e modifica della visibilità;
- rotazione chiavi e re-cifratura;
- audit degli accessi alla posizione privata;
- scadenza o riesame periodico del consenso.

### Phase 4 — NFT-safe provenance

- metadata NFT senza coordinate o indirizzi;
- commitment SHA-256 al payload off-chain cifrato;
- nessun mint finché chain, contratto, signer e verifica receipt non sono configurati e revisionati.

## Principle

Non inventare e non pubblicare per default la posizione. La verificabilità riguarda il record e la sua provenienza; non richiede di rendere pubblica la coordinata esatta.
