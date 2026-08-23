# MyZubster — End-to-End Setup Guide

> **Goal:** connect one authenticated user to their garden, private TV stream, MyZubster character and Zorgax context without confusing documentation with verified production capability.

## 1. What “everything works” means

The target journey is:

```text
User account
  ↓
authenticated session
  ↓
owned garden ──→ authorised camera/stream ──→ MyZubster TV
  │                                      └──→ Live garden view
  ↓
owned character ──→ Character Registry ──→ TV / MyZubster world
  ↓
Zorgax context and evidence-aware workflows
```

A feature is not considered production-ready merely because its UI, documentation or branch exists.

## 2. Maturity states

Use these states consistently:

- `DOCUMENTED` — behaviour is described, but may not exist in code.
- `IMPLEMENTED` — code exists on a branch/PR.
- `CI_VERIFIED` — automated checks have executed successfully on the relevant commit.
- `DEVICE_VERIFIED` — the complete TV path has been tested on real Google TV/Android TV hardware.
- `DEPLOYED` — the verified build is running in its intended environment.
- `PRODUCTION_READY` — security, ownership, error handling and operational gates have passed.
- `ADOPTED` — there is evidence of real external use; this must not be inferred from implementation alone.

## 3. Account and authentication

The TV must know which user is operating it before it can safely expose private gardens or editable characters.

Required properties:

1. the user authenticates through an approved MyZubster flow;
2. the server establishes the identity — the TV must not invent an owner ID;
3. session/token material is short-lived or revocable where appropriate;
4. secrets are never committed to GitHub or embedded as permanent credentials in the TV client;
5. logout removes access to private garden and character resources.

### Authentication gate

Do not connect a private camera automatically until the backend can answer: **who is this user?**

## 4. Ownership model

Authentication answers who the user is. Authorization answers what they may access.

The backend should enforce relationships equivalent to:

```text
User A → Garden A → Camera A
User A → Character A
User B → Garden B → Camera B
User B → Character B
```

User A must not be able to retrieve Garden B's stream URL or modify Character B by changing a client-side identifier.

Ownership must be checked server-side on every protected read/write operation.

## 5. Connect the garden

A garden record should identify the garden and its owner without exposing camera passwords to the TV.

Recommended conceptual fields:

```text
garden.id
garden.ownerId
garden.name
garden.status
```

Camera credentials or permanent upstream URLs should live only in an appropriate protected server-side configuration/secrets boundary, not in public repository files, character manifests or TV local storage.

## 6. Connect the camera

Typical source cameras may expose RTSP or another local feed. For internet-facing TV playback, MyZubster should expose an authorised playback path rather than the raw permanent camera credential.

Recommended flow:

```text
Camera / local gateway
       ↓
protected ingest / conversion if required
       ↓
HLS playback service
       ↓
short-lived authorised HTTPS .m3u8 URL
       ↓
MyZubster TV
```

The current My Garden Live slice is designed around HTTPS HLS playback. This does **not** by itself prove the authenticated account → garden → stream association.

## 7. Open “My Garden Live” on TV

Once authentication and ownership are implemented, the intended user journey is:

1. open MyZubster TV;
2. sign in;
3. select **Il mio orto / My Garden**;
4. the TV requests access to the owned garden;
5. the backend verifies ownership;
6. the backend returns an authorised, preferably short-lived playback URL;
7. the TV opens the HLS stream;
8. D-pad/remote controls remain usable for playback and exit.

The user should not normally need to type a permanent camera password on the TV.

## 8. Create the MyZubster character

The same authenticated identity should own the user's character.

Target flow:

```text
TV Character Builder
  ↓
authenticated API request
  ↓
server-side validation + ownership
  ↓
Character Registry / profile persistence
  ↓
character ID + status
  ↓
TV / MyZubster world
```

The client may propose appearance, name and allowed profile attributes. It must not be able to assign another user's ownership or bypass moderation/validation rules.

## 9. Character is not automatically a wallet or NFT

Keep these concepts separate:

- **MyZubster character/profile** — application identity/persona representation;
- **account identity** — authenticated user identity;
- **wallet** — financial/cryptographic capability, if separately implemented;
- **NFT/token** — optional blockchain asset, only if explicitly implemented and verified.

Creating a character must not be documented as creating a wallet, token or NFT unless that exact operation exists and is verified.

## 10. Enter the MyZubster world / metaverse experience

After persistence, the application can load the user's character by authenticated ownership rather than by trusting a manually supplied public identifier.

The character can then act as the user's visual/profile representation in supported MyZubster experiences.

A narrative illustration of the character is not evidence that a corresponding real-world event occurred.

## 11. Connect Zorgax

Zorgax is the observation, verification, maintenance and storytelling layer around the ecosystem. It should receive only the context required for a task.

Examples:

- inspect the state of a TV-related PR;
- diagnose CI using observable logs;
- document an implemented garden-stream feature;
- classify external adoption evidence;
- prepare a Chronicle asset from verified facts;
- explain the state of a character workflow.

Zorgax should not receive raw camera passwords, seed phrases, private keys or unnecessary personal information.

## 12. What Zorgax may do automatically

Within the operator policy, low-risk verified work may include:

