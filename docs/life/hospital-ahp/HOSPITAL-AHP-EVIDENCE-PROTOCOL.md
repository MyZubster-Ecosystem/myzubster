# Hospital AHP Evidence Protocol

Status: `PROPOSED PILOT / READY FOR VALIDATION`

## Obiettivo
Definire come un dato passa da semplice dichiarazione a evidenza utilizzabile nel pilot.

## Livelli

### DECLARED
Dato riportato da una persona o sistema senza evidenza tecnica sufficiente.

### MEASURED
Dato generato da una pesa o strumento identificato.

### DOCUMENTED
Misura collegata a un registro, ricevuta, documento o record operativo.

### CROSS_CHECKED
Misura confrontata con un secondo punto indipendente della filiera, ad esempio ingresso impianto.

### VERIFIED
Dato che soddisfa le regole formali del pilot/MRV ed è stato validato secondo responsabilità e criteri definiti.

## Requisiti per `pre_transport_weighing`
Per considerare un record almeno `MEASURED`:
- identificativo lotto/contenitore
- peso netto o lordo+tara
- unità
- timestamp
- riferimento alla pesa

Per `DOCUMENTED`:
- tutti i requisiti precedenti
- riferimento a un registro/documento

Per `CROSS_CHECKED`:
- collegamento affidabile allo stesso lotto/contenitore all'ingresso impianto
- regola per la tolleranza di scostamento

Per `VERIFIED`:
- criterio approvato dal pilot
- responsabilità di validazione definita
- eventuali anomalie risolte o esplicitamente annotate

## Hash / blockchain
Un hash può essere associato al record o al documento per rilevare modifiche successive. Non sostituisce la validazione della misura e non dimostra che la pesa fosse corretta.

## Audit trail
Ogni cambio di stato dovrebbe registrare:
- stato precedente
- nuovo stato
- timestamp
- actor/system reference
- motivo
- evidenza utilizzata

## Regola anti-overclaim
Nessun evento o KPI deve essere chiamato `VERIFIED` solo perché è presente in MyZubster o registrato su blockchain.
