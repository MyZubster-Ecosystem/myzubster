# MyZubster Cultural Relationship & Contribution Flow

## Purpose

MyZubster should let authenticated people contribute cultural memory without pretending that a social login proves friendship, membership, history, or authority.

The flow is designed for Zorgax-assisted profiles covering sound systems, tribes, scenes, events and other subcultures.

## Trust chain

1. **Authenticated account** — the contributor signs in through a supported MyZubster authentication provider.
2. **Relationship claim** — the contributor voluntarily states a relationship such as `KNOWS`, `WORKED_WITH`, `COLLABORATED_WITH`, `ATTENDED_WITH`, or `OTHER` with another MyZubster account/person record.
3. **Counterparty confirmation** — where possible, the referenced person explicitly accepts or rejects the relationship claim inside MyZubster.
4. **Cultural contribution** — the contributor can submit memories, documents, images, event information and cultural links.
5. **Zorgax assistance** — Zorgax structures metadata, proposes links, summarizes submitted material and identifies missing provenance.
6. **Evidence state** — each claim and contribution displays its evidence/provenance state rather than being presented as automatically verified fact.

## Relationship states

- `CLAIMED` — one authenticated user made the claim.
- `CONFIRMED` — the referenced MyZubster account explicitly confirmed it.
- `DECLINED` — the referenced account rejected it.
- `DISPUTED` — conflicting evidence or testimony exists.
- `REVOKED` — a previously confirmed relationship was withdrawn.

A social-provider friendship/follow relationship is not imported or inferred by default.

## Contribution types

An authenticated contributor may propose:

- photographs and artwork;
- documents, flyers and scans;
- personal testimony and memories;
- sound-system or collective history;
- events, venues and timelines;
- relationships between people, systems, tribes, scenes and projects;
- links to public primary or secondary sources.

## Required provenance

Every contribution should retain:

- contributor account ID;
- submission timestamp;
- contribution type;
- source/provenance description;
- rights/permission declaration for uploaded media;
- people/collectives explicitly claimed to be represented, if any;
- evidence state;
- revision history.

Images must not be used by Zorgax to identify real people. A contributor may provide names/captions as testimony, which remain attributed to that contributor until independently confirmed.

## Zorgax role

Zorgax may:

- create a draft cultural profile from contributor-provided material;
- ask for missing dates, places, sources and rights information;
- connect related sound systems, tribes, events and subcultures;
- detect contradictory claims and surface them for human review;
- suggest a timeline or cultural graph;
- distinguish testimony from independently supported facts;
- update a profile when new approved contributions arrive.

Zorgax must not:

- manufacture missing historical facts;
- infer friendship or membership from social login;
- infer identity from a photograph;
- treat one person's testimony as collective authorization;
- publish private material without the appropriate permission;
- silently convert a disputed claim into verified history.

## Daniel / creator relationship

The same mechanism can be used when a contributor says they know or collaborated with Daniel or another MyZubster participant. The relationship begins as `CLAIMED`. Daniel/the referenced account can explicitly confirm it, producing a `CONFIRMED` relationship record.

Confirmation means only that the relationship claim was accepted. It does not automatically verify every historical statement submitted by either person.

## Profile completion

Zorgax can progressively complete a subculture profile from multiple independent contributions. The UI should expose provenance at claim level, allowing readers to distinguish:

- contributor testimony;
- mutually confirmed relationships;
- source-supported history;
- collective-confirmed statements;
- disputed or unverified material.

This makes MyZubster a collaborative cultural archive while preserving uncertainty, consent and attribution.

## Implementation target

Backend/frontend implementation should introduce persistent `CulturalRelationship` and `CulturalContribution` records, authenticated create/read/update flows, counterparty confirmation/rejection, media provenance metadata, and Zorgax profile-building actions. These should build on the Cultural Contributor Attestation foundation rather than treating OAuth identity as historical proof.
