# Editorial privacy and biography policy

This policy defines the evidence and privacy boundary for personal biographies, participant profiles and third-party claims in the MyZubster public repository.

## Core rule

**Canonical project documentation should contain only the minimum personal information needed to identify a public role or contribution.**

Personal history, sensitive autobiographical material, allegations about third parties, criminal-history claims, medical information, precise private locations, confidential relationships and similar material must not be treated as canonical project facts unless there is a clear legitimate purpose, appropriate consent where required, and reliable public evidence.

## Evidence states

Keep these categories separate:

1. **Verified public project fact** — supported by public repository evidence, a public source, or another independently checkable record.
2. **Self-reported statement** — explicitly attributed to the person who made it and not presented as independently verified.
3. **Third-party claim** — not published as fact without reliable independent evidence and an appropriate reason to include it.
4. **Sensitive or unnecessary personal data** — excluded from canonical project documentation by default.

## Founder and contributor profiles

A public profile may normally include:

- public GitHub identity;
- project role;
- public contributions, repositories, pull requests and documentation;
- publicly declared skills or project interests when relevant;
- public links deliberately supplied for professional/project use.

Avoid adding unrelated personal history simply because it was mentioned in a conversation, social post or autobiographical account.

## Institutions, communities and organizations

Mentioning that a person describes an experience involving an institution, collective or community does **not** establish affiliation, endorsement, partnership, authorization or representation by that entity.

Any such relationship must remain explicitly unverified unless supported by appropriate evidence.

## Allegations and criminal-history narratives

Unverified allegations of illegal activity, hacking, trafficking, criminal association or misconduct involving identifiable people or organizations must not be maintained as canonical project biography.

If such material is ever relevant for a legitimate documentary purpose, it requires separate editorial review, reliable sourcing, proportionality and a clear distinction between allegation, self-report and established fact.

## Repository and automation behavior

Zorgax, bots, agents and maintainers should follow the same boundary:

- do not promote self-reported personal claims into verified facts;
- do not infer membership, partnership or endorsement from identity or proximity;
- do not infer criminal history, health status or other sensitive attributes;
- minimize personal data in generated documentation;
- prefer links to public technical evidence over biographical narrative;
- when evidence is unavailable, use `UNVERIFIED`, `SELF-REPORTED` or omit the claim.

## Corrections

When unsupported or excessive personal material is discovered in canonical documentation:

1. remove or minimize it;
2. preserve technical/project information that is independently useful;
3. avoid treating removal as a factual judgment about the underlying story;
4. document the correction through normal Git history or pull-request review.

## Evidence-first principle

A repository entry, README paragraph, issue, pull request, merge, social profile or automated statement is not by itself proof of a personal-history claim.

**No evidence → no canonical factual claim. Minimum necessary data → default public profile.**
