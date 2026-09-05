# MyZubster Circular Marketplace — Tutorial

This tutorial explains the first working layers of MyZubster's circular Marketplace and Metaverse flow.

> Status note: this document distinguishes features already implemented in runtime from planned product layers. It does not claim that a brand, recycler, sound system, crew or organization is an official MyZubster partner unless separately verified and authorized.

## 1. The idea

MyZubster connects an explorable Metaverse, the Marketplace and circular-economy provenance.

A possible journey is:

**Metaverse → Marketplace booth → listing → order → completed exchange → Circular Item Passport → reuse / repair / transfer / recycling**

Examples can include sound-system equipment, food and local produce, hygiene/daily goods, repair/reuse services and recycling/recovery operators.

## 2. Enter the Circular Marketplace from the Metaverse

The Metaverse includes a Circular Marketplace panel with category booths for:

- Sound System Equipment
- Food & Local Producers
- Hygiene & Daily Goods
- Repair & Reuse
- Recycling & Recovery

Selecting a booth routes the visitor toward the corresponding Marketplace category and emits the existing Marketplace-open analytics event.

This is currently a visible navigation layer. It is not yet a full 3D shop renderer.

## 3. Marketplace exchange

A buyer can request an active Marketplace listing. The Marketplace order flow supports lifecycle states such as requested, accepted, rejected, cancelled and completed.

The seller can accept an available request. Stock is adjusted when an order is accepted. A completed exchange is the boundary used by the circular provenance flow.

## 4. Automatic Circular Item Passport

When a Marketplace order reaches `COMPLETED`, MyZubster now attempts to create a persistent `CircularItemPassport` for that order.

The passport is bound to:

- the buyer/current owner;
- the Marketplace listing;
- the completed Marketplace order;
- the item title and category;
- its current circular lifecycle state;
- lifecycle evidence/events.

The order ID is unique in the passport model, and creation uses an idempotent upsert so the same completed order does not intentionally generate multiple passports.

The first lifecycle event is:

`ACQUIRED`

The initial passport state is:

`IN_USE`

## 5. Circular lifecycle vocabulary

The data model is ready to represent these lifecycle events:

- `ACQUIRED`
- `REUSED`
- `REPAIRED`
- `TRANSFERRED`
- `RECYCLING_REQUESTED`
- `RECYCLER_ACCEPTED`
- `RECOVERED`

And these current item states:

- `IN_USE`
- `REUSED`
- `REPAIRED`
- `TRANSFERRED`
- `AWAITING_RECYCLING`
- `AT_RECYCLER`
- `RECOVERED`

Lifecycle events can carry a note, an evidence URL, an actor and a timestamp.

## 6. Example journey

Imagine a user enters the MyZubster Metaverse and opens the Sound System booth.

They discover an independent seller's eligible Marketplace listing, complete an exchange, and the completed order receives a Circular Item Passport.

Months later the equipment might be repaired or transferred to another owner. Eventually, if an appropriate verified recovery route exists, the item can move toward recycling or recovery.

The same architecture can support other product categories. A named commercial brand must not be presented as an official booth, seller or partner unless that relationship is actually authorized.

Likewise, a product must not be described as recyclable merely because a recycling category exists: the disposal/recovery route needs evidence from a capable operator and must reflect the actual material and local process.

## 7. Evidence and provenance

The purpose of the passport is not only to show a status badge. It is to build a traceable history around the item.

A lifecycle event can identify:

1. what happened;
2. who recorded the event;
3. when it happened;
4. supporting evidence when available.

Future recycler verification should strengthen this model rather than treating an unverified user declaration as proof of material recovery.

## 8. Developer reference

Current relevant runtime files include:

```text
frontend/src/components/MetaverseCircularMarketplace.js
src/models/MarketplaceListing.js
src/models/MarketplaceOrder.js
src/models/CircularItemPassport.js
src/routes/marketplaceTrustRoutes.js
```

Architecture background:

```text
docs/metaverse/CIRCULAR-MARKETPLACE-WORLD.md
```

(The architecture document path may evolve; search the repository for “Circular Marketplace” if it is moved.)

## 9. What is implemented now

Implemented runtime foundation:

- visible Circular Marketplace category booths inside the Metaverse experience;
- Marketplace order lifecycle;
- persistent Circular Item Passport model;
- automatic idempotent passport creation when an order reaches `COMPLETED`;
- lifecycle vocabulary for acquisition, reuse, repair, transfer and recycling/recovery.

## 10. What still needs implementation

The following should not yet be described as completed runtime functionality:

- user-facing passport page/UI;
- authenticated endpoints for adding lifecycle events;
- ownership-transfer workflow for passports;
- verified recycler onboarding and authorization;
- recycler acceptance/recovery confirmation flow;
- evidence moderation and dispute handling;
- automatic circular impact metrics;
- full 3D Marketplace booths;
- checkout changes specifically driven by the passport;
- guaranteed recyclability of any particular product category.

## 11. Recommended next implementation sequence

1. Add authenticated `GET /passports/mine` and passport-detail endpoints.
2. Add tightly authorized lifecycle mutation endpoints.
3. Separate owner assertions from recycler-confirmed recovery events.
4. Add ownership-transfer confirmation.
5. Build the passport timeline UI.
6. Connect the timeline back into Marketplace and Metaverse surfaces.
7. Add tests for authorization, idempotency, invalid transitions and privacy.
8. Add evidence-backed recycler profiles and recovery capabilities.

## 12. Core principle

**Buying is only the beginning of the product story.**

MyZubster's circular model is intended to preserve the chain from exchange to use, reuse, repair, transfer and evidence-backed end-of-life recovery — without inventing partners, environmental claims or provenance.
