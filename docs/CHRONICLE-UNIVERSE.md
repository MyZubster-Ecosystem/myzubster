# MyZubster Chronicle Universe

`public/chronicle-universe.html` is the public interactive index for the MyZubster visual universe.

## Source

The page reads only public GitHub metadata from `MyZubster-Ecosystem/MyZubster-Visual`, branch `main`, and filters image files under `assets/` (`png`, `jpg/jpeg`, `webp`, `gif`, `svg`). It does not require or embed a GitHub token.

The live index deliberately avoids a manually duplicated image catalog: the GitHub tree is the inventory source, while each asset links back to its repository blob and raw file for provenance inspection.

## Automatic classification

Classification is path-based and conservative:

- `assets/comic`, `assets/characters`, `assets/bots`, `assets/cyberpunk-series`, `assets/zorgax`, `assets/concepts` → `NARRATIVE_ILLUSTRATION`;
- `assets/diagrams`, `assets/roadmaps`, `assets/life`, `assets/infrastructure`, `assets/milestones`, `assets/social`, `assets/identity`, `assets/events` → `DOCUMENTATION_VISUAL`;
- `assets/evidence` → `EVIDENCE_REFERENCE`;
- any other image directory → `CLASSIFICATION_REVIEW`.

These classes are display/navigation metadata, not truth certificates.

## Evidence boundary

- `NARRATIVE_ILLUSTRATION` is never photographic or real-world evidence by classification alone.
- `DOCUMENTATION_VISUAL` explains or summarizes repository concepts but does not prove deployment, adoption, payment, partnership or a physical event.
- `EVIDENCE_REFERENCE` means the asset lives in the repository evidence area; authenticity, provenance, privacy review and acceptance criteria still belong to the applicable evidence workflow.
- GitHub presence, a commit SHA or a merge does not by itself prove physical-world truth.

The Chronicle therefore keeps the project rule explicit: **STORY != EVIDENCE · MERGE != DEPLOYMENT · IMAGE != PHYSICAL TRUTH**.

## Interaction model

The page provides:

- live image count from GitHub;
- folder and evidence-class filters;
- free-text search;
- responsive card gallery;
- Story Mode with previous/next navigation;
- per-asset blob SHA, GitHub provenance link and raw asset link;
- explicit classification/evidence note for every opened asset.

## Integration

The intended public entry point is `/chronicle-universe.html`. The canonical Gateway home links to this page as `Chronicle Universe`.

No Drive permission changes, secrets or unnecessary personal data are required by this integration.
