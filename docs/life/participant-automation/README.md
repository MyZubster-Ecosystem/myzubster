# MyZubster LIFE Participant Automation Playbook

**Versione:** 1.0  
**Stato:** READY_FOR_REVIEW  
**Ambito:** pilot digitale interno MyZubster / Zorgax  
**Precedente verificato:** percorso Nicola, agosto 2026

Questo pacchetto trasforma il percorso svolto con Nicola in un metodo ripetibile per altri partecipanti. Standardizza consenso, onboarding, collegamento ChatGPT-Gmail-GitHub, raccolta di evidenze, aggiornamenti tramite branch e pull request, controlli di privacy e revisione umana.

> Questo playbook riguarda un pilot digitale interno MyZubster/Zorgax. Non dimostra finanziamento, approvazione, partnership o partecipazione a un progetto ufficiale del Programma LIFE dell'Unione europea.

## Risultato atteso

Ogni partecipante deve poter seguire lo stesso percorso senza copiare dati personali o decisioni di Nicola:

```text
INVITO
  -> CONSENSO ESPLICITO
  -> PROFILO MINIMO
  -> COLLEGAMENTO CHATGPT / GMAIL / GITHUB
  -> AUTOMAZIONE EVENT-DRIVEN
  -> EVIDENZA ANONIMIZZATA
  -> BRANCH / COMMIT / PULL REQUEST
  -> CONTROLLI
  -> REVISIONE UMANA
  -> MERGE O REVISIONE
```

## Contenuto del pacchetto

- `NICOLA_CASE_STUDY.md`: cosa è stato fatto e quali limiti sono emersi.
- `PARTICIPANT_PROJECT_TEMPLATE.md`: documento da copiare per ogni partecipante.
- `CONSENT_AND_ONBOARDING_TEMPLATE.md`: testo di consenso, profilo e collegamenti.
- `AUTOMATION_PROMPT_TEMPLATE.md`: prompt riutilizzabile per l'automazione.
- `VALIDATION_INTERVIEW_TEMPLATE.md`: formato per quattro risposte separate e anonime.
- `evidence-record-template.json`: struttura minima delle evidenze.
- `OPERATOR_CHECKLIST.md`: controlli end-to-end per l'operatore.

## Stati canonici

### Stato del partecipante

- `INVITED`: invito inviato, nessun consenso.
- `CONSENT_CONFIRMED`: consenso esplicito ricevuto.
- `PROFILE_READY`: profilo minimo verificato.
- `CONNECTORS_PENDING`: Gmail o GitHub non ancora verificati.
- `AUTOMATION_ENABLED`: trigger e prompt attivi.
- `VALIDATION_ACTIVE`: raccolta di evidenze in corso.
- `READY_FOR_HUMAN_REVIEW`: aggiornamento preparato e controllato.
- `PAUSED`: flusso sospeso da operatore o partecipante.
- `REVOKED`: consenso revocato; nessuna nuova elaborazione autorizzata.

### Esito di ogni email

- `NO_ACTION`: saluto, accettazione, duplicato o informazione già registrata.
- `NEEDS_CLARIFICATION`: informazione incompleta, ambigua, fuori consenso o non attribuibile.
- `UPDATE_PREPARED`: nuova informazione autorizzata e sufficiente per una modifica circoscritta.

## Ruoli minimi

| Ruolo | Responsabilità | Non può fare automaticamente |
|---|---|---|
| Partecipante | Consenso, obiettivi, dati confermati, revoca | Autorizzare altri partecipanti |
| Operatore | Verifica identità, consenso, scope e connessioni | Pubblicare dati non necessari |
| Zorgax / ChatGPT | Leggere, classificare, minimizzare, preparare modifiche | Inventare dati, effettuare merge o azioni sensibili |
| Maintainer | Rivedere PR, test, privacy e coerenza | Trattare una PR come prova di risultato reale |
| Evidence reviewer | Valutare completezza, attribuzione e limiti | Trasformare feedback ambiguo in ranking |

## Gate obbligatori

1. **Identità:** account e repository corretti, senza pubblicare email.
2. **Consenso:** frase esplicita, scope definito, revoca sempre disponibile.
3. **Connettori:** Gmail e GitHub accessibili con il minimo privilegio necessario.
4. **Privacy:** nessun nome di intervistato, recapito, credenziale o dato finanziario.
5. **Evidenza:** fonte, data, attribuzione al candidato e limiti documentati.
6. **GitHub:** branch dedicato, diff minimo, nessuna modifica diretta a `main`.
7. **Qualità:** test/lint, security audit e controlli di evidenza pertinenti.
8. **Decisione:** merge e azioni pubbliche/commerciali restano umani.

## Avvio rapido di un nuovo partecipante

1. Copiare `PARTICIPANT_PROJECT_TEMPLATE.md` in un nuovo file con uno slug non sensibile.
2. Inviare il testo di `CONSENT_AND_ONBOARDING_TEMPLATE.md` dal canale autorizzato.
3. Registrare solo la conferma e i dati inclusi nello scope.
4. Verificare Gmail e GitHub con azioni di sola lettura.
5. Creare un'automazione filtrata sull'indirizzo verificato del partecipante usando `AUTOMATION_PROMPT_TEMPLATE.md`.
6. Raccogliere evidenze con `VALIDATION_INTERVIEW_TEMPLATE.md`.
7. Salvare solo evidenze anonimizzate nello schema JSON.
8. Preparare una PR, eseguire i gate e richiedere revisione umana.

## Regole di replica

- Copiare la struttura, non i dati di Nicola.
- Usare un branch e un file separati per ogni partecipante.
- Non riutilizzare consenso, indirizzi, GitHub identity o evidenze tra persone.
- Non attribuire feedback a un'idea se il messaggio non la identifica chiaramente.
- Non dichiarare vendite, partnership, impatto o successo senza evidenza verificabile.
- Fermare il flusso se consenso, identità, autorizzazione o privacy non sono chiari.

## Definition of done

Un onboarding è tecnicamente completo quando identità, consenso, profilo, connettori e automazione sono verificati. Il pilot non è completato finché le evidenze richieste non sono raccolte, revisionate e collegate a una decisione umana documentata.

