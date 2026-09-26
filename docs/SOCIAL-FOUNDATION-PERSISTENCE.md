# Social foundation persistence (MYZ-70)

MYZ-70 originally described a PostgreSQL relational schema. The deployed MyZubster application currently uses MongoDB with Mongoose, so this milestone implements the same domain and integrity intent in the existing persistence layer instead of introducing a second database.

## Models

- existing application User remains the canonical account record;
- SocialProfile: social profile preferences, visibility and trust level;
- SocialFollow: follower/followee relationship;
- Community: community identity, slug, owner and visibility;
- CommunityMembership: existing membership model with unique community/user membership;
- SocialPost, SocialComment and SocialReaction: foundation feed entities.

## Integrity

Mongoose unique indexes enforce one social profile per user, unique community slugs, unique follow edges, unique community membership pairs and duplicate-reaction protection.

MongoDB does not provide relational foreign keys. Relationship integrity therefore must be validated by service/API operations before writes. Later MYZ-71–75 API work must fail closed when referenced users, communities or posts do not exist.

## Soft deletion

Mutable social entities include a nullable `deletedAt`. Normal reads must exclude records where `deletedAt` is set unless an explicitly authorized administrative/audit operation requires them.

## Migration / rollback

These additions are backward-compatible collections and indexes; existing account and Marketplace data are not rewritten. Rollback consists of stopping use of the new collections. Destructive collection deletion is intentionally not automated.

## Seed/test fixture target

Tests cover schema/index invariants. API-level seed fixtures for a user graph and community should be added with the MYZ-72–75 service implementation so fixtures exercise real write validation rather than bypassing it at the model layer.
