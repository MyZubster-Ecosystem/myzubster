# Public Evidence / IPFS

## Scopo
Pubblica snapshot sanitizzati e content-addressed di dati MyZubster che possono essere verificati e replicati indipendentemente.

## Componenti collegati
Core, observations, crawler, bounty/reward public indexes, IPFS/IPNS.

## Stato
Architettura documentata e usata come boundary di pubblicazione; IPFS non sostituisce autorizzazione, database operativo o settlement.

## Input → Output
Dati pubblicabili e sanitizzati → CID immutabili e, dove previsto, puntatore IPNS al root più recente.

## Sicurezza
Mai pubblicare credenziali, identificatori privati, filesystem path, dati personali non necessari, ricerca confidenziale o geolocalizzazioni sensibili.

## Evidenza richiesta
CID verificabile, contenuto recuperabile e provenance del dataset/snapshot.

## Definition of done
Lo snapshot pubblico è sanitizzato, recuperabile tramite CID e non viene presentato come consenso blockchain o prova di pagamento.
