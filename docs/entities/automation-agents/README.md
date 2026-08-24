# Automation / Agents

## Scopo
Automazione interna e agenti AI/GitHub con supervisione umana per manutenzione, triage e workflow ripetibili.

## Repository collegati
`ai-automation`, `myzubster-ai-bot`.

## Stato
Track interno/privato in sviluppo; non equivale a un servizio pubblico autonomo.

## Input → Output
Eventi/repository context consentiti → analisi, proposte, issue/PR o report secondo policy.

## Sicurezza
Least privilege, nessuna esposizione di secret, nessun merge/force push automatico fuori dalle policy approvate, auditabilità delle azioni.

## Evidenza richiesta
Log delle azioni, commit/PR prodotti e distinzione tra proposta automatica e decisione umana.

## Definition of done
L'automazione è riproducibile, limitata nei permessi, osservabile e non può trasformare un'ipotesi in stato operativo senza verifica.
