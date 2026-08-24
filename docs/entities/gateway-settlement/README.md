# Gateway / Settlement

## Scopo
Confine di integrazione tra core MyZubster, adapter esterni, treasury/payment rail e verifica indipendente.

## Repository collegati
`MyZubsterGateway`, `myzubster-escrow-api`, `myzubster-verifier` dove applicabile.

## Stato
Infrastruttura in sviluppo/validazione. Nessun claim di settlement reale è valido senza verifica indipendente.

## Input → Output
Reward/settlement request validata → richiesta adapter → risultato verificato oppure stato pending/failed.

## Sicurezza
Autorizzazione forte, idempotenza, validazione importi, audit trail e separazione tra submitter e verifier. Non esporre wallet secret, private key o credenziali provider.

## Evidenza richiesta
Transaction/reference verificabile secondo il rail e conferma indipendente prima di `PAID`.

## Definition of done
Un settlement non può auto-dichiararsi finale; failure e mismatch restano `UNSETTLED/FAILED`, e solo la verifica indipendente abilita lo stato finale.
