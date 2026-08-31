# Caso Nicola - precedente operativo

## Scopo

Il caso Nicola ha verificato un percorso controllato in cui un partecipante fornisce consenso e informazioni via email, ChatGPT/Zorgax classifica gli aggiornamenti e GitHub conserva soltanto output minimizzati e revisionabili.

## Cosa è stato completato

- profilo pubblico minimo con identità GitHub dichiarata dal partecipante;
- consenso esplicito a `Zorgax Participant Profile Automation v0.1`;
- automazione attivata sui nuovi messaggi del partecipante;
- classificazione `NO_ACTION`, `NEEDS_CLARIFICATION`, `UPDATE_PREPARED`;
- due idee di prodotto registrate senza dichiarare una scelta finale;
- feedback preliminari anonimizzati;
- branch, commit, pull request, test e controlli di sicurezza/evidenza;
- revisione e integrazione su `main` delle PR #850 e #857;
- invio di istruzioni per collegare ChatGPT, Gmail e GitHub senza condividere credenziali.

## Risultati pubblici

- Profilo: `docs/NICOLA_LORENZINI_LIFE.md`
- Evidenze normalizzate: `docs/life/nicola-validation-followup-2026-08-30.json`
- Profilo e consenso: pull request #850
- Idee e validazione: pull request #857

## Cosa non è stato considerato completato

- il collegamento OAuth del partecipante finché non confermato dal suo account;
- il ranking tra le idee, perché i feedback non erano attribuiti in modo univoco;
- quattro risposte individuali complete: due intervistati erano stati riportati insieme;
- vendite, pubblicazione, pagamenti o successo commerciale;
- partecipazione o finanziamento da parte del Programma LIFE dell'Unione europea.

## Lezioni riutilizzabili

1. Una conferma di consenso non è un aggiornamento operativo.
2. Una persona nominata nell'email deve diventare un'etichetta anonima nel repository.
3. Feedback aggregati non devono essere duplicati nei punteggi dei candidati.
4. Il collegamento pubblico GitHub non sostituisce la verifica OAuth autenticata.
5. Un'automazione deve fermarsi quando identità, scope o attribuzione sono ambigui.
6. La PR è un contenitore di revisione, non prova di pubblicazione o risultato reale.

## Pattern da replicare

Riutilizzare il flusso e i gate; sostituire sempre partecipante, indirizzo verificato, identità GitHub, obiettivi, candidati ed evidenze. Non copiare dati o consenso da questo caso.

