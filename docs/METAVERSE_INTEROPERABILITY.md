# MyZubster Metaverse Interoperability

Status: experimental
Tracking: #726

## Goal

MyZubster can reference and interoperate with independently maintained open-source virtual worlds without implying partnership, endorsement, shared governance, or shared identity.

## Rules

1. External worlds remain independently owned and governed.
2. Every integration records its upstream repository and provenance.
3. Assets are referenced only unless their license explicitly permits reuse.
4. Authentication and identity boundaries remain explicit.
5. Anonymous and authenticated access must not be conflated.
6. An adapter marked `experimental` is not evidence of upstream acceptance.
7. Upstream pull requests should provide a generic benefit to the upstream project and must not be promotional.
8. Only an accepted upstream contribution may be recorded as `upstream_validated`.

## Adapter contract

Each external world is represented by a registry entry with at least:

```json
{
  "id": "example-world",
  "type": "external_metaverse",
  "status": "experimental",
  "upstream": "https://github.com/example/project",
  "entry_url": null,
  "auth_mode": "external",
  "asset_policy": "reference_only_unless_licensed",
  "provenance_required": true,
  "partnership_claim": false
}
```

## First target: Vircadia World

The first interoperability target is `vircadia/vircadia-world`. The older `vircadia-web` repository identifies Vircadia World as its successor, so new MyZubster work targets the successor rather than the deprecated client.

Initial scope:

- document the boundary between MyZubster and Vircadia identity/auth;
- reference upstream worlds rather than importing assets by default;
- explore portable character/avatar metadata where upstream interfaces permit it;
- keep provenance for every external URL, repository and version;
- prepare a small upstream contribution that is useful independently of MyZubster.

## Contribution workflow

1. Inspect upstream README, license, CONTRIBUTING and active issues.
2. Select a small generic interoperability/documentation improvement.
3. Fork the upstream repository under the contributor account.
4. Work on a dedicated branch.
5. Test according to upstream instructions.
6. Open a focused pull request.
7. Respond to maintainer review.
8. Record the PR URL and result in MyZubster's registry/evidence trail.

## Candidate ecosystems

After Vircadia, candidates may include Decentraland SDK/ecosystem and actively maintained WebXR/open-world projects. Inclusion in this list is exploratory and does not imply affiliation.

## Safety and provenance

Never present an external project as a MyZubster partner unless there is explicit evidence supporting that statement. Never copy third-party assets merely because they are publicly accessible. Repository license, asset license, attribution requirements and upstream terms must be checked independently.
