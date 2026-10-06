# LIFE Risk & Compliance Register — Hospital AHP/PAP

Status: `PROPOSED / READY FOR VALIDATION`

## Obiettivo
Raccogliere rischi tecnici, operativi, dati/compliance e rischi di comunicazione del pilot.

| Rischio | Impatto | Mitigazione proposta |
|---|---|---|
| dati di pesatura incompleti | KPI non affidabili | controlli obbligatori, campi mancanti espliciti, quality flag |
| mancato collegamento tra lotto e trasporto | perdita di tracciabilità | identificativo univoco e cross-check documentale |
| differenze tra peso origine e impianto | ambiguità/logistica | soglie, motivazioni, gestione anomalie |
| pesa non identificata/calibrazione ignota | qualità misura incerta | riferimento della pesa e stato calibrazione quando disponibile |
| dati personali/sanitari nel dataset | rischio privacy | minimizzazione, esclusione/pseudonimizzazione e review privacy |
| dati di partner non autorizzati alla pubblicazione | rischio contrattuale/confidenziale | classificazione pubblico/privato e controllo accessi |
| hash/blockchain interpretati come prova di verità | overclaim | dichiarare che provano integrità, non correttezza fisica |
| risultati tecnici presentati come risultati LIFE ufficiali | rischio reputazionale/compliance | stati `PROPOSED`, `PILOT`, `VERIFIED` e review prima della pubblicazione |
| processi diversi tra ospedali | replica difficile | adapter locali + replication checklist |
| dipendenza eccessiva da un fornitore/software | lock-in | schema aperto, export standard, blockchain opzionale |
| carico operativo aggiuntivo | bassa adozione | riuso dei dati esistenti e automazione dove possibile |
| output recuperati non misurati coerentemente | resa non confrontabile | definizioni comuni per frazione e metodo di misura |

## Compliance boundary
Il pilot digitale non sostituisce:
- obblighi normativi sui rifiuti;
- autorizzazioni sanitarie o ambientali;
- registri obbligatori;
- responsabilità degli operatori;
- valutazioni privacy e sicurezza.

## Review
Il registro va aggiornato con i partner reali prima dell'avvio del pilot e durante l'esecuzione.