- inspect repository/PR/CI state;
- compare current work with existing PRs and documentation;
- create a dedicated branch;
- make a bounded documentation or code change;
- open/update a Draft PR;
- classify evidence conservatively;
- diagnose an incident using symptom/cause/hypothesis separation.

It must not automatically merge, force-push, change secrets, billing, permissions or persistent production data.

## 13. Evidence boundary

The system contains three different visual/information categories that must remain explicit:

### REAL EVIDENCE

Examples: actual garden camera frames, GitHub workflow results, public commits, official institutional sources.

### DOCUMENTATION_VISUAL

A diagram or interface illustration created to explain how the system works. It is not proof that the depicted deployment exists.

### NARRATIVE_ILLUSTRATION

Artwork for Zorgax/MyZubster storytelling. It must never be presented as a real camera image, real deployment screenshot or proof of adoption.

## 14. API boundary

A production implementation needs canonical protected operations equivalent to:

```text
GET   /api/me
GET   /api/gardens/mine
GET   /api/gardens/:id/live-access
GET   /api/characters/me
POST  /api/characters
PATCH /api/characters/:id
```

These names are architectural examples, not a claim that every endpoint already exists.

Each protected endpoint should perform authentication, ownership/authorization validation, input validation, safe error handling and appropriate rate limiting.

## 15. Stream-access response

The TV should receive only what it needs to play the stream. Conceptually:

```json
{
  "gardenId": "...",
  "playbackUrl": "https://.../temporary-playlist.m3u8",
  "expiresAt": "..."
}
```

Do not return a permanent camera password or unrelated secrets.

## 16. Failure behaviour

The TV experience needs predictable states for:

- not authenticated;
- garden not assigned;
- character not created;
- stream offline;
- access expired;
- access forbidden;
- network unavailable;
- malformed/unsupported stream;
- backend unavailable.

An error should not cause the application to reveal internal credentials or another user's resource identifiers.

## 17. Remote/D-pad requirements

Every critical TV action must work without a mouse:

- visible focus;
- deterministic focus order;
- Back behaviour;
- OK/Enter activation;
- playable controls reachable by D-pad;
- text entry compatible with the TV keyboard where text is unavoidable;
- no essential hover-only interaction.

## 18. Security checklist

Before production readiness verify:

- [ ] authentication is server-validated;
- [ ] garden ownership is enforced server-side;
- [ ] character ownership is enforced server-side;
- [ ] camera secrets are not shipped in the TV client;
- [ ] playback access is scoped and revocable/expiring where appropriate;
- [ ] URLs/tokens are not written into public logs or GitHub documentation;
- [ ] inputs are validated;
- [ ] rate limiting exists on sensitive endpoints;
- [ ] unauthorized cross-user access tests fail safely;
- [ ] logout removes private access.

## 19. End-to-end physical QA

Use a real Google TV/Android TV device.

### Account

- [ ] launch app;
- [ ] authenticate;
- [ ] restart app and verify intended session behaviour;
- [ ] logout and verify private access disappears.

### Garden

- [ ] open owned garden;
- [ ] verify another user's garden cannot be opened;
- [ ] request live access;
- [ ] play HLS stream;
- [ ] test remote controls;
- [ ] test stream offline;
- [ ] test expired authorization;
- [ ] reopen and recover safely.

### Character

- [ ] open Character Builder;
- [ ] navigate only with remote;
- [ ] create character;
- [ ] verify server-side ownership;
- [ ] close/reopen app;
- [ ] verify character persists;
- [ ] edit character;
- [ ] verify another user's character cannot be edited.

### Zorgax / operations

- [ ] documentation describes the observed state, not an assumed state;
- [ ] CI result is recorded from the relevant commit;
- [ ] any visual asset has provenance/classification;
- [ ] no secrets appear in PRs, screenshots or logs.

## 20. Release gate

The complete experience can be described as **PRODUCTION_READY** only when this chain has been demonstrated:

```text
authenticated user
  → server-verified ownership
  → owned garden
  → authorised live stream
  → physical TV playback
  → owned character creation
  → persistent character reload
  → safe Zorgax operational context
```

Passing only a web build or Android build is not equivalent to passing this gate.

## 21. Current documentation map

Use this guide as the integration map. Detailed documents remain the source for individual subsystems, including:

- `docs/ZORGAX_SYSTEM.md` — Zorgax architecture;
- `docs/ZORGAX_AUTOMATION.md` — automation roles;
- `docs/MYZUBSTER_METAVERSE.md` — world/metaverse architecture;
- TV character documentation under review;
- My Garden Live TV documentation/code under review;
- the practical Zorgax user guide under review.

## 22. Recommended implementation order

Do not build everything simultaneously. The safest sequence is:

```text
1. Authentication
2. Garden ownership
3. Protected stream-access API
4. TV live playback integration
5. Character ownership + persistence
6. TV character integration
7. Physical-device QA
8. Deployment gate
9. Zorgax operational/Chronicle integration
```

This order establishes the security boundary before adding convenience or narrative layers.

---

## Definition of done

“MyZubster TV + garden + character + Zorgax works end-to-end” means a real authenticated user can use a real TV remote to access only their authorised garden stream, create and recover only their character, and the operational system can observe/document that state without exposing secrets or turning unverified assumptions into claims.
