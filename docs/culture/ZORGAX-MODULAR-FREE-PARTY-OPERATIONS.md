# Zorgax Modular Free-Party Operations

## Scope

This guide defines a modular MyZubster/Zorgax workflow for lawful, organizer-controlled DIY music events and free-party culture. It covers sound systems, artists, flyers, Telegram notifications, bar/hospitality, circular economy, welfare, logistics, cultural archiving and GitHub-based change control.

It is not a guide for trespass, bypassing permits, concealing unlawful activity, evading authorities, unsafe alcohol service, or secretly tracking attendees. Organizers remain responsible for land/venue permission, permits, licensing, noise/environmental requirements, food/alcohol rules, accessibility, emergency planning and local law.

## Operating principle

```text
HUMAN ORGANIZERS
      ↓ approve
MYZUBSTER EVENT WORKSPACE
      ↓ structured event state
ZORGAX
      ├── SOUND SYSTEM
      ├── ARTISTS
      ├── FLYER / MEDIA
      ├── LOCATION / ACCESS
      ├── TELEGRAM NOTIFICATIONS
      ├── BAR / HOSPITALITY
      ├── WELFARE / SAFETY
      ├── CIRCULAR ECONOMY
      └── CULTURAL ARCHIVE / METAVERSE
              ↓
        GITHUB AUDIT / MODULES
```

Zorgax automates coordination; humans retain authority.

## 1. Event Core module

Create one canonical event record before other modules activate.

Required fields:
- event ID and title;
- organizer account and authorized crew roles;
- date/time window;
- venue/land permission status where applicable;
- location visibility policy;
- event status;
- public description and cultural tags;
- emergency/welfare contact roles;
- modules enabled for this event.

Lifecycle:

`DRAFT -> ORGANIZER_REVIEW -> ANNOUNCED -> ACTIVE -> COMPLETED`

Alternative states: `POSTPONED`, `CANCELLED`.

Only authorized organizers change canonical event state.

## 2. Sound-System module

Purpose: coordinate audio infrastructure without mixing it with artist booking or public communications.

Process:
1. Organizer adds participating sound-system profile.
2. Sound-system coordinator confirms participation.
3. Record technical requirements: system configuration, power demand, setup/strike windows and responsible technical contacts.
4. Venue/site team validates safe placement, power arrangements, access and applicable sound/noise constraints.
5. Coordinator marks readiness states: `PROPOSED`, `CONFIRMED`, `SETUP`, `READY`, `ISSUE`, `CLOSED`.
6. Zorgax surfaces missing confirmations and schedule conflicts.
7. Only public-safe information reaches attendees.

Zorgax never invents technical readiness or permission status.

## 3. Artists and timetable module

Process:
1. Artist/performer is proposed.
2. Booking/participation is confirmed by authorized role.
3. Organizer records stage/area and time slot.
4. Zorgax detects timetable collisions and missing confirmations.
5. Human organizer approves running order.
6. Approved public timetable feeds Info Point, flyer and Telegram.
7. Changes create a new timestamped version rather than silently overwriting history.

Artist profile data and media require appropriate rights/consent.

## 4. Flyer and media module

The event record is the source of truth; the flyer is a presentation of that data.

Process:
1. Zorgax reads only organizer-approved event fields.
2. It prepares copy/layout instructions or a flyer draft.
3. Media contributor adds authorized logos/images/artwork.
4. Rights/provenance are recorded for source assets.
5. Organizer reviews names, date, public location information and lineup.
6. Approved flyer receives version and timestamp.
7. Telegram/social distribution references that approved version.
8. If canonical data changes, Zorgax marks older flyer versions `OUTDATED` and prepares a replacement for approval.

No autonomous publication of an unapproved flyer.

## 5. Telegram Bot module

Telegram acts as a notification/output channel, not the canonical database.

### Channels

Recommended separation:
- organizer/private operations channel;
- crew/module-specific channels when useful;
- public announcement channel.

### Organizer bot events

The bot can notify authorized organizers about:
- missing module owner;
- unconfirmed sound system;
- timetable collision;
- outdated flyer;
- location/public-access information awaiting approval;
- welfare/logistics checklist incomplete;
- bar/hospitality status incomplete;
- waste/circular-economy plan incomplete;
- event change awaiting publication;
- cancellation/postponement workflow.

### Public bot events

Public notifications must originate from organizer-confirmed state, such as:
- event announced;
- approved timetable/flyer published;
- public meeting point/access information changed;
- schedule changed;
- event postponed/cancelled;
- organizer-approved practical information.

### Automation rule

```text
MODULE CHANGE
   ↓
VALIDATE PERMISSIONS + EVENT STATE
   ↓
ZORGAX GENERATES PROPOSED MESSAGE
   ↓
AUTO-SEND ONLY IF EVENT POLICY EXPLICITLY ALLOWS THAT MESSAGE CLASS
   ↓ otherwise
ORGANIZER APPROVAL
   ↓
TELEGRAM
   ↓
DELIVERY/AUDIT RECORD
```

Sensitive location data never goes to a public bot unless the authorized organizer explicitly configured that release. Bots must not expose private attendee locations or contact lists.

## 6. Location and access module

Use the location modes defined by the Zorgax Raver Info Point: public venue, public meeting point, approximate area, authorized release or private.

Process:
1. Organizer selects mode.
2. Access/transport/accessibility information is reviewed.
3. Zorgax stores public and restricted fields separately.
4. Release policy determines which information can reach Info Point/Telegram/flyer.
5. A change creates an audit event and invalidates stale public materials where needed.

No inferred, scraped or covert location release.

