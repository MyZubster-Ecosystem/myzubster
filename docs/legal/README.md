# MyZubster — Legal & Compliance README

> **Documentation status:** evidence-first project guidance. This file is **not legal, tax, banking or investment advice**, is not a compliance certification, and does not state that MyZubster is authorised by a regulator or approved by a bank.

## Purpose

MyZubster is an open-source technology ecosystem created by Daniel Ioni. This README defines the legal/compliance boundaries that contributors, users and maintainers should understand while the project evolves.

The central rule is simple:

**technical capability ≠ legal authorisation ≠ institutional approval.**

A feature being implemented in software does not by itself mean that it may be operated as a regulated service for third parties.

## 1. Project identity

MyZubster should not be described as a company, regulated financial institution, bank, payment institution, crypto-asset service provider, charity, public authority or formally recognised religious institution unless and until the corresponding legal status is independently established and documented.

The creator's personal identity, employment, personal banking and other private affairs remain legally and operationally distinct from MyZubster unless a specific documented relationship says otherwise.

## 2. Banking boundary

The creator reports a personal banking relationship and, following a conversation with the bank, reports that no preventive objection was raised to the activity described and that the bank may contact him when material transactions begin.

**Evidence classification: `DECLARED_VERBAL_CONFIRMATION`.**

This is useful contextual information, but it is **not**:

- written bank approval of MyZubster;
- a partnership, sponsorship or endorsement;
- a MyZubster business/project account agreement;
- approval of every future transaction;
- a regulatory or AML/KYC compliance certification.

The bank may request information concerning transaction purpose, source of funds or other documentation when real transactions occur.

Personal funds and any future MyZubster treasury/accounting must remain clearly distinguishable.

See: [`../compliance/BANK_READINESS_EVIDENCE.md`](../compliance/BANK_READINESS_EVIDENCE.md).

## 3. Monero and crypto/fiat boundary

MyZubster may contain or document software concepts involving Monero (XMR), wallets, multisig, escrow, payments and integrations.

Development or publication of open-source code does not establish permission to provide regulated crypto-asset or financial services to customers.

Before enabling production functionality involving third-party assets, fiat conversion, custody, exchange, transfer, execution, brokerage, payment processing or similar activity, the responsible operator must determine the applicable legal/regulatory requirements and obtain any authorisation that is actually required.

Where external regulated providers are used, their role should be stated explicitly rather than presenting MyZubster itself as the regulated provider.

**Never route third-party/customer funds through a creator's personal bank account merely because the software technically permits it.**

## 4. Custody and keys

Users must never be asked to publish or commit:

- wallet seed phrases;
- private keys;
- signing secrets;
- exchange passwords;
- bank credentials;
- OTP/recovery codes.

Architecture should prefer explicit custody boundaries. Documentation must say who controls keys and funds at each step rather than using ambiguous terms such as “MyZubster holds the money” unless that statement is legally and technically accurate.

## 5. DAO and governance

A software DAO, voting mechanism or governance token does not automatically create a recognised legal entity, company, association or contractual structure.

DAO documentation must distinguish:

- technical voting/governance;
- ownership/control of assets;
- legal responsibility;
- contractual authority;
- treasury authority.

No DAO participant should be described as a legal partner, shareholder, director or authorised representative solely because they interact with governance software.

## 6. Marketplace and escrow

Marketplace, escrow and arbitration components must distinguish prototypes/test environments from production services.

Before handling real third-party money or crypto-assets, evaluate at minimum:

- identity/KYC/AML obligations where applicable;
- custody and control of assets;
- consumer/business disclosures;
- contractual terms;
- dispute handling;
- accounting and tax treatment;
- data-protection obligations;
- sanctions and other applicable restrictions;
- licences/authorisations required for the exact service model.

No README or smart-contract label can substitute for the legal analysis of the actual production service.

## 7. Privacy and personal data

GitHub is not the repository for private compliance originals.

Do not publish unnecessary:

- identity documents;
- payroll documents;
- bank statements;
- IBAN/account/card numbers;
- home addresses;
- personal tax identifiers;
- signatures or signing credentials;
- private correspondence containing personal data.

Public evidence should use minimal metadata, redaction where appropriate, provenance and a clear claim boundary. Originals should remain in controlled private storage or be supplied directly to an authorised counterparty when legitimately required.

## 8. PEC and digital signature

