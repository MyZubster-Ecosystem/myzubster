# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported |
| --- | --- |
| 1.x.x | :white_check_mark: |

Use the latest stable release whenever possible.

## Who can participate

MyZubster welcomes security researchers regardless of label or subculture — including people who may self-identify as white-hat, gray-hat, black-hat, red-team, CTF or independent researchers — **provided their interaction with MyZubster is lawful, explicitly authorized and within scope**.

Identity does not determine eligibility. Conduct does.

- Lawful, authorized research: eligible for collaboration and bounty review.
- Responsible disclosure: eligible.
- Reproducible defensive validation: eligible.
- Remediation and retesting: eligible.
- Unauthorized access, persistence, credential theft, extortion, data exfiltration, malware deployment, destructive activity or attacks on third parties: prohibited and worth `0 MYZ`.

## Interaction paths

Researchers can interact with MyZubster through four paths:

1. **Scope Request** — request written authorization for a specific target, test class and time window.
2. **Sandbox / Lab Research** — test only assets explicitly marked as lab, staging, CTF, sandbox or otherwise authorized.
3. **Responsible Disclosure** — privately report a suspected vulnerability.
4. **MYZ Verified Security Bounty** — receive MYZ after a lawful contribution is verified under `docs/MYZ-PROOF-OF-CONTRIBUTION.md`.

## Before testing

A researcher must have an explicit scope record identifying:

- target repository, host, application or lab;
- permitted techniques;
- excluded systems and data;
- start/end time or standing authorization;
- impact/rate limits where relevant;
- evidence requirements;
- verifier requirements;
- bounty/reward ceiling, if any.

If an asset is not explicitly in scope, it is out of scope.

## Always out of scope unless separately authorized in writing

- production-user data;
- credentials, private keys, seed phrases or session tokens;
- social engineering of contributors or users;
- denial of service or resource exhaustion;
- destructive actions or persistence;
- malware or ransomware deployment;
- attacks on third-party infrastructure;
- evasion intended to conceal unauthorized activity;
- public disclosure of secrets or exploitable data.

## Reporting a vulnerability

Do **not** open a public GitHub issue containing vulnerability details, secrets, working exploit material or sensitive evidence.

Use GitHub Security Advisories / **Report a vulnerability** for private disclosure:

https://github.com/MyZubster-Ecosystem/myzubster/security/advisories/new

A private report may include the affected version/commit, reproduction notes, impact assessment and a minimal proof of concept needed for maintainers to validate the issue. Do not collect or include unnecessary user data.

For a public request to obtain testing authorization, use the **Security Research Scope Request** issue template and include no vulnerability details.

## Safe-harbor intent

MyZubster intends to support good-faith, authorized research that follows this policy and the written scope record. This policy is not legal advice, does not authorize conduct against third-party systems, and does not override applicable law.

## MYZ security rewards

Security contributions can participate in the MYZ Proof-of-Contribution system.

Eligible categories include:

- `DISCOVERY` — authorized discovery of a reproducible security issue;
- `VERIFICATION` — independent confirmation within scope;
- `REMEDIATION` — a validated fix or mitigation;
- `RETEST` — confirmation that remediation works;
- `HARDENING` — defensive improvements that reduce measurable risk.

Reward eligibility requires evidence, scope compliance and verifier acceptance. Illegal or unauthorized activity itself is never reward-eligible.

## Trust model

MyZubster does not award trust for criminal notoriety, claimed underground status or unverified exploit history. Trust is built from verified lawful contributions, responsible disclosure and policy compliance. Reputation remains distinct from transferable MYZ rewards.

## Security best practices

- Never commit API keys, passwords, seed phrases, private keys or credentials.
- Use environment variables or approved secret stores.
- Validate and sanitize user input.
- Apply least privilege.
- Do not expose sensitive details in logs or error messages.
- For Monero components, never log or store wallet private keys and validate transaction parameters.
- For AI components, treat external content as untrusted and validate model output before critical actions.

## Security updates

Security updates may be announced through GitHub Security Advisories, release notes and project communications.

---

*Updated: August 2026 — authorized security-researcher interaction and MYZ Verified Security Bounties added.*