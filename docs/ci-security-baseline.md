# MYZ-208 — Node CI and security baseline

This document records the repository-wide baseline discovered while validating MYZ-70.

## Current CI baseline

On the MYZ-70 validation run:

- backend lint completed successfully;
- backend tests reported 32 failed suites and 162 passed suites;
- 45 tests failed and 803 passed;
- failures span Zorgax payments, Stripe contract/UI checks, kefir Marketplace contracts, realtime gateway and Metaverse observability;
- the MYZ-70 social-foundation schema test was not listed among failing suites.

These failures must not be silently skipped or weakened to make unrelated pull requests green.

## Security baseline

`npm audit --audit-level=high` reported:

- 11 low;
- 3 moderate;
- 8 high;
- 0 critical.

Observed high-severity dependency paths include morgan, undici, jsdiff and serialize-javascript.

The root dependency manifest already declares `morgan ^1.11.0`, while `backend/package.json` still declares `morgan ^1.10.0`. Dependency remediation should be performed through normal package-manager lockfile updates and tested in isolated commits. Do not use `npm audit fix --force` as a blanket remediation.

## Remediation rules

1. Reproduce failures against current `main` before changing application behavior.
2. Repair stale tests only when the intended contract is documented by current production behavior or an owning roadmap issue.
3. Do not delete, skip or weaken security assertions merely to pass CI.
4. Prefer non-breaking dependency upgrades; isolate breaking upgrades into dedicated changes.
5. Re-run Test/Lint, Security Audit and Continuous Evidence Gate after each remediation group.

Tracking: Linear MYZ-208.
