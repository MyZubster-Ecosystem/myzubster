# Nicola — Project Planner AI/Zorgax MVP v1

## Status

`PROPOSED_FOR_PILOT_TEST`

This document defines the smallest testable version after Nicola directly selected `project-planner-ai` on 2026-08-31. It is an internal MyZubster / Zorgax digital-business pilot artifact. It is not evidence of an EU LIFE grant, partnership, commercial success, customers, revenue, or deployment.

## Primary validation hypothesis

A creator or aspiring entrepreneur who currently uses AI in a fragmented way can use a lightweight Zorgax Project Planner to turn one real work objective into an ordered, measurable action plan, identify the next useful action, and preserve evidence of progress without manually reconstructing decisions across multiple chats/tools.

## Target user/problem

**Target user:** creator or aspiring entrepreneur using AI tools for a real project.

**Problem:** objectives, decisions, tasks, deadlines, prompts, blockers, and evidence are scattered across conversations and tools, making it difficult to know what to do next and what has actually been completed.

## Minimum testable offer

A single-project planner with only these capabilities:

1. **Project brief** — objective, desired outcome, deadline, weekly time available.
2. **Task list** — 3–7 bounded tasks with priority, due date, status, and one explicit next action.
3. **AI work note** — optional prompt/brief or decision note attached to a task.
4. **Evidence log** — short note or link describing what was actually completed or learned.
5. **Review** — blocker, what changed, and recommended next action.

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

Nicola enters one real project objective and creates the first 3–7 tasks. The planner must expose a clear top priority and next action.

### Days 1–7 — use

For each meaningful work session Nicola may:

- mark a task status;
- record one blocker or decision;
- attach an evidence note/link when something real is completed;
- request/review the next action.

No daily activity is required if no real project work occurs; inactivity must not be converted into artificial evidence.

## Evidence to collect

- time required to create the first usable plan;
- whether a clear top-three priority list was produced;
- whether at least one real project task was executed;
- whether at least one completed task has an evidence record;
- number and type of blockers identified;
- participant usefulness rating (1–5);
- participant answer to: “Would you continue using this planner for the same project?” yes/no + short reason;
- any specific missing feature that blocked real use.

## Predefined GO / CHANGE / STOP criteria

Evaluate only after the test period or when Nicola explicitly ends the test.

### GO

Continue to a second iteration when at least **5 of 6** conditions are met:

1. first usable plan created in 15 minutes or less;
2. top three priorities are clear to the participant;
3. at least one real task is completed using the plan;
4. at least one completed task contains a real evidence record;
5. usefulness rating is at least 4/5;
6. Nicola says he would continue using the planner for the same project.

### CHANGE

Revise the MVP when **3–4 of 6** GO conditions are met, or when the participant wants to continue but identifies a specific workflow blocker. The next iteration must address the smallest evidenced blocker first.

### STOP

Stop or replace the concept when **0–2 of 6** GO conditions are met, or Nicola explicitly says the workflow is not useful and would not continue using it. Do not add features merely to avoid a STOP result.

## Implementation acceptance criteria

- [ ] Nicola's direct selection evidence is linked.
- [ ] MVP scope matches `project-planner-ai`.
- [ ] First-project input fields and task/evidence model are defined.
- [ ] No payment, publication, pricing, merge, or outbound-email automation is introduced.
- [ ] Test evidence can distinguish implemented behavior from pilot-tested behavior.
- [ ] GO / CHANGE / STOP criteria are fixed before results are collected.
- [ ] Any code implementation is reviewed through branch → commit → PR → human review.

## Linked governance

- Parent pilot: #853
- Validation package: #855
- Selection evidence: `docs/life/nicola-project-planner-selection-2026-08-31.json`

