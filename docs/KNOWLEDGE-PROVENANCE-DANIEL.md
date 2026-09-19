# Knowledge provenance profile — Daniel Ioni

This document defines how MyZubster/Zorgax may represent practical knowledge attributed to Daniel Ioni without turning activity evidence into an academic or professional certification.

## Evidence levels

| Level | Meaning |
| --- | --- |
| self-declared | A contributor states experience or knowledge. No independent verification is implied. |
| externally-evidenced | Public third-party evidence supports the activity, such as GitHub commits, pull requests, issues, forks or community records. |
| cryptographically-proven | Control of a blockchain address is demonstrated with a safe signed-message challenge or another independently verifiable proof. Transaction history alone does not prove identity or competence. |
| project-demonstrated | Knowledge is demonstrated through a reproducible MyZubster pilot, implementation, test or documented output. |

## Daniel Ioni knowledge domains

Candidate domains include Bitcoin, Monero/XMR, cryptocurrency and blockchain concepts, Git/GitHub and open-source collaboration, MyZubster/MYZ token-economy experimentation, blockchain evidence/anchoring, marketplace crypto flows and metaverse/community integrations.

Each claim MUST carry its own evidence references and evidence level. MyZubster MUST NOT infer expertise, qualifications, ownership of a historical wallet, or membership/authority in an external community merely from a transaction, repository link or self-attestation.

## Historical Bitcoin / Darkode evidence

A historical Bitcoin address or transaction may be attached as provenance evidence only.

- Public chain history can establish that transactions occurred.
- It does not establish that Daniel controlled the address.
- Ownership may be upgraded to `cryptographically-proven` only after a safe proof-of-control flow.
- Never request, store or expose a seed phrase or private key.
- If proof of control is unavailable, retain the relationship as `self-declared` or `externally-evidenced`, according to the available independent evidence.
- Historical context labels such as “Darkode” must be treated as provenance/context claims, not as proof of identity, affiliation or wrongdoing.

## GitHub and community evidence

Zorgax may ingest public URLs for commits, pull requests, issues, reviews, forks and repository artifacts. Evidence should preserve:

- source URL and repository;
- author/account shown by the source;
- timestamp where available;
- activity type;
- a short factual description;
- verification status and last verification time.

External community assistance must not be described as an official role, endorsement or membership unless the source establishes that relationship.

## Knowledge transfer: Daniel → Nicola

MyZubster can represent mentorship as a separate evidence chain:

```text
Daniel knowledge claim
        ↓
source evidence / demonstrated project
        ↓
knowledge-transfer session or artifact
        ↓
Nicola receives / studies / applies it
        ↓
Nicola produces his own evidence
        ↓
feedback / review / replication
```

The recipient does not automatically inherit Daniel's verification level. Nicola's profile gains evidence only from what Nicola documents, demonstrates or independently verifies.

This extends the existing KF-006 / Nicola mentorship path and the MyZubster principle:

`learn → try → document → share → Zorgax assists → another person tries → evidence + feedback → improve`

## Suggested machine-readable record

```json
{
  "subject": "Daniel Ioni",
  "domain": "bitcoin",
  "claim": "historical practical experience",
  "evidenceLevel": "self-declared",
  "evidence": [
    {
      "type": "blockchain_address",
      "network": "bitcoin",
      "reference": "<public address or txid>",
      "ownershipProof": "unverified"
    }
  ],
  "transfers": [
    {
      "recipient": "Nicola",
      "status": "documented",
      "artifacts": []
    }
  ]
}
```

Only public identifiers needed for verification should be stored. Secrets, private keys, seed phrases and unnecessary personal data are forbidden.
