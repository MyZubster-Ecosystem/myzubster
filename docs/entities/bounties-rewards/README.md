# Bounties / Rewards

## Scopo
Gestisce la definizione del lavoro, submission, review, verifica e registrazione del reward.

## Componenti collegati
`BOUNTIES.md`, core platform, Gateway/settlement, independent verifier.

## Stato
Workflow canonico documentato; reward interno e settlement esterno devono restare separati.

## Lifecycle
`PROPOSED → VALIDATED → APPROVED → FUNDED → ACTIVE → SUBMITTED → UNDER_REVIEW → VERIFIED/REJECTED → REWARD_RECORDED → SETTLED/PAID` solo con evidenza appropriata.

## Sicurezza
Nessun bounty deve incentivare accesso non autorizzato, raccolta di dati privati, attività distruttive o pubblicazione di infrastrutture sensibili.

## Evidenza richiesta
Issue/PR/merge provano contributo tecnico, non pagamento. `PAID` richiede evidenza di settlement indipendentemente verificabile.

## Definition of done
Il lavoro è verificato, il reward è registrato correttamente e qualsiasi settlement esterno è classificato senza confondere claim e prova.
