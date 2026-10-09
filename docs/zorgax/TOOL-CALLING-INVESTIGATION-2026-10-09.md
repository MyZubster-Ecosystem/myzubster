# ZORGAX: reproducing an Ollama / Open WebUI tool-calling loop

**Status:** Investigation in progress; not a confirmed upstream bug or a permanent fix.  
**Evidence date:** 2026-10-09.  
**Scope:** Local `zorgax:latest` (Qwen2.5 3B-derived model), Ollama 0.32.14, Open WebUI v0.11.4 in an isolated Docker test environment.

## Problem

When asked to list active automations, ZORGAX sometimes re-invoked `list_automations` after receiving a successful empty result:

```json
{"automations":[],"total":0}
```

The original Open WebUI configuration showed repeated calls. A subsequent isolated Open WebUI reproduction reached `Tool-call limit reached (3 iterations)`. This does **not** by itself establish whether the cause is the model, prompt, tool schema, tool selection, normalization, or integration.

## Observed evidence

| Experiment | Result | Interpretation |
| --- | --- | --- |
| Direct Ollama `/api/chat`, synthetic tool result | `Non ci sono automazioni attive al momento.`; no further tool calls; `done: true` | Model can stop in this synthetic context |
| Actual Open WebUI `convert_output_to_messages()` exercised with paired fixture | Assistant `tool_calls` and tool `tool_call_id` matched; empty JSON preserved | Conversion function works for this fixture |
| Diagnostic Open WebUI before restricting tools | Repeated `list_automations`; stopped by 3-iteration cap | Loop reproduced in isolated environment |
| Proxy capture of an initial request | One captured request advertised approximately 35 built-in tools | More tool exposure than direct Ollama experiment; **not proof of cause** |
| Diagnostic Open WebUI, single harmless `list_automations` tool | One call, one empty result, successful final reply | End-to-end success under narrower tool exposure |
| Filtered proxy capture of successful continuation | Request 7: `tools=['list_automations']`; request 8: assistant call ID `call_pdq1x0hr`, matching tool response, `empty_automations_result=true` | The successful empty result crossed the Open WebUI → Ollama HTTP boundary |

**Important limits:** The captured proxy logs were *redacted structural summaries*, not full request bodies. We have **not** yet performed an apples-to-apples A/B comparison with identical system prompts, schemas, model options and only one changed variable. Some ancillary tasks in the fresh diagnostic installation mistakenly attempted to chat with `nomic-embed-text` (embedding-only model); that is a distinct finding, not an established loop cause. Three **iterations** are not necessarily three individual tool calls.

## Local reproduction (no MyZubster infrastructure access required)

Use your own Ollama/Open WebUI installation or an isolated disposable Docker setup. **Do not point tests to the project VPS, scrape other users' chats or enable destructive built-in tools.**

1. Use `zorgax:latest` if you have an authorized local model build; otherwise use a local tool-capable model and record the exact model, digest, version, template and options. The original custom ZORGAX model artifact is **not supplied in this guide**, so a different model is only an analogous test.
2. Create a separate Open WebUI profile/model configuration. Select **Native function calling** and disable built-in tools, terminal, web search and code execution.
3. Create a single Open WebUI Workspace Tool containing the following safe Python fixture:

```python
"""
title: ZORGAX Automation Test
description: Harmless tool-calling fixture; never reads real automations.
version: 1.0.0
"""
class Tools:
    def list_automations(self) -> dict:
        """List active automations (synthetic fixture)."""
        return {"automations": [], "total": 0}
```

4. Enable **only** this custom tool in the chat; verify the actual model variant is selected. Ask: `Controlla quali automazioni sono attive usando list_automations. Se non ce ne sono, dimmelo.`
5. Record tool-call count, final response, and whether the tool result reaches the next upstream request. In the successful local diagnostic test, ZORGAX called the tool once and replied that no automations were active.
6. For a separate controlled comparison, expose a set of harmless additional tools **without** granting access to real automation, calendar, filesystem or infrastructure operations. Change one variable at a time.

### Safety / termination

A safety cap was configured in the diagnostic Open WebUI container:

```yaml
environment:
  CHAT_RESPONSE_MAX_TOOL_CALL_ITERATIONS: "3"
```

The investigated build defaulted to 256 iterations. **Do not** interpret the cap as a root-cause fix, and do not assume it limits the number of function calls inside each iteration. Use isolated data, least privilege and remove temporary proxies/firewall rules after your experiment. Never publish access tokens, real prompt contents, database dumps, server addresses or private conversations.

## What contributors can investigate

- **A/B reproducibility:** Same model digest/template, system prompt, user message, temperature/options and tool schema; vary only tool count or tool names. Run more than one trial to account for sampling.
- **Transport:** Compare the *actual follow-up* HTTP request after `list_automations` returns empty with an equivalent direct Ollama `/api/chat` request. Check roles, order, `tool_calls`, `tool_call_id`, arguments, content, tools and system messages. Publish only sanitized diffs.
- **Behavioral regression:** Add automated tests for empty-success, genuine error, malformed arguments, tool-call ID pairing and multiple tools; assert bounded iterations and human-readable final answers.
- **Model selection:** Investigate ancillary chat tasks accidentally choosing embedding-only models, independently of the tool loop.
- **Observability:** Propose a privacy-safe capture utility that preserves redacted structure and schema hashes, not secrets or chat content.

### Contribution evidence template

```text
Environment: OS / Docker / Open WebUI version / Ollama version
Model: name + digest, template, native/legacy mode
Tools: names, JSON schema hashes, permission scope
System prompt: sanitized identity or hash; avoid private content
Controlled variable:
Input (synthetic):
Expected behavior:
Observed behavior: repetitions / result / final answer
Upstream message sequence: sanitized roles, call IDs, result presence
Reproduction count:
Logs/tests (sanitized):
Safety cleanup performed:
Proposed change / PR:
```

Start at [CONTRIBUTING.md](../../CONTRIBUTING.md). Discuss reproduction findings in the linked tracking issue, and submit focused pull requests with tests. Contributors may work on their own infrastructure; no credentials or access to the main MyZubster VPS are needed.

## Research context

The investigation was prompted by a suggestion on [Coder Legion](https://coderlegion.com/30386/building-zorgax-turning-a-local-llm-into-a-devops-ai-agent#a30394) to compare the **first follow-up request** with a direct Ollama control, retaining assistant tool-call and paired tool-result messages. We thank the commenter for this test direction. This write-up reports observed results without attributing fault prematurely.
