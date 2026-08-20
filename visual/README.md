# MyZubster Visual

MyZubster Visual is an experimental social/comic layer for the MyZubster ecosystem.

The goal is to let each contributor create a persistent **digital character**, use that character in collaborative comic scenes, and connect the resulting story to a real GitHub conversation, issue or pull request.

> Status: experimental MVP specification. This is not yet a production image-generation service.

## Core flow

```text
GitHub login / identity
        ↓
Create Character
        ↓
Choose visual style + role + collaboration intent
        ↓
Create scene with MyZubster / another character
        ↓
Generate storyboard + dialogue + comic asset
        ↓
Publish sanitized story metadata
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
- interests;
- collaboration topics;
- consent / privacy settings;
- optional avatar and comic assets.

Character profiles should never contain secrets, private keys, unnecessary personal data or sensitive information.

## Story model

A story links one or more characters to a collaboration idea.

Example:

```text
shop-owner-01 + myzubster-founder
        ↓
"Future retail collaboration"
        ↓
cyberpunk shop scene
        ↓
comic generated
        ↓
GitHub Issue: Collab — Shop X × MyZubster
```

A comic asset is presentation. The GitHub Issue remains the structured discussion and decision surface.

## GitHub interaction model

MyZubster Visual should use GitHub for public, reviewable collaboration rather than treating a comic as proof of a partnership.

Suggested mapping:

| Visual object | GitHub object |
|---|---|
| Character proposal | JSON/YAML profile in `visual/characters/` |
| Collaboration idea | Issue |
| Story / script revision | Commit or PR |
| Implementation proposal | PR |
| Discussion | Issue / PR comments |
| Accepted collaboration | Explicit human decision recorded in Issue/PR |

## Proposed directories

```text
visual/
├── README.md
├── schemas/
│   └── character.schema.json
├── characters/
│   └── example-character.json
└── stories/
    └── example-story.json
```

## Privacy and consent

- Do not create a realistic avatar of another person without their authorization.
- Keep public profiles pseudonymous when desired.
- Store only information needed for the visual/collaboration workflow.
- A generated comic must not be described as evidence that a person or organization approved a partnership.
- Public stories should distinguish fiction, proposal, simulation and confirmed collaboration.

## MVP milestones

1. Character schema and example profiles.
2. GitHub Issue template for collaboration proposals.
3. Web character builder.
4. Storyboard generator.
5. Image-generation provider adapter.
6. GitHub OAuth / App integration.
7. Public gallery with moderation and consent controls.

## Long-term direction

The intended experience is:

**Create yourself → enter a story → meet MyZubster → discuss an idea → turn the idea into an open collaboration.**
