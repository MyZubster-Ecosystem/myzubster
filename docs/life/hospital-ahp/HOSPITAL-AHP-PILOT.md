# Hospital AHP Pilot

Status: `PROPOSED PILOT / READY FOR VALIDATION`

## Obiettivo
Definire un pilot ospedaliero per la tracciabilità dei rifiuti AHP/PAP dalla pesatura pre-trasporto fino al trattamento e al recupero dei materiali, usando MyZubster come layer di coordinamento, MRV ed Evidence Layer.

## Flusso operativo

```text
contenitore / lotto AHP
      ↓
pesatura pre-trasporto
      ↓
registrazione del peso
      ↓
ritiro e trasporto
      ↓
ingresso impianto
      ↓
trattamento
      ↓
materiali recuperati
      ↓
KPI / MRV / Evidence Layer
```

## Attori
- struttura sanitaria / ospedale
- operatore addetto alla gestione rifiuti
- trasportatore
- impianto di trattamento / recupero
- eventuale partner tecnico o scientifico
- MyZubster come infrastruttura digitale di collegamento

## Principio
MyZubster non sostituisce la pesatura, la logistica, il trattamento o gli obblighi normativi. Collega dati già prodotti dalla filiera a identificativi, provenienza, documenti, controlli incrociati e KPI/MRV.

## Eventi minimi
1. `container_created` o identificazione lotto/contenitore
2. `pre_transport_weighing`
3. `pickup_started`
4. `plant_received`
5. `treatment_completed`
6. `materials_recovered`

## Evidenze
Ogni evento può avere:
- timestamp
- actor/system reference
- record/document reference
- quality status
- eventuale hash/signature
- classificazione pubblico/privato

## Stati
- `PROPOSED`
- `IN REVIEW`
- `PILOT`
- `IMPLEMENTED`
- `VERIFIED`

## Collegamenti
- Issue #1045 — Blockchain AHP
- Issue #1046 — LIFE Evidence Layer
- Issue #1050 — IoT Evidence Bridge
- Issue #1051 — Hospital Weighing

## Criterio di successo del pilot
Il pilot è utile se consente di ricostruire, con evidenze e regole esplicite, il percorso:

**peso pre-trasporto → peso ricevuto → quantità trattata → quantità recuperata**

senza introdurre dati sanitari o personali non necessari.