## 7. Welfare, safety and site module

Every event should have accountable human roles for welfare and site safety appropriate to its scale and applicable rules.

Zorgax can coordinate checklists for:
- emergency contacts and escalation path;
- safe access/egress information;
- accessibility information;
- first-aid/welfare arrangements;
- drinking-water availability;
- sanitation;
- weather/site hazards;
- electrical/fire-related checks by competent people where required;
- lost-property/contact process;
- incident logging with restricted access.

Zorgax can flag incomplete items but cannot certify that a site is safe.

## 8. Bar / hospitality module

The module supports legal hospitality operations, not unlicensed alcohol sales.

Process:
1. Organizer declares whether hospitality/bar service exists.
2. Responsible operator and required permissions/licensing are recorded where applicable.
3. Menu/inventory can be maintained as event data.
4. Water and non-alcoholic options are surfaced clearly.
5. Stock changes and shortages can alert the hospitality team.
6. Payment/reconciliation data is access-controlled.
7. Reusable container/deposit flows connect to the circular-economy module.
8. End-of-event inventory and waste are reconciled.

Age restrictions, food hygiene, alcohol licensing and tax/payment obligations remain the responsibility of the operator.

## 9. Circular Economy module

Every material flow can be treated as a resource flow rather than anonymous waste.

Suggested streams:
- reusable cups/containers;
- water infrastructure;
- packaging;
- recyclable material;
- organic waste where appropriate;
- batteries/electronics and technical consumables;
- reusable staging/decor materials;
- transport/load consolidation.

Process:
1. Before event: define streams, owners and collection points.
2. During event: teams record operational status/issues, not attendee surveillance.
3. Zorgax sends module alerts when a collection point/service requires attention.
4. After event: record quantities only when genuinely measured; otherwise label estimates.
5. Reusable assets return to inventory.
6. Authorized environmental records can feed MyZubster circular-economy reporting and future event planning.

Never present estimated environmental impact as measured fact.

## 10. Crew and task module

Each module has an owner and scoped permissions.

Example roles:
- Event Owner
- Sound Coordinator
- Artist Coordinator
- Site/Logistics Coordinator
- Welfare/Safety Contact
- Hospitality Operator
- Circular Economy Coordinator
- Flyer/Media Contributor
- Telegram Communications Operator
- Cultural Archivist

Zorgax converts incomplete dependencies into tasks. Example: an artist timetable change can create `review flyer`, `review Telegram announcement` and `confirm sound-stage timing` tasks. Tasks should be idempotent so the same change does not create unlimited duplicates.

## 11. GitHub module and modular architecture

GitHub is the versioned engineering/audit layer for reusable modules, schemas, docs and bot workflows; it should not contain secrets or private attendee data.

Recommended structure:

```text
modules/events/core/
modules/events/sound/
modules/events/artists/
modules/events/flyer/
modules/events/telegram/
modules/events/location/
modules/events/welfare/
modules/events/hospitality/
modules/events/circular-economy/
modules/events/culture/
docs/events/
```

Each module should define:
- schema;
- permissions;
- state machine;
- events emitted;
- events consumed;
- public/private field classification;
- validation;
- tests;
- audit behavior.

Changes follow `branch -> implementation/tests -> PR -> checks -> human review -> merge -> deploy`.

Telegram tokens, payment secrets, private coordinates and personal data must never be committed to GitHub. Use environment/secret management and least privilege.

## 12. Event bus contract

Modules should communicate through structured events instead of hard-coded cross-module dependencies.

Examples:

```text
EVENT_CREATED
SOUND_SYSTEM_CONFIRMED
ARTIST_CONFIRMED
TIMETABLE_CHANGED
FLYER_APPROVED
FLYER_OUTDATED
PUBLIC_ACCESS_CHANGED
WELFARE_CHECKLIST_UPDATED
HOSPITALITY_STATUS_CHANGED
CIRCULAR_STREAM_ALERT
EVENT_POSTPONED
EVENT_CANCELLED
EVENT_COMPLETED
```

Every event includes event ID, actor/account ID, actor role, timestamp, source module, visibility classification and payload version.

Zorgax subscribes to these events, decides which downstream modules are affected, and proposes/executes only actions permitted by policy.

## 13. End-to-end example

```text
Organizer creates event
 ↓
Permissions/venue requirements reviewed
 ↓
Sound system confirmed
 ↓
Artists confirmed + timetable approved
 ↓
Site/welfare/hospitality/circular modules reach required readiness
 ↓
Public access policy approved
 ↓
Zorgax prepares flyer
 ↓
Organizer approves flyer
 ↓
Telegram announces approved public information
 ↓
Event changes emit structured events
 ↓
Zorgax updates tasks + prepares authorized notifications
 ↓
Event completes
 ↓
Inventory/waste/cultural contributions reconciled
 ↓
Authorized photos/docs/testimony -> Cultural Graph
 ↓
Metaverse event node
```

## 14. Automation levels

Use three levels:

- `ADVISE`: Zorgax detects and recommends; human executes.
- `DRAFT`: Zorgax prepares a flyer/message/task/update; human approves.
- `AUTO`: only low-risk, explicitly pre-authorized actions execute automatically.

Never place sensitive location release, cancellation, legal/safety certification, financial payout or permissions claims into unrestricted autonomous mode.

## 15. Product objective

The aim is a reusable open event operating system where independent crews can enable only the modules they need. Zorgax becomes the coordination brain, MyZubster holds authenticated roles/event state/cultural provenance, Telegram delivers authorized alerts, GitHub versions the open modules, and the Metaverse preserves the authorized cultural memory after the real-world event.