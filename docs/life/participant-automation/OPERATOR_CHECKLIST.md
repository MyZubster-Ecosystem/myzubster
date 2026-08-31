# Operator checklist

## 1. Prima dell'invito

- [ ] Definire track, scopo e repository.
- [ ] Verificare che il partecipante sappia cosa sarà pubblico.
- [ ] Scegliere un participant slug non sensibile.
- [ ] Preparare un canale autorizzato per il consenso.

## 2. Consenso e profilo

- [ ] Inviare la versione completa del consenso.
- [ ] Ricevere una conferma esplicita; il silenzio non vale.
- [ ] Registrare versione, data, scope ed esclusioni.
- [ ] Spiegare revoca e restrizione.
- [ ] Raccogliere il profilo senza credenziali o dati non necessari.

## 3. Collegamenti

- [ ] Verificare il corretto account Gmail con una lettura innocua.
- [ ] Verificare il corretto account GitHub.
- [ ] Verificare l'accesso al repository necessario.
- [ ] Limitare i permessi al minimo scope utile.
- [ ] Non chiedere password, token o OTP in chat o email.

## 4. Automazione

- [ ] Creare un trigger esatto per il mittente verificato.
- [ ] Inserire versione e stato del consenso nel prompt.
- [ ] Disabilitare invio email e merge automatici.
- [ ] Richiedere lettura del thread completo.
- [ ] Applicare `NO_ACTION`, `NEEDS_CLARIFICATION`, `UPDATE_PREPARED`.
- [ ] Provare un aggiornamento operativo non sensibile.

## 5. Evidenze

- [ ] Usare quattro risposte separate e anonime.
- [ ] Conservare il candidate ID in ogni risposta.
- [ ] Rimuovere nomi, recapiti e riferimenti identificativi.
- [ ] Segnalare risposte raggruppate o incomplete.
- [ ] Lasciare ranking impact a `NONE` finché il gate non è superato.

## 6. GitHub

- [ ] Controllare branch e PR esistenti prima di crearne altri.
- [ ] Usare un branch dedicato.
- [ ] Limitare il diff ai file del partecipante o del pilot.
- [ ] Eseguire test/lint e controlli pertinenti.
- [ ] Eseguire privacy ed evidence review.
- [ ] Non modificare `main` direttamente.
- [ ] Richiedere revisione umana prima del merge.

## 7. Chiusura o pausa

- [ ] Documentare stato e prossima azione.
- [ ] Applicare immediatamente revoche o restrizioni.
- [ ] Mettere in pausa l'automazione se connettori o consenso non sono validi.
- [ ] Non dichiarare completato ciò che è soltanto proposto o preparato.
- [ ] Conservare solo evidenze necessarie e autorizzate.

