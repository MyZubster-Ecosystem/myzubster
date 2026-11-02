# Marketplace E2E QA Checklist & Production Release Gate

**Status**: Verified & Passing (Anteprima / Preview `test/integration-wasim-google-oauth-20261101`)  
**Associated Issues**: #1686, #1687, #1685, #1684, #1683, #1680  
**Associated PRs**: #1688, #1689, #1690  

---

## 1. Automated Test Suite Matrix

All automated QA tests run in isolation with in-memory MongoDB without requiring external services or cloud spend.

| Test Suite | Purpose | Tests | Status |
|---|---|---|---|
| `tests/marketplaceE2EQA.test.js` | Complete end-to-end lifecycle, IDOR guards, duplicate prevention, chat, unread counts, terminal transitions, and proxy headers | 29/29 | 🟢 PASS |
| `tests/marketplaceUnreadMessages.test.js` | Unread message endpoint, aggregation, authorization, per-order isolation, and rate limiting | 10/10 | 🟢 PASS |
| `tests/marketplaceFlow.test.js` | Order creation and listing verification | 3/3 | 🟢 PASS |
| `tests/marketplaceSellerLifecycle.test.js` | Free seller activation, funnel events, and listing management | 10/10 | 🟢 PASS |
| `tests/marketplaceCategoryMapping.test.js` | Category resolution and catalog normalization | 4/4 | 🟢 PASS |
| `tests/marketplaceCustomCategoriesKnowledge.test.js` | User-submitted custom categories and knowledge reviews | 3/3 | 🟢 PASS |
| `tests/marketplacePaginationCompatibility.test.js` | Pagination cursor compatibility and legacy schema safety | 3/3 | 🟢 PASS |
| `tests/marketplaceEvidence.test.js` | Evidence audit trails for community actions | 2/2 | 🟢 PASS |
| `frontend/src/pages/MarketplacePage.test.js` | Accessible status badges, confirmation dialogs, post-ACCEPTED guidance, unread badges, and 5-language localization | 44/44 | 🟢 PASS |

---

## 2. Feature-by-Feature QA Verification Checklist

### A. Authentication & Access Control (IDOR Protection)
- [x] **401 Unauthorized Enforced**:
  - `POST /api/marketplace/orders` rejects unauthenticated callers.
  - `GET /api/marketplace/orders/mine` rejects unauthenticated callers.
  - `PATCH /api/marketplace/orders/:id/status` rejects unauthenticated callers.
  - `GET /api/marketplace/orders/messages/unread` rejects unauthenticated callers.
  - `GET /api/marketplace/orders/:id/messages` rejects unauthenticated callers.
  - `POST /api/marketplace/orders/:id/messages` rejects unauthenticated callers.
- [x] **IDOR Guards (Bystander Isolation)**:
  - Bystander (Account C) cannot view orders belonging to Account A and B via `/api/marketplace/orders/mine`.
  - Bystander cannot read messages via `GET /api/marketplace/orders/:id/messages` (returns HTTP 403 `Conversazione non autorizzata`).
  - Bystander cannot send messages via `POST /api/marketplace/orders/:id/messages` (returns HTTP 403 `Conversazione non autorizzata`).
  - Bystander cannot change status via `PATCH /api/marketplace/orders/:id/status` (returns HTTP 403 `Operazione non autorizzata`).
  - Bystander querying `GET /api/marketplace/orders/messages/unread` receives strictly `{ totalUnread: 0, byOrder: {} }`.

### B. Order Request & Creation Flow
- [x] **Self-Request Prevention**: Seller attempting to request their own listing receives HTTP 400 (`Non puoi richiedere il tuo stesso annuncio`).
- [x] **Stock Validation**: Requesting quantity greater than available stock receives HTTP 400 (`Quantità superiore alla disponibilità`).
- [x] **Duplicate Request Debounce & Guard**: Concurrent duplicate request for the same listing while in `REQUESTED` or `ACCEPTED` status receives HTTP 409 (`Hai già una richiesta aperta per questo annuncio`).
- [x] **Listing State Updates**: When all available stock is consumed upon seller acceptance, the listing automatically transitions to `closed`.

### C. Order Status Transitions & Confirmation UX
- [x] **High-Contrast Human-Readable Status Badges**:
  - `REQUESTED` -> ⏳ *In attesa di approvazione*
  - `ACCEPTED` -> 🤝 *Richiesta accettata*
  - `COMPLETED` -> ✓ *Scambio completato*
  - `REJECTED` -> ✕ *Richiesta rifiutata*
  - `CANCELLED` -> 🚫 *Richiesta annullata*
- [x] **Confirmation Prompts**: Browser confirmation prompt prevents accidental state transitions before `REJECTED`, `CANCELLED`, or `COMPLETED`.
- [x] **State Persistence**: Order states and role perspectives (`BUYER` vs `SELLER`) remain consistent across browser reloads.
- [x] **Post-ACCEPTED Contextual Guidance**: Cards guide both parties to coordinate handover/delivery details via order chat.
- [x] **Stock Restoration on Cancellation**: If an `ACCEPTED` order is subsequently cancelled, listing stock is restored and set back to `active`.

### D. Bidirectional Chat & Unread Notifications
- [x] **Private Order Chat**: Bidirectional communication strictly scoped to buyer and seller of that order.
- [x] **Unread Badge Synchronization**:
  - Seller sends message -> Buyer's unread counter increments by 1; Seller's unread is 0.
  - Opening the order conversation automatically marks recipient's unread messages as read (`readAt: new Date()`) and resets the badge counter to 0.
  - Non-aggressive polling (window focus + 45s interval, suspended when document is hidden).
- [x] **Terminal Conversation Guards**: Orders in `REJECTED` or `CANCELLED` state block new messages with HTTP 409 (`La conversazione di questo scambio è chiusa`).

### E. Rate Limiting & Reverse Proxy Compatibility
- [x] **Proxy Header Resilience**: `X-Forwarded-For` headers from Vercel / Nginx reverse proxies are parsed without crash or rate limiter IP confusion.
- [x] **Rate Limiters Active**:
  - `unreadLimiter` (120 req/min).
  - `messageLimiter` (30 req/min).
  - `mutationLimiter` (20 req/min).

### F. Non-Monetary & Community Safety Guarantee
- [x] **Zero Real Payment Execution**: Direct community exchanges preserve `exchangeMode` (`gift` / `payment` / `barter`) without calling external payment providers, Stripe, PayPal, or invoking unvalidated smart contracts/escrow.
- [x] **Clear Transparency Notice**: Informational banner informs users that automated checkout and escrow remain unvalidated in preview and agreements are direct between community members.

---

## 3. Pre-Merge Production Release Gates

Before merging into the production branch (`main`):

1. **Independent Maintainer Code Review**:
   - Verification of MongoDB aggregation queries in `src/routes/marketplaceTrustRoutes.js`.
   - Security audit of role checks and IDOR guards in `participantOrder`.
2. **Preview Integration Branch Verification**:
   - Verify on live Vercel preview deployment using two real Google test accounts.
   - Confirm unread badge dynamic updates on mobile browsers (iOS Safari, Android Chrome).
3. **Audit Log & Activity Recording**:
   - Confirm admin notifications and funnel telemetry events are recorded without leaking personal message contents or sensitive personal data.
