# 🧭 MyZubster — Roadmap 2026: Stabilize → MVP → Pilot → Scale

Versione canonica (version-controlled) della roadmap esecutiva tracciata nell'issue **#395**.

- Controparte machine-readable: [`roadmap-2026.manifest.json`](./roadmap-2026.manifest.json)
- Validazione (zero dipendenze): `node scripts/validate-roadmap-manifest.js`
- Regola d'oro: nessun modulo nuovo entra in roadmap senza test, audit, documentazione API e security baseline (gate Phase 1).

## North Star

Portare MyZubster da ecosistema di componenti in sviluppo a **un prodotto verificabile, stabile e dimostrabile in un pilot reale**, senza anticipare funzionalità regolamentate o integrare sistemi di terzi senza autorizzazione.

## Priorità assolute

1. **Stabilità tecnica e CI verde**
2. **Security baseline + release gates**
3. **Space Station MVP end-to-end** come vertical slice dimostrabile
4. **AI Automation** come layer operativo interno
5. **Un pilot commerciale concreto** con un solo workflow iniziale
6. Solo dopo: payment/crypto production e RWA, subordinati ai gate legali/compliance

---

## PHASE 0 — RESET & STABILIZATION

**Obiettivo:** avere una baseline tecnica affidabile.

### P0 — Blocker

- [ ] #374 — risolvere conflict markers in `gardens.js`
- [ ] #375 — ripristinare dipendenze/import mancanti
- [ ] #376 — correggere contract/routing Gardens e test 404
- [ ] #377 — audit e remediation vulnerabilità npm
- [ ] #378 — stabilizzare submodule TARI nella CI
- [ ] Verificare CI pulita su Node supportati
- [ ] Eliminare duplicazioni/issue legacy che contraddicono la roadmap

### Definition of Done

- Installazione clean checkout riproducibile
- Test principali verdi
- Nessun conflict marker
- Critical security findings risolti o formalmente mitigati
- CI verde senza workaround locali

---

## PHASE 1 — PLATFORM FOUNDATION

**Obiettivo:** definire le fondamenta comuni che tutti i moduli devono usare.

- [ ] Schema/versioning delle entità
- [ ] API conventions e error contract
- [ ] Authentication + RBAC
- [ ] Audit trail/event model
- [ ] Synthetic fixtures deterministiche
- [ ] Logging sicuro e sanitizzato
- [ ] Configuration/secrets management
- [ ] Rate limiting
- [ ] Backup/recovery baseline
- [ ] Security checklist applicabile a ogni nuovo modulo

### Gate

Nessun nuovo modulo importante entra in roadmap senza test, audit, documentazione API e security baseline.

---

## PHASE 2 — SPACE STATION MVP

**Obiettivo:** costruire il primo vertical slice completo e dimostrabile.

### Core

- [ ] #382 — SpaceStation model
- [ ] #383 — Mission model
- [ ] #384 — event + audit trail
- [ ] #385 — CRUD/search API
- [ ] #386 — synthetic fixtures
- [ ] #387 — security/compliance baseline
- [ ] #388 — tests + CI
- [ ] #389 — API contract + documentation

### Telemetry

- [ ] #390 — Eva Ioni simulator
- [ ] #391 — telemetry ingestion/storage/API
- [ ] #392 — telemetry dashboard

### Integration

- [ ] #393 — Gateway API integration

### Vertical slice acceptance test

`Eva simulator → telemetry API → persistence → dashboard → audit trail → Gateway`

Il flusso deve essere eseguibile localmente con dati sintetici, riproducibile da clean checkout e dimostrabile senza dipendenze da hardware reale.

---

## PHASE 3 — AI AUTOMATION

**Obiettivo:** usare l'automazione AI per ridurre il lavoro operativo e migliorare qualità/review.

- [ ] GitHub issue monitoring
- [ ] Issue classification/triage
- [ ] Automated PR review (euristiche + checklist automatiche di qualità/security)

### Gate

L'automazione propone e classifica: nessuna azione irreversibile (merge, deploy, chiusura issue) senza approvazione umana.

---

## PHASE 4 — PILOT (un solo workflow)

**Obiettivo:** dimostrare il prodotto in un pilot commerciale concreto con un solo workflow iniziale.

- [ ] Selezionare UN workflow end-to-end concordato con il partner del pilot
- [ ] Onboarding, runbook operativo e SLA di supporto
- [ ] Metriche di adozione e report periodici

### Gate

Accordo scritto sul perimetro del pilot; nessuna integrazione di sistemi di terzi senza autorizzazione esplicita.

---

## PHASE 5 — PAYMENT/CRYPTO PRODUCTION & RWA (condizionata)

**Obiettivo:** abilitare payment/crypto production e RWA solo dopo i gate legali/compliance.

- [ ] Payment/crypto production readiness
- [ ] RWA: feasibility e perimetro regolamentato

### Gate

Gate legali/compliance superati e documentati prima di qualsiasi implementazione production.

---

> Nota: questo documento è la fonte di verità della roadmap 2026. Se l'issue #395 viene revisionata, aggiornare **questo file** e il manifest, poi eseguire `node scripts/validate-roadmap-manifest.js`.
