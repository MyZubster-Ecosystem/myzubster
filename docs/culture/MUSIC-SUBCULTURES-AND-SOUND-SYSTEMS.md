# Music, Sound Systems & Subcultures

MyZubster treats music cultures, sound systems, crews, organizers, artists, venues, events and wider subcultures as cultural knowledge that can be documented with consent, provenance and explicit evidence boundaries.

## What is implemented

The current MyZubster cultural layer combines three foundations merged into `main`:

- authenticated cultural-contributor self-attestation, binding an attestation to a MyZubster account while keeping it explicitly individual in capacity;
- the Zorgax subculture profile and attribution framework for sound systems, tribes, scenes and other subcultures;
- an authenticated relationship and contribution model in which participants can describe relationships and contribute photos, documents, testimony, event history and source links with provenance and rights declarations.

Authentication proves control of a MyZubster account. It does **not** by itself prove historical identity, membership of a movement, friendship, organizational authority or the truth of every historical claim.

## Zorgax cultural graph

Zorgax can help structure cultural material into connected profiles and relationships:

```text
CONTRIBUTOR / ORGANIZER / PARTICIPANT
              ↓
       AUTHENTICATED ACCOUNT
              ↓
     INDIVIDUAL ATTESTATION
              ↓
 PHOTOS / DOCUMENTS / TESTIMONY / EVENTS
              ↓
      RIGHTS + PROVENANCE
              ↓
        EVIDENCE STATE
              ↓
     ZORGAX CULTURAL GRAPH
              ↓
       HUMAN REVIEW
```

Evidence can remain `UNVERIFIED`, become `SELF_ATTESTED` or `SOURCE_SUPPORTED`, reach `COLLECTIVE_CONFIRMED` only with appropriate collective authorization, or be marked `DISPUTED` when evidence conflicts.

Relationships between authenticated participants are also evidence-aware. A person may claim that they know, worked with or collaborated with another participant; the referenced account may confirm, decline, dispute or later revoke that relationship. A confirmed relationship does not automatically validate every historical claim made by either participant.

Zorgax may organize, connect, summarize and identify missing evidence. It must not manufacture cultural history, infer membership from OAuth/social login, identify people from photographs, or convert individual testimony into authority to represent a collective.

## Music and sound-system culture

This framework is designed for histories that are often distributed across people rather than centralized archives: independent sound systems, free-party and DIY scenes, crews, organizers, technicians, artists, visual makers and temporary communities.

Contributors can preserve authorized cultural evidence such as photographs, flyers, documents, memories, event records, technical sound-system history and source links. Every contribution should retain its author/source, rights or permission basis, timestamp where available and evidence status.

The objective is not to declare one canonical history automatically. It is to preserve multiple attributable perspectives while making the strength and origin of each claim visible.

## Cultural dialogue connected to the Spiral Tribe scene

MyZubster has documented a consented cultural dialogue with an individual who describes personal experience in the DIY sound-system scene associated with **Spiral Tribe**, **Mutoid Waste** and **Bedlam**, including sound-system engineering experience and affinity with the scene's ethics.

This testimony is part of MyZubster's cultural provenance and helps explain the conceptual continuity the project explores between independent sound systems and independent digital systems: self-organization, open participation, resilience, experimentation and community infrastructure.

The evidence boundary is important: this is **individual testimony and cultural dialogue**, not proof of an official partnership, endorsement, membership, representation or authorization from Spiral Tribe, SP23, Mutoid Waste, Bedlam or any other collective. Private conversation screenshots are not published as project evidence.

The canonical provenance documents are:

- [`DIY-CULTURAL-DIALOGUE.md`](DIY-CULTURAL-DIALOGUE.md)
- [`CULTURAL-ORIGIN-CHRONICLE.md`](CULTURAL-ORIGIN-CHRONICLE.md)

## Organizers and cultural contributors

Organizers and participants can contribute without being treated automatically as representatives of an entire movement. MyZubster separates:

```text
ACCOUNT AUTHENTICATION
        ≠
HISTORICAL CLAIM VERIFICATION
        ≠
RELATIONSHIP CONFIRMATION
        ≠
COLLECTIVE AUTHORIZATION
```

This allows event organizers, sound engineers, artists, crew members and other cultural participants to add first-hand material while preserving consent and attribution boundaries.

The next product layer is to expose these merged contracts through contributor-facing UI: profile creation, relationship confirmation, media/document contribution, evidence status and Zorgax-assisted cultural graph navigation.