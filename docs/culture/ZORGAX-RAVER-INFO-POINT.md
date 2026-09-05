# Zorgax Raver Info Point

## Purpose

Zorgax can become the MyZubster information and coordination layer for rave, sound-system and DIY cultural communities. The goal is to help organizers publish reliable event information, coordinate crews and preserve cultural material without turning MyZubster into an authority over independent scenes.

This document is a product/architecture contract. Features described here are not automatically production-ready until their runtime/UI implementation is merged and deployed.

## Core model

```text
ORGANIZER / CREW
       ↓
AUTHENTICATED MYZUBSTER ACCOUNT
       ↓
EVENT / PARTY WORKSPACE
       ↓
ZORGAX INFO POINT
       ↓
FLYER + UPDATES + LOCATION POLICY + CREW TASKS
       ↓
ATTENDEES / CONTRIBUTORS
       ↓
CULTURAL ARCHIVE + METAVERSE
```

## Event workspace

An authenticated organizer should be able to create an event workspace containing:

- event title, description and cultural tags;
- organizer/crew attribution and relationship status;
- date and time window;
- public meeting point or public venue when appropriate;
- precise location visibility policy;
- flyer and authorized media;
- timetable / running order;
- sound systems, artists and participating crews;
- transport and accessibility information;
- organizer-defined safety, welfare and site information;
- status: draft, announced, active, changed, postponed, cancelled, completed;
- timestamped organizer updates.

## Location privacy and controlled release

Exact coordinates must never be inferred, scraped, exposed from private data, or published by Zorgax without organizer authorization.

An organizer chooses a location mode:

- `PUBLIC_VENUE`: public address may be shown;
- `PUBLIC_MEETING_POINT`: only a public meeting point is shown;
- `APPROXIMATE_AREA`: broad area only;
- `AUTHORIZED_RELEASE`: exact location is released only to the audience and at the time explicitly configured by an authorized organizer;
- `PRIVATE`: no location is exposed through the public Info Point.

Location changes require organizer authorization and should produce a timestamped update. Zorgax must clearly distinguish confirmed organizer information from attendee reports or unverified rumors.

The system must not be designed to conceal illegal activity or evade authorities. Organizers remain responsible for permissions, venue rules and applicable law.

## Automated Info Point

For every event, Zorgax should provide a single conversational information point. It can answer questions using organizer-confirmed event data, for example:

- Is the event still happening?
- What is the public meeting point?
- Has the location information changed?
- What time does it start?
- Which crews/sound systems/artists are confirmed?
- Is there an updated flyer?
- What transport/accessibility information has the organizer provided?
- Has the event been postponed or cancelled?

Every answer should expose the information status and last organizer update when relevant. Zorgax must not invent missing details.

## Organizer coordination

The event workspace should support explicit roles such as:

- event owner;
- organizer;
- crew coordinator;
- artist/sound-system coordinator;
- flyer/media contributor;
- logistics contributor;
- welfare/safety contact;
- cultural archivist.

Permissions should be scoped. A flyer contributor does not automatically gain permission to change a location, and an attendee does not become an organizer by contributing content.

Organizers can create tasks, assign them to authenticated contributors, mark dependencies and publish selected updates to the public Info Point.

## Flyer workflow

Zorgax can help create and maintain event flyers from organizer-confirmed information:

```text
EVENT DATA
   ↓
ORGANIZER CONFIRMATION
   ↓
ZORGAX FLYER DRAFT
   ↓
HUMAN REVIEW
   ↓
PUBLISHED VERSION
```

Each flyer version should retain event ID, creator/contributor, source assets and rights declarations, creation/update timestamp and publication status. When event information changes, Zorgax can flag the flyer as potentially outdated and prepare a revised draft, but publication remains controlled by an authorized organizer.

## Live updates

Zorgax can turn authorized organizer changes into structured updates for MyZubster and connected community channels. Examples include timetable changes, public meeting-point changes, lineup updates, postponement/cancellation and a new flyer version.

Updates should be idempotent and auditable so multiple channels do not create conflicting versions of the event truth.

## Contributions from ravers

Authenticated participants can contribute photos, documents, flyers, memories and event-history material under the existing MyZubster cultural provenance model. Attendee contributions are not automatically organizer-confirmed facts.

After an event, authorized material can feed the MyZubster Cultural Graph and corresponding Metaverse space while preserving provenance, consent and rights metadata.

## Evidence and trust

Zorgax should distinguish at minimum:

- `ORGANIZER_CONFIRMED` — confirmed by an account with event authority;
- `CONTRIBUTOR_ATTESTED` — supplied by an authenticated contributor;
- `SOURCE_SUPPORTED` — supported by a recorded external/source artifact;
- `UNVERIFIED` — not yet validated;
- `DISPUTED` — conflicting evidence exists.

Authentication proves account control, not historical truth or collective authority.

## Safety and privacy boundary

Zorgax must not:

- infer or reveal private attendee locations;
- continuously track ravers by default;
- identify people from event photographs;
- publish private contact information;
- infer crew membership from social login;
- fabricate lineup, location, permissions or safety claims;
- treat cultural contributors as collective representatives without authorization;
- provide operational guidance intended to evade law enforcement.

Location sharing should be opt-in, purpose-limited and controlled by the person or organizer authorized to share it.

## Metaverse connection

Completed events can become cultural nodes in the MyZubster Metaverse:

```text
LIVE EVENT
  ↓
FLYERS + MEDIA + TESTIMONY + CREW RELATIONSHIPS
  ↓
PROVENANCE / CONSENT / EVIDENCE
  ↓
ZORGAX CULTURAL GRAPH
  ↓
METAVERSE EVENT SPACE
```

This creates continuity between real-world gatherings and their authorized digital cultural memory.

## MVP implementation sequence

1. Event + organizer/role data model.
2. Authenticated organizer event CRUD and permissions.
3. Location visibility/release policy with audit log.
4. Zorgax event-info retrieval endpoint grounded only in authorized event data.
5. Flyer metadata/version workflow and human approval.
6. Organizer tasks and structured live updates.
7. Participant cultural contributions using the existing provenance framework.
8. Cultural Graph and Metaverse event-node projection.

The product objective is simple: one trusted, organizer-controlled Info Point for each event, with Zorgax automating repetitive coordination while the crews retain authority over their own information and culture.