Available project evidence documents activation of a PEC mailbox and workflows concerning Aruba digital-signature services. Evidence reviewed previously did not yet justify treating every PEC identity-recognition step or the current validity/issuance state of the requested remote-signature certificate as conclusively complete.

Therefore documentation must distinguish:

`ordered/requested → identity/activation workflow → issued/active/valid`

and only claim the stage actually evidenced.

PEC or a digital signature does not itself turn MyZubster into a legal entity or regulated operator.

## 9. Employment and external organisations

Private evidence previously reviewed supports a limited employment claim involving the creator and FUTURA SOC.COOP.SOCIALE.

That employment must **not** be presented as evidence that FUTURA SOC.COOP.SOCIALE:

- owns MyZubster;
- sponsors or funds MyZubster;
- has adopted MyZubster;
- participates in a MyZubster consortium;
- endorses the project;
- is responsible for MyZubster activities.

Any such relationship requires separate explicit evidence.

The same evidence-first rule applies to banks, Comune di Rimini, Aruba, EU institutions, LIFE programme actors and every other external organisation.

## 10. AI and Zorgax

Zorgax/AI components are tools supporting research, documentation, automation and decision support. AI output does not replace:

- human responsibility;
- professional legal/accounting advice where required;
- institutional decisions;
- regulatory authorisation;
- factual verification.

Material claims should be tied to sources/evidence and labelled when they are proposals, hypotheses or simulations.

## 11. TV, metaverse, IoT and garden monitoring

TV applications, avatars/metaverse experiences, IoT devices, garden monitoring and camera/streaming features introduce additional privacy and security boundaries.

Production deployments should address consent, access control, device ownership, camera placement, retention, account security and any personal data visible in streams. Documentation visuals and demonstrations are not evidence that a real device or deployment exists unless separately verified.

## 12. Evidence taxonomy

Use explicit evidence states. Recommended examples:

- `DECLARED` — statement supplied by the creator/user;
- `DECLARED_VERBAL_CONFIRMATION` — report of a verbal conversation without written institutional confirmation;
- `DOCUMENTED` — correspondence/workflow evidence exists;
- `VERIFIED_DOCUMENT` — a document directly supports the limited claim;
- `VERIFIED_PRIVATE_DOCUMENT` — supporting original was privately reviewed but is intentionally not public;
- `PENDING / NEEDS_RECHECK` — completion is not established;
- `NOT_VERIFIED` — do not make the corresponding public claim.

For external adoption use the project's separate evidence scale where relevant: `DISCOVERY`, `INTEREST`, `FORK`, `CONTRIBUTION`, `INTEGRATION`, `DEPLOYMENT`, `VERIFIED_ADOPTION`.

## 13. Claims MyZubster must not make without evidence

Do not state or imply without explicit support that:

- a bank has approved or partnered with MyZubster;
- a regulator has authorised MyZubster;
- MyZubster is a licensed crypto/financial service;
- an employer or public body endorses the project;
- a LIFE/EU application, consortium, budget or award exists when it has not been documented;
- an external organisation is a partner because an email, meeting or conversation occurred;
- a prototype is a production deployment;
- a crypto transaction proves commercial adoption;
- a personal account is a MyZubster treasury account.

## 14. Production legal gate

Before a feature crosses from prototype/documentation into handling real users, money, crypto-assets, contractual commitments or sensitive personal data, create a feature-specific review recording:

1. operator/legal subject;
2. jurisdictions involved;
3. exact user-facing service;
4. custody/control model;
5. money/asset flow;
6. personal-data flow;
7. external regulated providers;
8. contracts/terms required;
9. licences/authorisations assessment;
10. tax/accounting assessment;
11. security controls;
12. evidence supporting every institutional claim.

If one of these is unknown, record it as unknown rather than inventing an answer.

## 15. Current safe public statement

A conservative evidence-backed description is:

> **MyZubster is an evolving open-source technology ecosystem created by Daniel Ioni. It explores privacy-first software, Monero-related infrastructure, AI/automation, TV/metaverse experiences, IoT and governance concepts. Its documentation distinguishes prototypes and personal evidence from regulated services, institutional relationships and verified external adoption. Any production financial or crypto service must satisfy the legal and regulatory requirements applicable to its actual operator, jurisdiction and service model.**

## Maintenance

This README should evolve when **new evidence or an actual legal/operational change** occurs—not merely when a capability is proposed.

When law, regulation, bank requirements or service structure materially changes, obtain appropriate professional/institutional confirmation before upgrading a claim from `DECLARED`/`DOCUMENTED` to a stronger status.