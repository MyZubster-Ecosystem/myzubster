# MyZubster SBOM Register

**Status:** PUBLIC / LOCKFILE-RECONCILED BASELINE  
**Baseline date:** 29 August 2026

> This register records a first exact-version dependency baseline from repository lockfiles. It is not yet a complete ecosystem-wide SBOM and it is not a vulnerability-free declaration.

## Method

The initial machine-readable BOM remains [`../sbom/myzubster-initial.cdx.json`](../sbom/myzubster-initial.cdx.json). The exact-version layer is now generated from `package-lock.json` by `.github/workflows/sbom-vulnerability-scan.yml`.

For each covered repository the workflow:

1. checks out the repository;
2. requires a `package-lock.json`;
3. extracts package name, exact resolved version, lockfile path, integrity value and dev/optional flags into `exact-dependencies.json`;
4. runs `npm audit --json` against the lockfile;
5. stores the lockfile, exact-version inventory and audit result as GitHub Actions evidence artifacts.

## Exact lockfile coverage — run 33236663936

| Repository | Exact dependency records | Lockfile scan | Known npm-audit findings | Current SBOM/security status |
|---|---:|---|---:|---|
| `MyZubster-Ecosystem/myzubster` | 713 | complete | 0 | `LOCKFILE RECONCILED / SCANNED` |
| `MyZubster-Ecosystem/MyZubsterGateway` | 95 | complete | 0 | `LOCKFILE RECONCILED / SCANNED` |
| `MyZubster-Ecosystem/MyZubster-Marketplace` | 963 | complete | 42 | `LOCKFILE RECONCILED / REMEDIATION REQUIRED` |
| `MyZubster-Ecosystem/MyZubster-App` | 1,377 | complete | 39 | `LOCKFILE RECONCILED / REMEDIATION REQUIRED` |
| `MyZubster-Ecosystem/myzubster-animal-registry` | 0 external dependency records | complete | 0 | `LOCKFILE RECONCILED / SCANNED` |

The Marketplace scan reports 18 low, 10 moderate, 13 high and 1 critical dependency finding. The App scan reports 1 low, 12 moderate, 25 high and 1 critical finding. Both critical summaries involve a vulnerable node-tar dependency chain and therefore remain open until remediated or supported by an evidence-based not-affected disposition.

## High-sensitivity dependency groups

| Group | Why it matters | Current gate |
|---|---|---|
| Authentication/tokens | Identity and authorization boundary | Exact lockfile versions now available for covered repos; continue advisory scan + runtime review |
| HTTP/API frameworks | Internet-facing attack surface | Dependency scan plus source/configuration testing |
| Database/ODM | Data integrity/access control | Version evidence + secure configuration review |
| Web3/payment dependencies | Potential financial/settlement exposure | Critical/high dependency findings must be triaged before high-impact use; regulatory/security review remains separate |
| Serial/IoT libraries | Device/physical boundary | Dependency evidence + hardware/input/auth review |
| ML libraries | Model/data/supply-chain risk | Dependency evidence + AI inventory/provenance review |
| Mobile location/camera/storage | Privacy-sensitive permissions | Dependency remediation + GDPR/mobile permission review |

## Coverage gaps

The wider ecosystem contains additional public and private repositories. They are not automatically covered by this five-repository scan. Private/high-sensitivity repositories, container images, GitHub Actions themselves, model/provider dependencies and non-npm ecosystems still require their own exact-version inventories and scanners.

A lockfile-derived inventory is also not equivalent to a complete release SBOM when build images, operating-system packages, firmware, external services, models or generated artifacts are part of the deployment.

## Required pipeline

```text
REPOSITORY
  ↓
MANIFEST IDENTIFICATION
  ↓
LOCKFILE / EXACT VERSION RECONCILIATION
  ↓
MACHINE-READABLE SBOM GENERATION
  ↓
LICENSE + PROVENANCE CHECK
  ↓
VULNERABILITY SCAN
  ↓
REACHABILITY / VEX OR REMEDIATION
  ↓
TEST + RESCAN
  ↓
RELEASE GATE
```

## Release gate

**NO EXACT VERSION → NO FINAL SBOM CLAIM.**  
**NO VULNERABILITY REVIEW → NO SECURITY-CLEAN CLAIM.**  
**CRITICAL UNRESOLVED FINDING → NO HIGH-IMPACT PRODUCTION RELEASE.**

Zero findings from `npm audit` means only that the scanner did not report known npm advisory matches for that lockfile at scan time. It does not prove that the application, configuration, runtime, infrastructure or source code is vulnerability-free.

## Evidence

- Workflow: [`.github/workflows/sbom-vulnerability-scan.yml`](../.github/workflows/sbom-vulnerability-scan.yml)
- Scan run: [GitHub Actions run `33236663936`](https://github.com/MyZubster-Ecosystem/myzubster/actions/runs/33236663936)
- Public vulnerability disposition: [`VULNERABILITY-REGISTER.md`](VULNERABILITY-REGISTER.md)

## Related records

- [`ASSET-DEPENDENCY-REGISTER.md`](ASSET-DEPENDENCY-REGISTER.md)
- [`CYBERSECURITY-BASELINE-THREAT-MODEL-INCIDENT-RESPONSE.md`](CYBERSECURITY-BASELINE-THREAT-MODEL-INCIDENT-RESPONSE.md)
- [`VULNERABILITY-REGISTER.md`](VULNERABILITY-REGISTER.md)
- [`ITALY-COMPLIANCE-REGISTER.md`](ITALY-COMPLIANCE-REGISTER.md)
