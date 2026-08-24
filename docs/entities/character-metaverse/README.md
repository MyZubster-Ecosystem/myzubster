# Character / Metaverse

## Scopo
Rappresenta il personaggio/profilo MyZubster usato nelle esperienze digitali e, dove supportato, nel percorso TV/metaverse.

## Componenti collegati
TV Character Builder, Character Registry/profile persistence, MyZubster Metaverse documentation, Zorgax context.

## Stato
Documentato e in sviluppo/validazione. La presenza di UI o documentazione non equivale a persistenza end-to-end verificata.

## Input → Output
Scelte utente consentite → profilo/personaggio validato, ID persistente e rendering nelle esperienze supportate.

## Sicurezza
Ownership server-side; un client non può assegnarsi il personaggio di un altro utente. Personaggio, account, wallet e NFT sono concetti separati.

## Evidenza richiesta
Creazione, persistenza, reload, modifica e test cross-user negativi su backend e TV.

## Definition of done
Lo stesso utente autenticato crea, recupera e modifica solo il proprio personaggio da un percorso reale verificato.
