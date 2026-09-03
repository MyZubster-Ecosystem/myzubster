# MyZubster — Bank Readiness Evidence Inventory

**Status:** documentation inventory — not a bank approval, legal opinion, compliance certification, partnership, or account-opening confirmation.

This document records a privacy-safe inventory of evidence currently available to the MyZubster creator. Original identity, banking, payroll, PEC and trust-service documents must remain private unless disclosure is specifically required to an authorised counterparty.

## Evidence classes

| Class | Evidence observed | Status | What it supports | What it does NOT prove |
|---|---|---|---|---|
| `IDENTITY` | Aruba trust-service / digital-signature request material exists for Daniel Ioni and contains applicant identification data. | `DOCUMENTED` | An identity-verification workflow was initiated for the digital-signature service. | It does not by itself prove that the digital-signature certificate has been issued and is currently valid. |
| `PEC` | Aruba PEC activation certificate states that `ionidaniel@pec.it` was activated on **14 August 2026** for Daniel Ioni. | `VERIFIED_DOCUMENT` | Existence and activation of the PEC mailbox on that date. | It does not prove that every later PEC identity-recognition step has been completed. |
| `PEC_SECURITY` | Aruba email confirms two-step verification was activated for the PEC mailbox. | `DOCUMENTED` | A security control was enabled for mailbox access. | It is not evidence of bank approval or MyZubster compliance. |
| `PEC_IDENTITY` | Aruba sent repeated messages asking the customer to complete the procedure to become a recognised PEC holder, including messages through **22 August 2026**. | `PENDING / NEEDS_RECHECK` | A separate PEC-holder identity-confirmation workflow exists. | Current evidence does not support claiming that this later recognition procedure is complete. |
| `DIGITAL_SIGNATURE_ORDER` | Aruba email confirms an order for a digital-signature service; subsequent email provides recognition instructions. | `DOCUMENTED` | A digital-signature service was ordered and activation/recognition was initiated. | An order is not proof of an active qualified signing certificate. |
| `DIGITAL_SIGNATURE_REQUEST` | Aruba request form ID `2227254` identifies the requested product as **FIRMA REMOTA** and contains the applicant workflow. | `DOCUMENTED` | The requested signing product and identification process. | The request form is not an issuance/validity certificate. |
| `ARUBA_INVOICE` | Aruba invoice email dated August 2026 exists for purchased Aruba services. | `DOCUMENTED` | Commercial purchase/billing evidence for Aruba services. | It does not prove banking compliance or a relationship between Aruba and MyZubster. |
| `PEC_PUBLIC_ADMIN_USE` | A certified-mail message from Comune di Rimini confirms protocol activity via PEC. | `DOCUMENTED` | Evidence that certified email has been used in an institutional communication flow. | It does not establish endorsement, partnership, funding or approval of MyZubster by Comune di Rimini. |
| `EMPLOYMENT` | A July 2026 payroll document retained privately identifies FUTURA SOC.COOP.SOCIALE as employer, Daniel Ioni as employee, role `operatore ecologico`, with employment start date 16 March 2026. | `VERIFIED_PRIVATE_DOCUMENT` | Employment relationship as stated in that payroll document. | It does not establish a MyZubster–Futura partnership or sponsorship. |
| `BANK_ACCOUNT` | The creator states that a personal bank account associated with employment income is connected to a branch/location in Rimini. Sensitive account details remain private. | `DECLARED / PRIVATE_EVIDENCE_REQUIRED` | A declared personal banking relationship. | It does not establish that the bank has approved, integrated, sponsored or partnered with MyZubster. |
| `BANK_INTERLOCUTORS_INFORMED` | Daniel reports that the bank director and a staff member identified to him as Claudia have been informed about the existence of MyZubster and the possibility of future project-related transaction activity. | `DECLARED_VERBAL_CONFIRMATION` | Records the creator's statement that these bank interlocutors are aware of the project context. | It is not written approval, partnership, endorsement, product onboarding, legal advice or authorisation for every future transaction. |
| `BANK_VERBAL_FEEDBACK` | Daniel reports that, during a bank conversation, staff stated that they did not identify a present problem and that the bank would contact him when material transaction activity begins. | `DECLARED_VERBAL_CONFIRMATION` | Records the creator's account of the bank's verbal position and expected future transaction review/contact. | It is not written bank approval, a compliance clearance, a commitment to accept all future crypto/fiat flows, or a partnership/endorsement of MyZubster. |
| `MYZUBSTER_BANK_RELATIONSHIP` | No explicit bank agreement, onboarding confirmation, merchant agreement, project account contract, sponsorship, API integration approval or bank endorsement has been verified in this inventory. | `NOT_VERIFIED` | Defines the current evidence boundary. | MyZubster must not claim to be “approved by”, “partnered with”, or formally integrated with a bank on the basis of the evidence above. |

