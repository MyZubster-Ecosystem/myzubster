# Hospital AHP Privacy Boundaries

Status: `PROPOSED PILOT / READY FOR VALIDATION`

## Obiettivo
Definire il perimetro minimo dei dati per un pilot ospedaliero AHP/PAP senza introdurre informazioni sanitarie o personali non necessarie.

## Dati ammessi nel modello operativo
- identificativo tecnico di lotto o contenitore
- riferimento struttura non personale
- timestamp operativo
- peso e unità
- identificativo tecnico della pesa
- riferimento a trasporto/ritiro
- riferimento a documento o registro
- stato qualità/evidenza
- identificativo tecnico dell'impianto
- quantità trattate e materiali recuperati

## Dati da escludere
- nome e cognome dei pazienti
- cartelle cliniche
- diagnosi
- dati sanitari
- codici fiscali
- nominativi del personale se non indispensabili e autorizzati
- dati di localizzazione granulari non necessari
- credenziali, token, segreti o chiavi private

## Minimizzazione
Il pilot deve usare identificativi tecnici pseudonimi o riferimenti interni quando possibile. MyZubster deve conservare solo i dati necessari alla tracciabilità del processo e agli indicatori MRV.

## Pubblico vs privato
Ogni campo o documento deve essere classificato almeno come:
- `PUBLIC`
- `PARTNER_RESTRICTED`
- `PRIVATE`

Le dashboard pubbliche dovrebbero mostrare KPI aggregati e prove non sensibili, non documenti operativi completi.

## Blockchain / hash
Non inserire dati personali o sensibili on-chain. Se si usa blockchain, pubblicare al massimo hash o riferimenti non reversibili quando appropriato.

## Responsabilità
La validazione finale di privacy, basi giuridiche, conservazione e accessi deve essere svolta dai soggetti responsabili del pilot e della struttura interessata. Questo documento è un modello tecnico, non un parere legale.
