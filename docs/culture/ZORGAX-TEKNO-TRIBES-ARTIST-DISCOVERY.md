# Zorgax Tekno, Tribe & Independent Artist Discovery

## Mission

Zorgax should become a discovery and cultural-context layer for independent tekno/electronic artists, sound systems, tribes, crews and movements, including artists who publish music on SoundCloud and other public music platforms.

The objective is not to rank culture from above. It is to help independent scenes document themselves, discover one another, preserve provenance and connect artists to the crews, sound systems, events and cultural movements they actually choose to associate with.

## Cultural graph

```text
ARTIST <-> TRACK / SET
  |          |
  |          +-> PUBLIC MUSIC PROFILE / SOURCE
  |
  +-> CREW <-> SOUND SYSTEM
  |             |
  |             +-> EVENT
  |
  +-> TRIBE / SCENE / MOVEMENT
  |
  +-> LABEL / COLLECTIVE
  |
  +-> CULTURAL CONTRIBUTIONS
```

Relationships are evidence-bearing edges, not assumptions.

## Artist profile

A Zorgax cultural artist profile may contain:

- artist/stage name;
- authenticated MyZubster account when claimed;
- public artist links, including SoundCloud when supplied or sourced from public pages;
- genres/styles and self-described cultural tags;
- public tracks/sets as links or permitted embeds/metadata;
- crew/sound-system/label relationships;
- events and collaborations;
- geography only at a public, non-sensitive level chosen by the artist/organizer;
- sources and timestamps;
- evidence state for every important relationship;
- artist-controlled corrections and disputes.

Do not copy/rehost copyrighted audio unless rights explicitly permit it. Prefer links, platform-supported embeds and metadata.

## Relationship states

Zorgax must distinguish:

- `SELF_ATTESTED` — artist/account states the relationship;
- `OTHER_PARTY_ATTESTED` — another participant states it;
- `MUTUALLY_CONFIRMED` — both relevant authenticated parties confirm it;
- `SOURCE_SUPPORTED` — reliable public material supports it;
- `COLLECTIVE_CONFIRMED` — an authorized collective account confirms it;
- `UNVERIFIED` — discovered but not validated;
- `DISPUTED` — conflicting evidence exists;
- `REVOKED` — a previously asserted relationship has been withdrawn where applicable.

A social follow, playlist inclusion, event appearance or similar weak signal must not automatically become crew membership or movement affiliation.

## SoundCloud/public-platform discovery

Zorgax can discover public artist pages and public music links using compliant public search/integration mechanisms. Discovery creates candidates, not facts.

Pipeline:

```text
PUBLIC DISCOVERY
   ↓
CANDIDATE ARTIST / TRACK / SET
   ↓
SOURCE + TIMESTAMP RECORDED
   ↓
ENTITY MATCHING
   ↓
UNVERIFIED CANDIDATE
   ↓
ARTIST / CREW CLAIM OR SOURCE REVIEW
   ↓
EVIDENCE STATE UPGRADE
```

Zorgax must respect platform terms, rate limits, copyright, privacy and API restrictions. It must not scrape private profiles, bypass access controls or manufacture biographies from music style alone.

## Tekno and subculture taxonomy

Taxonomy must remain extensible and community-correctable. Profiles may use broad descriptors such as tekno, hardtek, tribe, acid, hardcore, breakcore, jungle, dub, experimental electronic and other scene-defined terms, but Zorgax should not force an artist into a movement based only on audio characteristics.

An artist can say `I make tekno`; that is different evidence from `I am part of Crew X` or `I represent Movement Y`.

## Independent artist discovery

Zorgax should prioritize useful discovery rather than popularity alone. Possible filters include:

- style/tags;
- self-declared crew or sound-system relationship;
- confirmed event participation;
- label/collective;
- public region when intentionally shared;
- recent public releases/sets;
- cultural graph proximity;
- evidence confidence.

Follower counts should never be treated as cultural authority.

## Crew / tribe pages

An authenticated crew can maintain a page containing:

- description/history supplied by the crew;
- confirmed members/participants where individuals consent;
- associated artists and sound systems;
- event history;
- flyers/media with provenance and rights;
- public music playlists/links;
- related crews/scenes/movements;
- archive/testimony contributions;
- collective-confirmation authority rules.

Individual testimony must remain distinguishable from official collective statements.

## Zorgax conversational discovery

Examples of supported questions:

- Find independent tekno artists who have publicly associated themselves with this crew.
- Show artists confirmed for this event.
- Which sound systems have documented relationships with these artists?
- Show public SoundCloud links supplied for this artist.
- What evidence connects this artist to this movement?
- Find artists in the cultural graph with similar self-described styles, without claiming they belong to the same movement.
- Which relationships are still unverified?

Answers should expose provenance/evidence when affiliation matters.

## Event integration

Artist and crew profiles connect directly to the Zorgax Event Operating System:

```text
DISCOVER ARTIST
   ↓
PROPOSE FOR EVENT
   ↓
ARTIST / BOOKING CONFIRMATION
   ↓
TIMETABLE
   ↓
FLYER
   ↓
TELEGRAM / INFO POINT
   ↓
EVENT
   ↓
AUTHORIZED CULTURAL ARCHIVE
```

Discovery never equals booking confirmation.

## Artist claim flow

An independent artist discovered from a public source should be able to claim their MyZubster profile through authentication and an explicit claim workflow. Claiming an account proves control of the MyZubster identity used for the claim; additional platform verification may be needed before representing control of an external SoundCloud profile.

Artists should be able to correct metadata, reject false affiliations, request removal of optional profile material and manage public cultural relationships subject to preservation of legitimate audit/provenance records.

## Zorgax boundaries

Zorgax must not:

- infer a person's identity from photographs;
- infer crew/tribe membership from appearance, location or musical similarity;
- call someone a representative of a movement without evidence of authority;
- turn private social relationships into public graph edges;
- rehost music without rights;
- fabricate artist biographies;
- treat public-platform discovery as endorsement or partnership;
- expose private event locations through artist discovery.

## Product sequence

1. Artist/crew/sound-system cultural graph schemas.
2. Public source/link records with provenance.
3. Artist claim and correction workflow.
4. Relationship attestation/confirmation using the existing cultural relationship model.
5. SoundCloud/public music link ingestion through compliant integrations.
6. Zorgax search and conversational discovery grounded in graph evidence.
7. Event-system integration for proposals, confirmations, timetable and flyers.
8. Artist/crew spaces in the MyZubster Metaverse.

The end state is an open cultural discovery network where independent artists can be found without being stripped of context: the music stays connected to the people, crews, sound systems, events and histories that created the scene.