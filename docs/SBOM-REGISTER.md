# MyZubster SBOM Register

**Status:** PUBLIC / INITIAL / MANIFEST-DERIVED  
**Baseline date:** 29 August 2026

> This register is an initial software supply-chain inventory. It is not yet a complete transitive SBOM and it is not a vulnerability-free declaration.

## Method

The current baseline is derived from repository manifests directly verified in the MyZubster GitHub organization. CycloneDX 1.7 is used for the machine-readable initial BOM in [`../sbom/myzubster-initial.cdx.json`](../sbom/myzubster-initial.cdx.json).

CycloneDX is designed to represent software components, services, dependencies and their relationships. This baseline intentionally records direct manifest dependencies first; lockfile reconciliation, transitive dependency resolution and scanner-generated vulnerability data are separate gates.

## Verified manifest inventory

| Repository | Manifest | Version | Direct dependency observation | SBOM status |
|---|---|---:|---|---|
| `MyZubster-Ecosystem/myzubster` | `package.json` | `1.0.0` | Node.js gateway stack; Express, Mongoose, auth/security, mail, realtime and tooling dependencies | `DIRECT DEPENDENCIES CAPTURED` |
| `MyZubster-Ecosystem/MyZubsterGateway` | `package.json` | `1.0.0` | API gateway dependencies including Express, Helmet, Mongoose, CORS, Morgan | `DIRECT DEPENDENCIES CAPTURED` |
| `MyZubster-Ecosystem/MyZubster-Marketplace` | `package.json` | `1.0.0` | Marketplace/API, serial-port, Web3 SDK, ML/statistics, auth and networking dependencies | `DIRECT DEPENDENCIES CAPTURED` |
| `MyZubster-Ecosystem/MyZubster-App` | `package.json` | `1.0.0` | Expo/React Native mobile stack including camera, location, notifications and secure storage | `DIRECT DEPENDENCIES CAPTURED` |
| `MyZubster-Ecosystem/myzubster-animal-registry` | `package.json` | `0.1.0` | No external runtime dependencies declared in the verified manifest | `DIRECT DEPENDENCIES CAPTURED` |

## High-sensitivity dependency groups

| Group | Why it matters | Current gate |
|---|---|---|
| Authentication / tokens | Identity and authorization boundary | Confirm exact installed versions from lockfiles; scanner review before production trust |
| HTTP/API frameworks | Internet-facing attack surface | Lockfile + CVE/advisory scan |
| Database / ODM | Data integrity and access control | Version reconciliation + configuration review |
| Web3 / payment dependencies | Potential financial/settlement exposure | Separate regulated-feature and security review |
| Serial/IoT libraries | Device/physical boundary | Hardware trust + input validation + authorization review |
| ML libraries | Model/data provenance and supply-chain risk | AI inventory link + version/provenance review |
| Mobile location/camera/storage | Privacy-sensitive device permissions | GDPR data-flow + mobile permission/security review |

## Coverage gaps

The wider ecosystem contains additional public and private repositories. A repository appearing in the Asset & Dependency Register is **not** automatically considered fully represented in the SBOM. Each repository must be reconciled against its actual manifest/lockfiles (`package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, `requirements*.txt`, `poetry.lock`, `pyproject.toml`, `Cargo.lock`, `go.sum`, Maven/Gradle manifests or equivalent).

## Required pipeline

```text
REPOSITORY
  ↓
MANIFEST IDENTIFICATION
  ↓
LOCKFILE / EXACT VERSION RECONCILIATION
  ↓
CYCLONEDX GENERATION
  ↓
LICENSE + PROVENANCE CHECK
  ↓
VULNERABILITY SCAN
  ↓
TRIAGE / VEX OR REMEDIATION
  ↓
RELEASE GATE
```

## Release gate

A component is not marked supply-chain `READY FOR PRODUCTION` merely because it appears in this register.

**NO EXACT VERSION → NO FINAL SBOM CLAIM.**  
**NO VULNERABILITY REVIEW → NO SECURITY-CLEAN CLAIM.**  
**CRITICAL UNRESOLVED FINDING → NO HIGH-IMPACT PRODUCTION RELEASE.**

## Related records

- [`ASSET-DEPENDENCY-REGISTER.md`](ASSET-DEPENDENCY-REGISTER.md)
- [`CYBERSECURITY-BASELINE-THREAT-MODEL-INCIDENT-RESPONSE.md`](CYBERSECURITY-BASELINE-THREAT-MODEL-INCIDENT-RESPONSE.md)
- [`VULNERABILITY-REGISTER.md`](VULNERABILITY-REGISTER.md)
- [`ITALY-COMPLIANCE-REGISTER.md`](ITALY-COMPLIANCE-REGISTER.md)
