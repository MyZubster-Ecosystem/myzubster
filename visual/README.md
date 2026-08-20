# MyZubster Visual

MyZubster Visual is an experimental social/comic layer for the MyZubster ecosystem.

The goal is to let each contributor create a persistent **digital character**, use that character in collaborative comic scenes, and connect the resulting story to a real GitHub conversation, issue or pull request.

> Status: experimental MVP specification + first browser interface. This is not yet a production image-generation service.

## Try the MVP

When the MyZubster Express app is running, open:

```text
/visual
```

The page lets a user create a sanitized character profile locally in the browser, download the JSON and generate a pre-filled GitHub collaboration Issue. It does **not** upload a photo, generate an image, authenticate with GitHub or publish data automatically.

## Core flow

```text
GitHub identity (optional in MVP)
        ↓
Create Character
        ↓
Choose visual style + role + collaboration intent
        ↓
Create scene with MyZubster / another character
        ↓
Generate storyboard + dialogue + comic asset (planned)
        ↓
Publish sanitized story metadata (explicit action; planned)
        ↓
Open / link GitHub Issue
        ↓
Discuss collaboration
        ↓
Optional PR / implementation
```

## Character model

A character is not only an avatar. It is a versioned profile containing:

- stable character id;
- display name;
- GitHub handle, when voluntarily linked;
- role / profession;
- visual traits and style preferences;
- tone of voice;
- collaboration intent;
- consent/privacy flags;
- lifecycle status.

The canonical schema for the MVP lives in [`schemas/character.schema.json`](schemas/character.schema.json).

## Repository layout

```text
visual/
├── README.md
├── IMPLEMENTATION.md
├── schemas/
│   └── character.schema.json
├── characters/
│   └── example-character.json
└── stories/
    └── example-story.json

public/
└── visual.html

.github/ISSUE_TEMPLATE/
└── visual-collaboration.yml
```

## GitHub collaboration model

### Issues

Issues are the conversational layer. A user can propose a story or possible collaboration such as:

```text
Visual collab: Nova Merchant × MyZubster
```

A collaboration issue should state who the character represents, what is fictional/creative, what collaboration is being proposed, the desired scene/story and whether the character can appear in public generated media.

An Issue represents a proposal/discussion only. It is not evidence of a real partnership, contract, endorsement or commitment.

### Pull requests

A PR is appropriate when a contributor wants to add or change versioned project material, for example a character profile, story definition, documentation or UI/code for MyZubster Visual.

Character and story files should remain reviewable, privacy-aware and easy to update through normal Git history and project governance.

## Privacy and consent

Do not put unnecessary personal information into public character files or story metadata.

If a visual character is based on a real person:

1. that person must choose or approve the use of their likeness;
2. the profile should store only the minimum information needed for the creative workflow;
3. public metadata must not contain private contact information, sensitive traits, precise private locations or credentials;
4. consent to participate in one scene does not imply consent for unrelated future uses.

The first browser MVP keeps generated metadata local until the user explicitly downloads it or opens GitHub.

## MVP phases

### Phase 0 — specification

- Character JSON schema.
- Story JSON structure.
- Collaboration Issue template.
- Example character/story.

### Phase 1 — browser MVP (this branch)

- Create Character form.
- Local sanitized JSON preview.
- JSON export.
- Pre-filled GitHub collaboration Issue link.
- `/visual` route in the existing Express application.
- Smoke test for the route.

### Phase 2 — GitHub identity

- GitHub OAuth.
- Optional verified handle binding.
- Explicit API action to propose a character or story.

### Phase 3 — comic pipeline

- storyboard generation;
- dialogue editor;
- image generation abstraction;
- character consistency controls;
- moderation/consent checks;
- public gallery for approved stories.

### Phase 4 — collaborative world

- multi-character stories;
- versioned shared scenes;
- collaboration status linked to Issues/PRs;
- optional MyZubster bounty integration for clearly scoped creative/technical contributions.

## Design principle

```text
CHARACTER → STORY → CONVERSATION → COLLABORATION → OPTIONAL IMPLEMENTATION
```

The creative layer can start a conversation. GitHub provides reviewability and history. Neither generated content nor an Issue should be presented as proof that a real-world partnership exists.
