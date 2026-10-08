# Zorgax Capability Registry

This directory defines what Zorgax is allowed and evidenced to do with MyZubster contributor evidence.

## Separation of concerns

Contributor competence and Zorgax capability are intentionally separate.

A contributor record answers:

- who produced or owns the evidence;
- what domain or activity is documented;
- what commit, PR, Knowledge Card or checkpoint supports it;
- what evidence state applies.

A Zorgax capability answers:

- which evidence types Zorgax may consume;
- what actions Zorgax may perform;
- which claims it must not make;
- which source state is required;
- whether a bounded test is required before the capability can be called TESTED.

## Capability states

- `PROPOSED` — design exists but is not yet documented as an operational capability.
- `DOCUMENTED` — inputs, actions, guardrails and evidence requirements are defined.
- `IN_VERIFICATION` — a bounded test is being prepared or executed.
- `TESTED` — a bounded checkpoint produced the expected PASS within the stated scope.
- `DISABLED` — the capability must not be used operationally.

## Evidence rule

Zorgax must not promote evidence.

Examples:

- `SUPPORTED` research remains `SUPPORTED` when summarized or retrieved.
- self-declared profile interests remain self-declared until separately verified.
- contributor-side technical verification does not become certification.
- VPS → broker → contributor agent interoperability does not become direct P2P or complete decentralization.

## Files

- `capability.schema.json` — machine-readable capability schema.
- `contributor-profile-assistant.json` — consent-bounded contributor profile drafting.
- `research-evidence-navigator.json` — contributor-scoped research evidence navigation.
- `interoperability-checkpoint-assistant.json` — evidence-first checkpoint structuring.
- `../zorgax-capability-registry.json` — central index.

## Next gate

The next implementation step is CI validation for every capability JSON plus bounded test evidence for capabilities that are currently only `DOCUMENTED`.
