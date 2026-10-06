# MyZubster — Aruba support role characters

This folder models three **support roles** for MyZubster infrastructure workflows associated with Aruba-based services.

These characters are operational archetypes. They are **not real Aruba employees, portraits, impersonations, endorsements or evidence of an official partnership with Aruba S.p.A.** Their purpose is to make support responsibilities, evidence and escalation flows understandable inside MyZubster.

Machine-readable manifest: [`aruba-support-characters.json`](./aruba-support-characters.json).

## 1. Cloud Support Engineer

**Mission:** diagnose cloud-service problems and turn troubleshooting into a traceable support record.

Typical interactions:
- open or inspect a technical support case;
- attach logs and diagnostic evidence;
- record affected services and symptoms;
- check availability/status information;
- document troubleshooting steps;
- escalate unresolved incidents;
- record the final resolution.

MyZubster objects: `support_case`, `diagnostic_evidence`, `incident`, `resolution_record`.

## 2. Infrastructure & Deployment Specialist

**Mission:** verify that MyZubster environments, deployments and infrastructure configuration are coherent and reproducible.

Typical interactions:
- register an environment;
- review a deployment;
- validate configuration assumptions;
- record network/runtime checks;
- verify a release after deployment;
- attach deployment evidence and corrective actions.

MyZubster objects: `environment`, `deployment`, `configuration_check`, `release_verification`, `corrective_action`.

## 3. Customer Assistance Coordinator

**Mission:** keep the support process organised from initial request to closure.

Typical interactions:
- register a support request;
- classify and route the case;
- request missing information;
- track follow-ups and escalation;
- maintain a communication timeline;
- confirm closure and outcome.

MyZubster objects: `support_request`, `case_assignment`, `follow_up`, `communication_event`, `closure_record`.

## Interaction workflow

```text
MyZubster user / operator
        ↓ reports issue
Customer Assistance Coordinator
        ↓ classifies + routes case
Cloud Support Engineer
        ↓ diagnostics + incident evidence
Infrastructure & Deployment Specialist
        ↓ deployment/configuration verification
Cloud Support Engineer
        ↓ resolution / escalation result
Customer Assistance Coordinator
        ↓ follow-up + closure
MyZubster audit trail
```

The characters should interact through **evidence-backed support workflows**, not fictional role-play. Every meaningful action should create or update a traceable object and preserve timestamps, status changes and supporting evidence.

## Status model

- `ROLE_DEFINED` — role exists in the MyZubster architecture.
- `CANDIDATE` — a provider/team may fit the role; no commitment is implied.
- `IN_DISCUSSION` — an active support or collaboration discussion exists.
- `CONFIRMED` — use only when the relationship and public representation are documented and authorised.
- `INACTIVE` — role is not currently active.

## Representation and privacy

Do not attach names, photographs, emails, ticket transcripts, phone numbers or likenesses of real Aruba staff to these characters without explicit permission.

Do not label Aruba S.p.A. as a MyZubster partner solely because support tickets, assistance conversations or infrastructure services exist. Commercial customer/support relationships and project partnerships are different concepts.

Private support tickets, credentials, IP addresses, access tokens, infrastructure secrets and confidential technical logs must never be committed to the public repository.

## UI behaviour

When implemented in MyZubster, each card should show the role, mission, current status, permitted actions, active cases and evidence trail. Identity-specific fields should remain separate from the public archetype.

The goal is to make infrastructure assistance visible as a transparent process: **request → routing → diagnostics → infrastructure verification → resolution → closure**.
