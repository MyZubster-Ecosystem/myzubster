# LIFE KPI & MRV Framework — Hospital AHP/PAP

Status: `PROPOSED / READY FOR VALIDATION`

## Obiettivo
Definire indicatori e regole MRV per misurare il pilot senza trasformare dati incompleti in risultati verificati.

## KPI candidati
| KPI | Formula / definizione | Evidenza minima | Frequenza |
|---|---|---|---|
| AHP/PAP pesati prima del trasporto | somma `net_weight` | record pesa identificata | per ritiro |
| AHP/PAP ricevuti all'impianto | peso ingresso impianto | registro/pesa impianto | per consegna |
| Scostamento logistico | `(peso ingresso - peso pre-trasporto) / peso pre-trasporto * 100` | entrambi i pesi collegati allo stesso lotto | per lotto |
| Quantità trattata | kg effettivamente avviati al trattamento | registro processo | per batch |
| Materiale recuperato | kg per frazione recuperata | output impianto/documento | per batch |
| Resa di recupero | `kg recuperati / kg trattati` | trattamento + output recuperato | per batch/periodo |
| Completezza evidenze | record con evidence chain completa / record totali | Evidence Layer | mensile/pilot |

## Baseline
La baseline deve essere raccolta dal processo reale prima di fissare target. Se non esiste una baseline affidabile, riportare `BASELINE NOT YET VERIFIED`.

## Regole MRV
- ogni KPI deve avere owner, fonte e metodo;
- lordo, tara e netto devono essere distinti;
- il lotto deve essere coerente tra eventi;
- valori mancanti non diventano zero;
- rettifiche devono mantenere audit trail;
- anomalie devono essere segnalate e non nascoste;
- eventuali target devono essere approvati dai partner del pilot.

## Livelli di qualità
`DECLARED → MEASURED → DOCUMENTED → CROSS_CHECKED → VERIFIED`

## Reporting
Ogni report dovrebbe mostrare:
- periodo;
- perimetro;
- numero di eventi;
- KPI;
- qualità evidenze;
- dati mancanti/anomalie;
- metodo di calcolo;
- limiti e incertezza.

## Nota
Gli indicatori sono candidati. Non costituiscono risultati LIFE né target ufficiali finché non validati nel pilot.