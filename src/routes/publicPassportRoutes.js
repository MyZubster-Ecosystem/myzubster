/**
 * Public Passport Routes
 *
 * Exposes a read‑only endpoint that returns a contributor's public Knowledge
 * Passport **only when** the contributor has explicitly opted‑in.
 *
 * The route follows the privacy‑by‑default contract:
 *   • Unknown or non‑published contributors → 404 (indistinguishable)
 *   • Errors → generic 500 without leaking stack traces or identifiers
 *   • Successful responses contain only the fields defined in the public allow‑list.
 */

const express = require('express');
const router = express.Router();

const publicPassportService = require('../services/publicPassportService');
const consentService = require('../services/consentService');

// ---------------------------------------------------------------------------
// GET /api/passports/:contributorId
// ---------------------------------------------------------------------------
router.get('/api/passports/:contributorId', async (req, res) => {
  const { contributorId } = req.params;

  try {
    // 1️⃣ Verify explicit public consent.
    const hasConsent = await consentService.hasActivePublicConsent(contributorId);
    if (!hasConsent) {
      // Return 404 to avoid enumeration; do not reveal that consent is missing.
      return res.status(404).send();
    }

    // 2️⃣ Load the public passport (already filtered by the service).
    const passport = await publicPassportService.getPublicKnowledgePassport(contributorId);

    if (!passport) {
      // Either the passport does not exist or the allow‑list removed everything.
      // Treat both cases as 404 for privacy.
      return res.status(404).send();
    }

    // 3️⃣ Send the sanitized public representation.
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return res.json(passport);
  } catch (err) {
    // Log the error internally but keep the response generic.
    console.error('Error in publicPassportRoutes:', err);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
