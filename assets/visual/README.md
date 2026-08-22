# MyZubster GitHub Visual Foundation

This directory contains reusable visual documentation. These assets explain repository architecture and workflow; they are **not real-world evidence** and do not prove deployment, adoption, payment or partnership.

The canonical documentation placement for this package is [`docs/VISUAL-FOUNDATION.md`](../../docs/VISUAL-FOUNDATION.md), which embeds the repository SVGs with descriptive alt text and keeps the Chronicle narrative asset in a separate evidence class.

| ID | Asset | Purpose | Source / provenance | Evidence class |
|---|---|---|---|---|
| `MYZ-VIS-008` | `MYZ-VIS-008-ecosystem-architecture.svg` | Canonical ecosystem and settlement-boundary map | Derived from `docs/ECOSYSTEM.md` on 2026-08-22; Zorgax Visual Intelligence; original SVG layout | `DOCUMENTATION_VISUAL` |
| `MYZ-VIS-009` | `MYZ-VIS-009-contributor-evidence-flow.svg` | Contributor onboarding, evidence and review flow | Derived from `README.md`, `JOIN.md`, `BOUNTIES.md` and current character-onboarding docs on 2026-08-22; Zorgax Visual Intelligence; original SVG layout | `DOCUMENTATION_VISUAL` |
| `MYZ-VIS-010` | `MYZ-VIS-010-maturity-map.svg` | Prevent roadmap/experimental components being mistaken for production | Derived from the Project status table in `README.md` and `docs/ECOSYSTEM.md` on 2026-08-22; Zorgax Visual Intelligence; original SVG layout | `DOCUMENTATION_VISUAL` |
| `MYZ-CHR-001` | `cronaca_cyberpunk_porta_galliana_pulita.png` (Drive archive) | Narrative Chronicle illustration of the Porta Galliana cleanup flow and remote/mobile monitoring concept | Generated 2026-08-22 from the Chronicle narrative; archived in `MyZubster Zorgax Chronicle` | `NARRATIVE_ILLUSTRATION` |

## Canonical visual language

- dark navy / near-black infrastructure background;
- cyan for evidence, public state and verified information paths;
- magenta for optional/integration boundaries and cautionary transitions;
- compact technical typography and high contrast for GitHub/mobile readability;
- claims are deliberately conservative: experimental, internal and independently verified boundaries remain visible.

## Usage

SVG is used so diagrams stay readable at desktop and mobile widths and remain inspectable/versionable in Git. When embedded in Markdown, provide descriptive alt text. The canonical embeds and alt text live in [`docs/VISUAL-FOUNDATION.md`](../../docs/VISUAL-FOUNDATION.md).

Narrative Chronicle illustrations are catalogued separately from documentation visuals and real-world evidence. They may communicate a story or workflow, but they must never be presented as photographic proof of a physical-world event.

## Review status

The Foundation 001 review confirms that:

- the architecture visual preserves the separate settlement/verifier boundary described in `docs/ECOSYSTEM.md`;
- contributor/evidence wording does not equate merge, MYZ accounting or CID existence with external payment;
- maturity labels remain development, integration, internal or experimental rather than claiming production readiness;
- all three SVGs include accessible `<title>` and `<desc>` metadata and are embedded with descriptive Markdown alt text in the canonical documentation page;
- the Chronicle illustration remains explicitly classified as `NARRATIVE_ILLUSTRATION` and its successful Drive archive is recorded separately from evidence.

## Provenance contract

For every new visual, record:

1. stable `MYZ-VIS-###` or `MYZ-CHR-###` identifier;
2. source documents or evidence links;
3. generation/assembly method;
4. evidence class;
5. destination repository;
6. whether a Drive archive copy exists.

Do not label AI-generated narrative art, mock UI or documentation diagrams as photographic or real-world evidence.

## Drive archive

Canonical archive destination for GitHub-bound Zorgax Chronicle/visual assets: Google Drive folder `MyZubster Zorgax Chronicle` (`1eZEWtzaD6iDUFFsUpcp9Ni0nGww8V8vT`). Drive permissions must not be changed automatically.

`MYZ-CHR-001` is archived successfully on Drive as `cronaca_cyberpunk_porta_galliana_pulita.png` (Drive file ID `1gdtpfiCTMX6tjx1xRC15hj5veG9Ray2f`):

https://drive.google.com/file/d/1gdtpfiCTMX6tjx1xRC15hj5veG9Ray2f/view

The PNG itself is currently referenced from Drive rather than committed as binary through this connector. Its repository classification remains `NARRATIVE_ILLUSTRATION`, not evidence.
