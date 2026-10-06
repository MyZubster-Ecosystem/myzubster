# LIFE Replication & Scale-Up Plan — Hospital AHP/PAP

Status: `PROPOSED / READY FOR PARTNER VALIDATION`

## Obiettivo
Definire come replicare il pilot ospedaliero AHP/PAP in altre strutture e territori senza assumere che tutti i processi locali siano identici.

## Unità minima replicabile
Il nucleo da replicare è:

```text
identificativo lotto/contenitore
      ↓
pesatura pre-trasporto
      ↓
record documentato
      ↓
trasporto
      ↓
peso ingresso impianto
      ↓
trattamento
      ↓
materiali recuperati
      ↓
KPI/MRV + Evidence Layer
```

## Cosa deve restare comune
- schema minimo degli eventi;
- definizioni KPI/MRV;
- livelli di qualità dell'evidenza;
- audit trail;
- separazione dati pubblici/privati;
- regole per anomalie e rettifiche;
- principi di privacy e minimizzazione.

## Cosa può cambiare per sito
- tipo/modello di pesa;
- identificativi locali;
- documenti e registri disponibili;
- modalità di ritiro e trasporto;
- impianto di destinazione;
- frequenza di raccolta;
- soglie operative;
- integrazioni software.

## Replication checklist
Per ogni nuovo sito:
1. validare il processo reale;
2. mappare dati già disponibili;
3. identificare owner e autorizzazioni;
4. configurare mapping allo schema comune;
5. eseguire test con dati sintetici;
6. eseguire una finestra pilota limitata;
7. confrontare KPI e qualità dati;
8. registrare differenze locali;
9. aggiornare adapter/documentazione;
10. decidere se il sito è `READY TO SCALE`.

## Criteri di readiness
Un sito può essere considerato pronto per replica solo se:
- la pesatura è identificabile e documentabile;
- esiste un collegamento affidabile tra lotto e trasporto;
- il peso in ingresso impianto è confrontabile;
- almeno i principali eventi hanno evidenze minime;
- privacy/compliance sono validate;
- il carico operativo aggiuntivo è sostenibile.

## Scale-up
Fasi proposte:
- 1 struttura / 1 impianto;
- 2–3 strutture nello stesso territorio;
- più territori con stesso schema comune;
- eventuale interoperabilità con altri pilot MyZubster.

## Rischi di replica
- processi non uniformi;
- dati mancanti;
- lock-in da software proprietario;
- interpretazioni diverse dei KPI;
- eccesso di automazione senza validazione del processo reale.

## Output atteso
- replication checklist compilata per sito;
- gap analysis;
- adapter locali;
- confronto KPI/MRV;
- report di replicabilità.

## Non-claim
La replicabilità va dimostrata con test reali. Non è sufficiente riusare lo stesso software per dichiarare che un pilot sia replicato con successo.
