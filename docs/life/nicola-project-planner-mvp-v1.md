# Nicola — Project Planner AI/Zorgax MVP v1

## Status

`IMPLEMENTED_READY_FOR_PILOT_TEST`

This document defines the smallest testable version after Nicola directly selected `project-planner-ai` on 2026-08-31. It is an internal MyZubster / Zorgax digital-business pilot artifact. It is not evidence of an EU LIFE grant, partnership, commercial success, customers, revenue, or production deployment.

The first usable implementation is a standalone browser planner at:

`/nicola-project-planner`

The preview route was independently fetched with HTTP `200` after Vercel built the branch. This proves the preview artifact is reachable in the deployment context checked; it does not prove Nicola has started or used the pilot.

The implementation stores data locally in the participant's browser and does not transmit evidence automatically. The pilot becomes `ACTIVE` only when Nicola explicitly presses **Avvia i 7 giorni** after entering a real project objective.

## Primary validation hypothesis

A creator or aspiring entrepreneur who currently uses AI in a fragmented way can use a lightweight Zorgax Project Planner to turn one real work objective into an ordered, measurable action plan, identify the next useful action, and preserve evidence of progress without manually reconstructing decisions across multiple chats/tools.

## Target user/problem

**Target user:** creator or aspiring entrepreneur using AI tools for a real project.

**Problem:** objectives, decisions, tasks, deadlines, prompts, blockers, and evidence are scattered across conversations and tools, making it difficult to know what to do next and what has actually been completed.

## Minimum testable offer

The implemented MVP provides:

1. **Project objective** — one real project goal entered by Nicola before starting.
2. **Seven-day task sequence** — one bounded planning/execution/review step for each day.
3. **Evidence log** — a local note describing what was actually completed.
4. **Blocker/decision log** — a local note recording blockers or decisions.
5. **Progress + next action** — completion percentage, evidence count, and first incomplete daily step.
6. **Final review** — before/after clarity rating, reuse intent, final note, and GO / CHANGE / STOP decision.
7. **Participant-controlled export** — explicit JSON export; no automatic transmission.

## Explicitly excluded from MVP v1

- automated payments or wallet actions;
- autonomous purchases;
- automatic outbound email or commercial messaging;
- automatic publication or product launch;
- automatic price changes;
- autonomous GitHub merge;
- complex team/project-management features;
- claims about productivity, income, customers, or commercial success before evidence exists.

## Seven-day pilot test

### Day 0 — setup

Nicola opens `/nicola-project-planner`, enters one real project objective, and explicitly starts the test. Until he presses **Avvia i 7 giorni**, implementation evidence must not be called pilot-use evidence.

### Days 1–7 — use

For each meaningful work session Nicola may:

- complete the current daily step;
- record one blocker or decision;
- attach an evidence note when something real is completed or learned;
- follow the first incomplete step shown as the next action.

No daily activity is required if no real project work occurs; inactivity must not be converted into artificial evidence.

## Evidence to collect

- whether Nicola explicitly starts the planner with a real project objective;
- whether the seven-day sequence helps expose a clear next action;
- whether at least one real project task/action is executed;
- whether at least one completed step has an evidence record;
- number and type of blockers/decisions recorded;
- clarity rating before and after the test;
- participant answer to whether he would reuse the planner;
- final participant GO / CHANGE / STOP decision;
- any specific missing feature that blocked real use.

## Predefined GO / CHANGE / STOP criteria

Evaluate only after the test period or when Nicola explicitly ends the test.

### GO

Continue to a second iteration when at least **5 of 6** conditions are met:

1. first usable plan created in 15 minutes or less;
2. top priorities / next action are clear to the participant;
3. at least one real task is completed using the plan;
4. at least one completed step contains a real evidence record;
5. usefulness/clarity outcome is positive (target at least 4/5 after use or a clear improvement from baseline);
6. Nicola says he would continue using the planner for the same project.

### CHANGE

Revise the MVP when **3–4 of 6** GO conditions are met, or when the participant wants to continue but identifies a specific workflow blocker. The next iteration must address the smallest evidenced blocker first.

### STOP

Stop or replace the concept when **0–2 of 6** GO conditions are met, or Nicola explicitly says the workflow is not useful and would not continue using it. Do not add features merely to avoid a STOP result.

## Implementation acceptance criteria

- [x] Nicola's direct selection evidence is linked.
- [x] MVP scope matches `project-planner-ai`.
- [x] Project objective and task/evidence model are implemented.
- [x] Seven-day planner exposes progress and next action.
- [x] Evidence remains local until participant-controlled export.
- [x] No payment, publication, pricing, merge, or outbound-email automation is introduced.
- [x] Test evidence can distinguish implemented behavior from pilot-tested behavior.
- [x] GO / CHANGE / STOP criteria were fixed before results are collected.
- [x] Implementation is on branch → commits → PR → human review.
- [x] Vercel preview route returned HTTP 200 in an authenticated deployment check.

## Linked governance

- Parent pilot: #853
- Validation package: #855
- Pull request: #884
- Selection evidence: `docs/life/nicola-project-planner-selection-2026-08-31.json`
- Implementation: `public/nicola-project-planner.html`
- Vercel route: `/nicola-project-planner`
- Test coverage: `tests/zorgaxLifePilotNicolaPlanner.test.js`
