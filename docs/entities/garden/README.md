# Garden / Orto

## Scopo
Rappresenta l'orto MyZubster e il collegamento tra proprietario, dati, media, sensori e accesso live quando disponibile.

## Componenti collegati
Core API, Web/TV, App, Observations, eventuale camera/gateway locale.

## Stato
Funzioni orto esistono nel core; il percorso sicuro `utente → proprio orto → proprio stream` richiede ownership server-side e accesso temporaneo allo stream prima della produzione.

## Input → Output
Dati orto, osservazioni, sensori/media autorizzati → stato orto, dashboard e stream live autorizzato.

## Sicurezza
Ownership verificata sul server; non esporre password RTSP, URL permanenti o geolocalizzazioni sensibili; stream tramite URL HTTPS/HLS scoped e revocabili dove appropriato.

## Evidenza richiesta
Test cross-user negative, stream reale autorizzato, scadenza accesso e recovery offline.

## Definition of done
Un utente autenticato può vedere solo il proprio orto e il proprio live stream, senza credenziali permanenti nel client o nei log.
