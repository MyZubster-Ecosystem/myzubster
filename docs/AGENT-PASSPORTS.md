# MyZubster Agent Passports

MyZubster can assign verifiable contribution records to software agents and bots without treating them as people or claiming human competence.

An **Agent Passport** is a technical identity record that links a bot or AI agent to the tasks it performed, the version that performed them, the evidence produced, and any human review that followed.

The pathway is:

```text
AGENT / BOT
   ↓
TASK / INPUT
   ↓
OUTPUT / ACTION
   ↓
COMMIT / PR / TEST / LOG / ARTIFACT
   ↓
HUMAN OR PROJECT REVIEW
   ↓
AGENT KNOWLEDGE CARD
   ↓
AGENT PASSPORT
   ↓
KNOWLEDGE GRAPH NODE
```

## Human vs agent identity

Contributor Passports and Agent Passports are separate.

- A **Contributor Passport** represents a person who opts in.
- An **Agent Passport** represents a software system, bot or AI agent.
- An agent must never be presented as a human contributor.
- A bot output does not automatically become verified knowledge.
- Human review, tests and project acceptance remain separate evidence layers.

## Required evidence

Every Agent Passport contribution should identify, where available:

- agent/bot name;
- repository and implementation path;
- version, commit SHA or deployment identifier;
- task or trigger;
- input/source context, excluding private data;
- output/action;
- PR/commit/test/log/artifact URL;
- timestamp;
- review state;
- human reviewer or project acceptance evidence where applicable;
- limitations.

## Review states

- `UNREVIEWED` — output exists but has not been reviewed.
- `TESTED` — automated tests support the specific behavior.
- `PROJECT_REVIEWED` — a maintainer/reviewer accepted the contribution or behavior.
- `EXTERNALLY_REVIEWED` — independent review evidence exists.

A test passing does not by itself imply scientific truth, security certification, or broad reliability.

## Rewards

An agent may be associated with an internal reward or project accounting record, but a bot is not a legal or human payee.

External crypto settlement must identify the actual human/team/organization recipient and remain separate from the Agent Passport's technical evidence.

## Initial MyZubster agent examples

### GitHubMonitor

**Agent ID:** `agent:github-monitor`

**Implementation:**
- `services/ai-automation/src/github/monitor.js`
- orchestration through `services/ai-automation`

**Verifiable behavior already present:**
- monitors repository activity;
- emits issue/PR-related events;
- can run in mock/test mode;
- has project test evidence connected to merged PR #259.

**Candidate Agent Knowledge Cards:**
- GitHub repository event monitoring
- Deterministic monitor test behavior
- Tokenless/mock-mode operation

**Evidence boundary:** PR #259 primarily proves the contributor's tests and the tested GitHubMonitor behavior. It does not prove that every production deployment of the bot behaves identically.

### Zorgax

**Agent ID:** `agent:zorgax`

Zorgax can accumulate Agent Knowledge Cards only from traceable project behavior such as:
- contributor onboarding;
- Knowledge Card draft assistance;
- evidence-linking workflows;
- profile/README preparation;
- project decomposition and navigation.

Each card should link to the relevant implementation, tests, issue/PR or reproducible artifact. Conversational output alone is not enough to classify a claim as project-verified knowledge.

### AgricoloBot

**Agent ID:** `agent:agricolobot`

AgricoloBot may receive an Agent Passport once its implementation and contribution attribution are reconciled.

Current reward history around the AgricoloBot work is marked disputed/not verified in the canonical rewards ledger. Therefore:
- no paid/settled status should be inferred;
- no contributor attribution should be promoted to verified until reconciled;
- technical Knowledge Cards should reference only actual accessible code/PR evidence.

## Machine-readable record

Example:

```json
{
  "schema": "myzubster.agent-passport.v1",
  "agentId": "agent:github-monitor",
  "name": "GitHubMonitor",
  "agentType": "automation-bot",
  "implementation": {
    "repository": "MyZubster-Ecosystem/myzubster",
    "path": "services/ai-automation/src/github/monitor.js",
    "versionRef": "commit-or-release"
  },
  "contributions": [
    {
      "task": "monitor repository activity",
      "evidence": [
        "https://github.com/MyZubster-Ecosystem/myzubster/pull/259"
      ],
      "reviewState": "TESTED",
      "limitations": [
        "Test evidence applies to the tested revision and scenarios."
      ]
    }
  ],
  "knowledgeCards": [],
  "reviewState": "TESTED"
}
```

## Knowledge Graph interoperability

Agent nodes should use a distinct type from people:

```text
Contributor ──contributed──> Knowledge Card
Agent       ──produced/tested──> Agent Knowledge Card
PR/Commit   ──evidence-for──> Card
Reward Tx   ──settlement-for──> Human/Team contribution
```

This separation lets MyZubster show collaboration between people and agents without merging identities or overstating evidence.
