# MyZubster Continuous Evidence Gate

**Status:** PUBLIC / AUTOMATED / EVIDENCE-FIRST  
**Baseline:** 29 August 2026

MyZubster uses a continuous evidence gate to make security evidence part of the software-change lifecycle rather than a one-time document.

## Automated chain

`PR / PUSH → EXACT INSTALL → TESTS → VULNERABILITY AUDIT → CYCLONEDX SBOM → HASHED EVIDENCE MANIFEST → GO / NO-GO`

The implementation is `.github/workflows/continuous-evidence-gate.yml`.

For each pull request and push to `main`, the workflow:

1. checks out the exact commit;
2. installs the exact npm lockfile tree with `npm ci`;
3. runs the repository tests;
4. runs `npm audit` and records scanner output;
5. blocks the security gate when an unresolved `CRITICAL` scanner finding is present;
6. generates a CycloneDX SBOM;
7. creates an evidence manifest containing commit/run identity and SHA-256 hashes of produced evidence;
8. uploads the evidence bundle as a GitHub Actions artifact.

## Gate semantics

`PASS-CRITICAL-GATE` means only that this automated dependency gate found no unresolved npm-audit CRITICAL finding for the exact scanned tree. It is **not** a vulnerability-free, secure, compliant, certified, authorized or production-ready declaration.

`NO-GO` means the automated critical dependency gate failed and the affected change must not be represented as security-cleared until remediated or supported by an accountable, documented disposition.

HIGH and lower findings remain subject to triage under `docs/VULNERABILITY-REGISTER.md`; tests, application security, secrets, configuration, infrastructure, privacy, AI governance, authorization and sector-specific requirements remain separate gates.

## Evidence produced

- `npm-audit.json`
- `security-gate.json`
- `evidence.cdx.json`
- `evidence-manifest.json`

The manifest binds the evidence to repository, commit, ref and workflow run and records SHA-256 hashes for the generated files.

## Governance principle

**NO EVIDENCE → NO SECURITY CLAIM.**  
**CRITICAL UNRESOLVED FINDING → NO HIGH-IMPACT PRODUCTION RELEASE.**  
**AUTOMATED PASS → STILL SUBJECT TO HUMAN / AUTHORIZATION / COMPLIANCE GATES WHERE APPLICABLE.**

## Related records

- `docs/VULNERABILITY-REGISTER.md`
- `docs/SBOM-REGISTER.md`
- `docs/ASSET-DEPENDENCY-REGISTER.md`
- `docs/CYBERSECURITY-BASELINE-THREAT-MODEL-INCIDENT-RESPONSE.md`
- `docs/PUBLIC-SECURITY-RESULTS-2026-08-29.md`
