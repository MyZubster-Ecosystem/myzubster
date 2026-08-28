# Core / Platform

## Scopo
È il nucleo applicativo e contrattuale di MyZubster: coordina utenti, API, orti, osservazioni, bounty, reward e integrazioni.

## Repository collegati
`myzubster`, `myzubster-platform`.

## Stato
Sviluppo attivo / validazione. Il repository `myzubster` è la fonte primaria per workflow, architettura pubblica e regole canoniche.

## Input → Output
Richieste client e dati validati → API, record applicativi, snapshot pubblicabili e segnali per servizi downstream.

## Dipendenze
App, Web/TV, Garden, Observations, Bounties, Gateway.

## Sicurezza
Autenticazione e autorizzazione devono essere server-side. Non fidarsi di owner ID forniti dal client. Nessun segreto in repository o log pubblici.

## Evidenza richiesta
Codice + test riproducibili + CI sul commit pertinente. Deploy `READY` non equivale automaticamente a percorso utente verificato.

## Definition of done
Contratti API documentati, ownership applicata, error handling e rate limiting verificati, CI verde e percorso reale collaudato nell'ambiente destinato.
