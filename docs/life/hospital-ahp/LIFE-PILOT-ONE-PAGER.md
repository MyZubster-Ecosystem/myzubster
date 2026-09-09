# LIFE Hospital AHP/PAP Pilot — One Pager

Status: `PROPOSED PILOT / READY FOR PARTNER VALIDATION`

## Idea
Usare MyZubster come infrastruttura digitale comune per collegare dati già esistenti nella filiera ospedaliera AHP/PAP — a partire dalla pesatura pre-trasporto — con trasporto, ingresso impianto, trattamento, materiali recuperati, KPI/MRV ed Evidence Layer.

## Flusso

```text
Ospedale
  ↓
Pesatura pre-trasporto
  ↓
Peso registrato
  ↓
Trasporto
  ↓
Ingresso impianto
  ↓
Trattamento
  ↓
Materiali recuperati
  ↓
KPI / MRV / Evidence Layer
```

## Cosa aggiunge MyZubster
- identificativi coerenti per lotto/contenitore/evento;
- collegamento tra peso di origine e peso in ingresso impianto;
- distinzione tra dato dichiarato, misurato, documentato, cross-checked e verificato;
- tracciamento dei materiali recuperati;
- dashboard e schema dati aperto;
- eventuale hash/firma per integrità e provenienza, senza rendere la blockchain obbligatoria.

## KPI candidati
- kg AHP/PAP pesati e avviati al trasporto;
- differenza % tra peso pre-trasporto e peso in ingresso impianto;
- kg trattati;
- kg di materiali recuperati;
- resa di recupero;
- % record con evidenza completa/verificata.

## Perché può essere rilevante per LIFE
- collega infrastruttura digitale e processo reale;
- rende più verificabili KPI e MRV;
- riduce il rischio di overclaim/greenwashing;
- crea un modello replicabile tra strutture e territori;
- può diventare un template riusabile per altri pilot MyZubster.

## Cosa serve dai partner
- validare il flusso operativo reale;
- confermare quali dati di pesatura sono disponibili;
- definire baseline, target e KPI accettati;
- validare regole privacy/compliance;
- scegliere uno o più siti candidati per un pilot reale.

## Non-claim
Questo documento non dichiara che il pilot sia già approvato, finanziato o attivo. È una proposta tecnica/operativa pronta per validazione con partner e strutture reali.

## Riferimenti GitHub
- #1045 Blockchain AHP
- #1046 LIFE Evidence Layer
- #1047 Contributor ↔ LIFE Network
- #1050 IoT Evidence Bridge
- #1051 Hospital Weighing
