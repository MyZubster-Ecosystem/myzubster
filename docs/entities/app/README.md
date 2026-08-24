# MyZubster App

## Scopo
Client mobile per accedere alle funzioni MyZubster da Android/iOS dove supportato.

## Repository collegato
`MyZubster-App`.

## Stato
Sviluppo attivo. La pipeline Beta Android è separata dalla produzione e deve superare i gate di sicurezza delle dipendenze e QA su dispositivo.

## Input → Output
Sessione utente, azioni UI, foto/sensori permessi → richieste API, osservazioni, profilo e contenuti utente consentiti.

## Sicurezza
Token in storage appropriato; nessuna seed/private key; permessi camera/location solo quando necessari; nessuna fiducia in ownership client-side.

## Evidenza richiesta
Audit dipendenze, build riproducibile, checksum APK, test installazione/runtime su dispositivo reale.

## Definition of done
CI e security gate verdi, APK firmato secondo il canale previsto, test real-device completati, backend compatibile e download pubblicato solo con provenance verificabile.
