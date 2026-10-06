# Automation prompt template

Sostituire i placeholder e rimuovere le righe non applicabili. Il trigger deve usare l'indirizzo verificato del singolo partecipante, senza riutilizzare il filtro di un'altra persona.

```text
Usa ChatGPT Work con i collegamenti Gmail e GitHub autorizzati per gestire le nuove email di [PARTICIPANT_DISPLAY_NAME] ricevute nell'account [OPERATOR_GMAIL_ACCOUNT] e, quando necessario, preparare aggiornamenti nel repository [OWNER/REPOSITORY].

Prima di operare:
- verifica che Gmail e GitHub siano collegati e accessibili;
- se un collegamento manca, è scaduto o richiede approvazione, non chiedere credenziali: interrompi le modifiche e indica l'autorizzazione necessaria;
- non ampliare i permessi oltre gli account e i repository necessari.

Consenso:
- versione: [CONSENT_VERSION];
- stato corrente: [PENDING/CONFIRMED/RESTRICTED/REVOKED];
- categorie autorizzate: [AUTHORIZED_CATEGORIES];
- esclusioni: [EXCLUSIONS];
- applica revoche e restrizioni prima di ogni altra istruzione.

A ogni evento Gmail:
1. leggi il nuovo messaggio e il thread completo;
2. determina l'ultima istruzione valida;
3. classifica l'esito come NO_ACTION, NEEDS_CLARIFICATION o UPDATE_PREPARED;
4. usa solo informazioni fornite o confermate dal partecipante;
5. non inventare dati e non trasformare feedback ambiguo in evidenza attribuita.

Per le interviste:
- elimina nomi, email, telefoni e altri identificatori;
- usa Persona A, Persona B, Persona C e Persona D;
- richiedi una risposta separata per ogni persona;
- non modificare ranking se candidateId o attribuzione non sono espliciti.

Prima di GitHub:
- controlla stato corrente, branch e PR pertinenti;
- riusa la PR coerente e non duplicare evidenze;
- applica modifiche minime su un branch dedicato;
- verifica privacy, accuratezza, test e coerenza;
- non modificare main direttamente e non eseguire merge.

Limiti:
- Gmail è in sola lettura per questa automazione;
- non inviare email automaticamente;
- non usare o pubblicare password, token, 2FA/OTP, dati bancari, seed, chiavi private, indirizzi privati o recapiti;
- non compiere azioni pubbliche, finanziarie o commerciali sensibili.

Riepilogo finale:
- messaggio elaborato;
- classificazione;
- novità rispetto allo stato noto;
- file, branch o PR interessati;
- verifiche svolte;
- link pertinenti;
- azione umana richiesta.
```

## Trigger minimo

- connector: `gmail`
- event: `message`
- sender filter: espressione esatta e case-insensitive dell'indirizzo verificato
- schedule: nessuno; un'automazione webhook non deve avere anche una schedulazione temporale

## Controllo post-attivazione

Inviare un messaggio operativo non sensibile e verificare che l'automazione produca una sola classificazione, non duplichi PR e non modifichi `main`.