## Current evidence-backed chain

```text
Daniel Ioni
  ↓
identity/trust-service documentation
  ↓
PEC activated (14 Aug 2026)
  ↓
PEC security enabled
  ↓
digital-signature service ordered + recognition/request workflow
  ↓
employment evidence retained privately
  ↓
personal banking relationship declared
  ↓
bank director + Claudia reported as informed about MyZubster
  ↓
verbal bank feedback reported by creator
  ↓
future transaction monitoring/contact if activity becomes material
```

The bank conversations are currently recorded as **verbal, creator-reported evidence**. They should be upgraded only if written confirmation or another independently verifiable bank record is obtained.

It does **not** yet support:

```text
personal bank account
  ≠ MyZubster project bank account
  ≠ bank onboarding of MyZubster
  ≠ bank partnership
  ≠ bank endorsement
  ≠ regulatory/compliance certification
  ≠ blanket approval for future crypto/fiat transactions
```

## Transaction-readiness record

Based on the creator's report of the bank conversation, the current working expectation is:

```text
bank interlocutors informed about project context
        ↓
no present objection reported
        ↓
real transactions begin
        ↓
bank may contact account holder
        ↓
source / nature of transactions may be reviewed
        ↓
additional documentation may be requested
```

For any future Monero/fiat or other crypto-related activity, retain evidence appropriate to the actual flow, including where applicable:

- transaction/exchange receipts;
- identity of the external service provider used;
- source-of-funds/source-of-income records;
- clear separation between personal funds and any MyZubster treasury/accounting activity;
- transaction purpose and accounting records;
- any written bank requests and responses.

Do not infer from the verbal conversation that the bank has pre-approved all future transaction types, volumes or counterparties.

## Bank-ready gate

Before describing MyZubster as formally documented with a bank, obtain and privately retain evidence appropriate to the actual relationship, for example:

1. confirmation that the digital-signature certificate is issued, active and valid;
2. confirmation of completion of any required PEC-holder identity-recognition process;
3. the exact legal identity under which the bank relationship is established (individual, sole trader, company, association, other entity);
4. bank onboarding/account documentation that explicitly identifies that legal subject;
5. where relevant, documented source-of-funds/source-of-income material supplied through the bank's authorised process;
6. if MyZubster itself is to receive or manage funds, a clearly separated accounting/treasury model appropriate to its legal structure;
7. any bank-specific KYC/AML, merchant, payment, API or service agreement actually required for the intended use;
8. written confirmation of any specific bank position that MyZubster intends to cite publicly.

The exact requirements are determined by the bank and applicable legal/regulatory framework. This repository does not certify compliance.

## Privacy boundary

Never commit or publish:

- identity-document numbers or scans;
- tax identifiers where unnecessary;
- home address or personal phone number;
- IBAN/account/card numbers;
- OTPs, passwords, PINs or recovery codes;
- private keys, signing secrets or seed phrases;
- complete payroll documents;
- unredacted bank statements;
- digital-signature credentials.

GitHub should contain only the minimum evidence metadata needed to explain provenance and status. Originals belong in private controlled storage or should be supplied directly through an authorised institutional channel.

## Evidence language

Use these phrases precisely:

- **`VERIFIED_DOCUMENT`** — the referenced source directly supports the limited statement.
- **`DOCUMENTED`** — supporting correspondence or workflow material exists, but a final state may not be proven.
- **`PENDING / NEEDS_RECHECK`** — evidence shows an unfinished or subsequently requested step.
- **`DECLARED`** — creator-provided statement not independently established by the evidence inventory.
- **`DECLARED_VERBAL_CONFIRMATION`** — creator-reported verbal statement from an external organisation; useful context, but not equivalent to written evidence.
- **`NOT_VERIFIED`** — do not make the corresponding public claim.

**Evidence-first principle:** possession of PEC, digital-signature services, employment records, a personal bank account or a verbal bank conversation does not automatically make MyZubster a legal entity, bank customer, regulated service, bank partner or bank-approved project.