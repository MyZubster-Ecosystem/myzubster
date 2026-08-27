# MyZubster Metaverse — Neon Plaza v0.1

Neon Plaza is the first multiplayer social-space prototype for the MyZubster ecosystem.

It is designed around a simple idea: every participant can create a public narrative character, enter a shared world and interact with other characters while keeping identity claims separate from unverified profile data.

## What v0.1 includes

- public avatar/character creator;
- five narrative archetypes: Guardian, Explorer, Maker, Chronicler and Scientist;
- shared 2D/2.5D world called **Neon Plaza**;
- keyboard and touch movement;
- real-time presence through HTTP + Server-Sent Events;
- public plaza chat;
- proximity awareness (nearby characters);
- emotes;
- landmarks for future MyZubster spaces:
  - Identity Hall;
  - Visual Gallery;
  - Zorgax Observatory;
  - Creator Lab.

## Architecture

```text
Browser / React
      |
      | POST join/move/chat/emote
      | GET event stream (SSE)
      v
MyZubster backend /api/metaverse
      |
      +-- in-memory presence
      +-- room state
      +-- event broadcast
      +-- public-safe avatar metadata
```

No additional realtime dependency is required for v0.1. Express handles commands and Server-Sent Events fan out world updates.

## Identity boundary

v0.1 intentionally runs in `guest-unverified` identity mode.

A user may type a MYZ-ID for display, but the server **does not** convert that value into a verified identity claim. This prevents usernames or arbitrary strings from being treated as proof.

Future integration with the MyZubster Digital Civic Registry (MYZ-DCR) should add cryptographic challenge/signature verification before an avatar can display a verified identity badge.

```text
Guest profile
    ↓
public character
    ↓
Neon Plaza session

Future:
MYZ-DCR identity + signature
    ↓
verified session credential
    ↓
verified public character
```

## Privacy and safety

The metaverse endpoint must not receive or store private keys, seed phrases, identity documents, passwords or recovery secrets.

The v0.1 server stores only temporary in-memory presence data. Chat is broadcast live and is not persisted by this prototype.

Before a broad public release, add:

- authenticated account/session handling;
- mute, block and report controls;
- moderation and abuse tooling;
- persistent database-backed world state where needed;
- distributed presence storage for multiple backend instances;
- anti-spam/rate-limit infrastructure beyond the prototype guards;
- privacy review and retention policy;
- age-appropriate community rules.

## Local development

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
REACT_APP_API_URL=http://localhost:3009 npm start
```

Then open MyZubster and choose **🪐 Metaverse**.

## Why 2D first?

The first goal is to validate the social protocol — identity, presence, movement, proximity and interaction — before introducing a heavy 3D rendering layer.

A later version can reuse the same concepts in Three.js/WebGL/VR without changing the core identity model.
