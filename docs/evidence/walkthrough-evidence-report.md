# MyZubster PR #1627: Browser Staging Walkthrough & Visual Verification Evidence

**Repository**: `MyZubster-Ecosystem/myzubster`  
**Pull Request**: [PR #1627: feat(marketplace): simplify navigation to 4 key actions and add featured services showcase (#1626)](https://github.com/MyZubster-Ecosystem/myzubster/pull/1627)  
**Author**: `@wasim-builds`  
**Date**: 28 October 2026  
**Scope**: Complete technical evidence report addressing maintainer review directives: local HTTP staging visual verification, 6-entry-point architecture audit, `/fumetto` route resolution, Contributor Passport roadmap disclosure, real DOM & HTTP assertions, backwards-compatible pagination audit with deterministic tie-breaking, isolated MongoMemoryReplSet 15-step runtime walkthrough, and external Vercel preview authorization status.

---

## 1. Six-Area Gap Audit & Route-Resolution Outcomes

In accordance with maintainer UX clarifications (Comments [#6448786951](https://github.com/MyZubster-Ecosystem/myzubster/pull/1627#issuecomment-6448786951) & [#6448849923](https://github.com/MyZubster-Ecosystem/myzubster/pull/1627#issuecomment-6448849923)), the six core user-facing entry points are structured with Marketplace and Zorgax at highest visibility:

| Area | Entry Point & Route | Link Behavior | Status (Live vs Proposed) | Wiring & Resolution Outcome |
|---|---|---|---|---|
| **1. Marketplace** | `/marketplace` & `/marketplace?action=new` | SPA navigation or direct URL; loads `MarketplacePage` | **LIVE** | Fully operational catalog with category filters, Seller Free onboarding (`action=new`), and direct crypto agreements. |
| **2. Zorgax** | `<ZorgaxAssistant>` floating copilot, header action, and `/zorgax` | Click opens floating chat or direct `/zorgax` | **LIVE** | Prominent in hero (`t.askZorgax`), sticky navbar, and floating FAB with natural language tool routing. |
| **3. Metaverse** | `/metaverse` (Neon Plaza & Space Station) | SPA navigation or direct URL; loads `MetaversePage` | **LIVE** | Interactive 3D virtual world and Space Station accessible in browser without VR headset. |
| **4. GitHub / Passport** | `/social-login` | Sign-in portal with GitHub, Google & password | **LIVE (GitHub login)<br/>PROPOSED (Passport roadmap)** | Honest disclosure: GitHub OAuth is live for developer authentication. Contributor Passport is clearly labeled as an opt-in roadmap (skills, repos, accepted PRs, seller offers) without unverified on-chain governance claims. Existing Google and password auth are fully preserved. |
| **5. Knowledge** | `/conoscenze` (and `/knowledge`) | SPA navigation or direct URL; loads `KnowledgeGraphPage` | **LIVE** | Prominent top-level CTA on homepage linking directly to verified public knowledge graph and evidence articles. |
| **6. Comics** | `/fumetto` (and `/comic`) | SPA route `ComicsPage` + static server fallback `/fumetto.html` | **LIVE** | Added explicit React route `ComicsPage.js` with embedded interactive reader, 13 verified narrative chapters, and token transparency notice distinguishing actual Base Sepolia minted tokens from narrative concept art. |

---

## 2. Verification Surfaces & Evidence Boundaries

To maintain rigorous transparency, this report strictly separates and labels the verification surfaces:

| Surface Layer | Environment | Status | Verification Scope |
|---|---|---|---|
| **Layer 1: Isolated E2E Runtime** | Express + MongoMemoryReplSet | **PASS (15/15)** | Full seller lifecycle, registration, Seller Free activation, service publishing, direct crypto agreement, fail-closed guards, ecosystem routes. |
| **Layer 2: Local HTTP Browser Staging** | Headless Chromium over HTTP (`:5007`, `:5008`) | **PASS (6/6)** | Real HTTP fetches, DOM assertions (6 key actions, comics gallery, load-more, filters, viewport meta), responsive desktop (1280x800) and mobile (375x812) renders. |
| **Layer 3: Pagination Compatibility** | Automated Jest Suite (`marketplacePaginationCompatibility.test.js`) | **PASS (5/5)** | Legacy unpaginated callers (default limit 200 preserved, no silent listing loss), paginated callers (limit 50, page 1/2), deterministic `_id: -1` secondary sort. |
| **Layer 4: Continuous Integration (CI)** | GitHub Actions Head Check Runs | **PASS (100% Green)** | `Test, lint and build`, `Continuous Evidence Gate`, `MYZ-164 Seller Free policy`, `Security Audit` (0 vulnerabilities). |
| **Layer 5: Deployed Vercel Preview** | Vercel External Fork Deployment | **PENDING AUTHORIZATION** | External forks require 1-click authorization by a team member with Vercel team access. |

---

## 3. GET `/api/listings` Backwards-Compatibility Strategy & Audit

### A. Strategy Specification
In response to maintainer review finding #3:
1. **Legacy Unpaginated Callers**: When a client requests `GET /api/listings` without pagination parameters (`limit`, `page`, `skip`), the endpoint retains the legacy default `limit = 200`. This ensures existing callers, scripts, and legacy consumers do not experience silent listing truncation when >50 listings exist.
2. **Paginated Callers**: When pagination parameters are explicitly supplied (e.g. `page=1`, `page=2`, or `skip`), the default page limit is `50` (configurable up to `200`).
3. **Deterministic Secondary Sort**: Queries enforce `.sort({ createdAt: -1, _id: -1 })`. Adding `_id: -1` guarantees stable, deterministic ordering across pages during tie-breaks when multiple listings share identical `createdAt` timestamps.

### B. Client Audit
- **`public/community-marketplace.html`**: Sends explicit pagination parameters `limit=50&page=${targetPage}` and renders the paginated `Carica altri annunci` (Load More) button.
- **`frontend/src/pages/MarketplacePage.js`**: React SPA loads paginated sets via explicit `limit=50&page=${targetPage}` and `hasMore` state.
- **`frontend/src/App.js`**: Fetches featured homepage cards via explicit `limit=6`.
- **Legacy consumers / direct callers**: Callers omitting pagination parameters receive up to `200` items in a single response, preserving complete backwards compatibility.

---

## 4. Real Browser Navigation Assertions (Local HTTP Staging)

Executed via `node scripts/capture-staging-evidence.js` against live local HTTP servers (port 5007 for React SPA build, port 5008 for static public portal). Old screenshots are deleted prior to execution; failures to render or capture fail the script immediately.

| Target Surface | Endpoint | Method / Viewport | Assertions Evaluated | Result |
|---|---|---|---|---|
| **Static Portal Homepage** | `http://127.0.0.1:5008/index.html` | HTTP GET / Desktop & Mobile | HTTP 200, contains 4 primary ecosystem navigation actions (`/community-marketplace.html`, `Marketplace`, `/space-station.html`, `/zorgax.html`) | **PASS** |
| **React SPA Homepage** | `http://127.0.0.1:5007/` | HTTP GET / Desktop & Mobile | HTTP 200, `<div id="root">` mounted, production JS bundle referenced, responsive viewport meta, 6 entry point CTAs | **PASS** |
| **Community Marketplace** | `http://127.0.0.1:5008/community-marketplace.html` | HTTP GET / Desktop & Mobile | HTTP 200, `loadMoreBtn` pagination container, `digital_services` category filter button, mobile viewport meta | **PASS** |
| **Zorgax Assistant Page** | `http://127.0.0.1:5008/zorgax.html` | HTTP GET / Desktop | HTTP 200, interactive assistant portal and onboarding card containers verified | **PASS** |
| **Space Station / Metaverse** | `http://127.0.0.1:5008/space-station.html` | HTTP GET / Desktop | HTTP 200, 3D metaverse canvas and space station gateway verified | **PASS** |
| **Comics Universe Gallery** | `http://127.0.0.1:5007/fumetto.html` | HTTP GET / Desktop & Mobile | HTTP 200, interactive comic reader, GitHub Live Photos integration, and 13 chapters verified | **PASS** |

---

## 5. Visual Staging Render Evidence (Chromium Headless)

All visual artifacts are captured over HTTP and persisted under `docs/evidence/walkthrough-screenshots/`:

| Surface | Desktop (1280x800) | Mobile (375x812) | Local Render Description |
|---|---|---|---|
| **Portal Homepage** | [01-homepage-portal-desktop.png](walkthrough-screenshots/01-homepage-portal-desktop.png) | [02-homepage-portal-mobile.png](walkthrough-screenshots/02-homepage-portal-mobile.png) | Static portal homepage showing 4 key actions, hero section, and community introduction. |
| **Simplified React Homepage (6 CTAs)** | [03-homepage-simplified-desktop.png](walkthrough-screenshots/03-homepage-simplified-desktop.png) | [04-homepage-simplified-mobile.png](walkthrough-screenshots/04-homepage-simplified-mobile.png) | React SPA homepage showing 6 distinct labeled entry points (Marketplace, Zorgax, Metaverse, GitHub/Passport, Knowledge, Comics). |
| **Community Marketplace** | [05-marketplace-catalog-desktop.png](walkthrough-screenshots/05-marketplace-catalog-desktop.png) | [06-marketplace-catalog-mobile.png](walkthrough-screenshots/06-marketplace-catalog-mobile.png) | Marketplace catalog with category filters (`digital_services`), direct listings, and load-more pagination. |
| **Zorgax Assistant** | [07-zorgax-assistant-desktop.png](walkthrough-screenshots/07-zorgax-assistant-desktop.png) | — | Zorgax interactive assistant and character ecosystem preserved. |
| **Metaverse / Space Station** | [08-metaverse-portal-desktop.png](walkthrough-screenshots/08-metaverse-portal-desktop.png) | — | 3D Space Station / Metaverse entry point preserved. |
| **Comics Universe Gallery** | [09-comics-gallery-desktop.png](walkthrough-screenshots/09-comics-gallery-desktop.png) | [10-comics-gallery-mobile.png](walkthrough-screenshots/10-comics-gallery-mobile.png) | Dedicated comics viewer with chapter index, token provenance disclosure, and GitHub Live Photos. |

---

## 6. Live Runtime Walkthrough Results (`npm run walkthrough:seller`)

15/15 lifecycle checks pass against live Express + MongoMemoryReplSet:

1. **Unauthenticated publish guard**: Blocked with HTTP 401 Unauthorized
2. **Seller registration**: User created & auth token issued (HTTP 201)
3. **Commercial publish guard**: Inactive seller blocked with HTTP 402 `SELLER_MEMBERSHIP_REQUIRED`
4. **Validation guard**: Missing title/category rejected with HTTP 400 Bad Request
5. **Seller Free activation**: Free membership activated with HTTP 201 (`SELLER_FREE`, active=true, 0 EUR barrier)
6. **Publish service listing**: Published in `digital_services` with HTTP 201
7. **Public catalog query**: Listing visible in public filtered catalog with HTTP 200
8. **Direct listing access**: Direct GET `/api/listings/:id` returns listing data with HTTP 200
9. **Seller personal dashboard**: GET `/api/listings/mine` returns seller listings with HTTP 200
10. **Owner in-place edit**: PATCH `/api/listings/:id` updates title and price with HTTP 200
11. **Non-owner modification guard**: Unauthorized edit rejected with HTTP 404 (fail-closed, zero data leakage)
12. **Direct crypto agreement**: Direct BTC listing created with HTTP 201 (no mandatory checkout fees)
13. **Backward-compatible pagination**: Legacy unpaginated query returns all 54 items (limit=200); paginated query defaults to limit=50 with page 2 load-more; stable secondary sort on `_id` yields 0 overlapping items
14. **Mobile navigation**: Responsive layout, viewport meta tag, and `loadMoreBtn` verified
15. **Ecosystem routes preserved**: `/api/zorgax/assistant/status` and `/api/gardens` verified HTTP 200

---

## 7. Vercel Preview Authorization Status (External Fork Gate)

On public GitHub repositories, Vercel requires team authorization before deploying commits submitted from outside forks:

- **State**: Pending 1-click authorization by a member of the `Myzubster` team (`team_v975YaotBtK7YDYFscS32wor`).
- **Authorization Request**:
  Team members can authorize the preview build directly via:
  `https://vercel.com/git/authorize?team=Myzubster&slug=myzubster&teamId=team_v975YaotBtK7YDYFscS32wor&type=github&prId=1627&repo=myzubster`
- **Notice**: No production deployment, production merge, or payment is requested or implied. Once authorized by the team, the live preview URL can be checked against all mobile and desktop flows.
