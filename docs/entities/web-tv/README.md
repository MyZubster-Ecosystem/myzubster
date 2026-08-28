# Web / MyZubster TV

## Scopo
Interfaccia web e TV per navigazione MyZubster, accesso all'orto live e percorsi TV dedicati.

## Repository/componenti collegati
`myzubster`, `MyZubsterWeb`, documentazione Google TV.

## Stato
Web pubblico esistente; funzioni TV avanzate in validazione/Draft PR finché non completano CI, deploy preview e QA su hardware Google TV/Android TV reale.

## Input → Output
Telecomando/D-pad e sessione utente → navigazione, contenuti, stream autorizzati e funzioni TV consentite.

## Sicurezza
Mai incorporare password camera o token permanenti. Gli stream privati devono essere autorizzati server-side e preferibilmente temporanei.

## Evidenza richiesta
Build Android/TV, checksum artefatto, CI, preview/deploy e test reale D-pad/focus/playback.

## Definition of done
Installazione reale, login, navigazione D-pad, playback, gestione errori e logout verificati su dispositivo fisico.
