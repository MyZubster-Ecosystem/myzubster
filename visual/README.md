# MyZubster Visual

MyZubster Visual is an experimental social/comic layer for the MyZubster ecosystem.

The goal is to let each contributor create a persistent **digital character**, use that character in collaborative comic scenes, and connect the resulting story to a real GitHub conversation, issue or pull request.

> Status: experimental MVP with a working browser character-to-comic flow. This is not yet a production AI image-generation service.

## Try the MVP

When the MyZubster Express app is running, open:

```text
/visual
```

The page now lets a user:

- create a sanitized character profile locally;
- generate a four-panel storyboard from the role, scene and collaboration intent;
- render a comic draft in the browser;
- download the character JSON;
- download the story JSON;
- download the comic as SVG;
- open a pre-filled GitHub collaboration Issue containing the storyboard.

Nothing is automatically published.

## Core flow

```text
GitHub identity (optional in MVP)
        ↓
Create Character
        ↓
Choose visual style + role + collaboration intent
        ↓
Generate Comic
        ↓
Local storyboard + dialogue
        ↓
Comic preview + SVG export
        ↓
Open GitHub collaboration Issue
        ↓
Discuss collaboration
        ↓
Optional PR / implementation
```

## Character model

A character is a versioned profile containing a stable id, display name, optional GitHub handle, role, visual preferences, tone, collaboration intent, consent/privacy flags and lifecycle status. The canonical schema lives in [`schemas/character.schema.json`](schemas/character.schema.json).

## GitHub collaboration model

Issues are the conversational layer. A generated comic is creative presentation only; the Issue contains the explicit proposal and reviewable discussion. An Issue is not evidence of a partnership, contract, endorsement or commitment.

Pull requests are appropriate for versioned character profiles, stories, documentation and implementation changes.

## Privacy and consent

Do not put unnecessary personal information into public character files or story metadata. If a character is based on a real person, that person must choose or approve use of their likeness. Consent for one scene does not imply consent for unrelated future uses.

## MVP phases

### Implemented

- Character JSON schema and examples.
- Collaboration Issue template.
- `/visual` Create Character UI.
- Local sanitized JSON preview and export.
- Local four-panel storyboard generator.
- Browser comic preview.
- Story JSON export.
- Comic SVG export.
- Storyboard-aware GitHub Issue handoff.
- Route smoke test.

### Next

- GitHub OAuth and verified handle binding.
- Server-side schema validation.
- Editable dialogue/storyboard controls.
- Optional persistence with privacy controls.
- Optional AI image-generation adapter.
- Character-consistency and approved-likeness controls.
- Public gallery for explicitly approved stories.
- Multi-character collaborative scenes.

## Design principle

```text
CHARACTER → STORY → COMIC → CONVERSATION → COLLABORATION → OPTIONAL IMPLEMENTATION
```

The creative layer starts a conversation. GitHub provides reviewability and history. Neither generated content nor an Issue should be presented as proof that a real-world partnership exists.
