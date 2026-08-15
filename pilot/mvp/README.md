# MyZubster MVP Pilot — Synthetic Sandbox

Questo modulo implementa il primo core del pilot con dati **100% sintetici**.

## Cosa dimostra

- workflow controllato: `open → assigned → in_progress → verification → closed`
- audit trail append-only a livello applicativo
- KPI di presa in carico, chiusura, completamento e SLA
- dataset riproducibile per demo con Comune, Anthea e Hera
- nessuna integrazione con sistemi esterni

## Dati

`synthetic/interventions.json` contiene quattro interventi fittizi.

`synthetic/audit-events.json` contiene eventi di esempio fittizi.

Non inserire in questo percorso dati personali, credenziali, coordinate reali, identificativi di utenti o dati operativi di enti.

## Demo

Dalla root del repository:

```bash
node pilot/mvp/run-demo.js
```

## Test

```bash
node --test pilot/mvp/core/workflow.test.js
```

## Limiti MVP

Questo è un prototipo di dominio. L'immutabilità dell'audit trail è garantita solo dal modello applicativo; per un ambiente reale serviranno persistenza append-only, autorizzazioni, logging centralizzato, backup, controllo accessi e security review.

Non include pagamenti, tokenizzazione, custody crypto, RWA o mainnet.
