const express = require('express');

const router = express.Router();

/*
 * Local MyZubster ledger API.
 *
 * Accounting boundary:
 * these records represent internal accounting/provenance only.
 * They are not blockchain balances, legal ownership or payments.
 *
 * Start read-only and empty. Real events can be connected later
 * to the canonical ledger only after provenance is verified.
 */
const events = [];

router.get('/', (_req, res) => {
  res.json({
    success: true,
    readOnly: true,
    events
  });
});

router.get('/revenue', (_req, res) => {
  res.json({
    success: true,
    readOnly: true,
    events: events.filter(
      (event) => event.event_type === 'REVENUE'
    )
  });
});

router.get('/assets', (_req, res) => {
  res.json({
    success: true,
    readOnly: true,
    events: events.filter(
      (event) => event.event_type === 'ASSET_CREATED'
    )
  });
});

router.get('/balances', (_req, res) => {
  const balances = new Map();

  for (const event of events) {
    if (event.event_type !== 'REVENUE') continue;
    if (event.status && event.status !== 'RECORDED') continue;

    for (const allocation of event.allocations || []) {
      const participantId = allocation.participant_id;
      const currency = event.currency || 'EUR';

      if (!participantId) continue;

      const calculated =
        event.calculated_amounts &&
        event.calculated_amounts[participantId];

      const amount = Number.isFinite(Number(calculated))
        ? Number(calculated)
        : Number(event.amount || 0) *
          Number(allocation.percentage || 0) / 100;

      if (!balances.has(participantId)) {
        balances.set(participantId, {
          participant_id: participantId,
          balances: {},
          by_source: {}
        });
      }

      const participant = balances.get(participantId);

      participant.balances[currency] =
        (participant.balances[currency] || 0) + amount;

      const source = event.source || 'unknown';

      participant.by_source[source] ||= {};
      participant.by_source[source][currency] =
        (participant.by_source[source][currency] || 0) + amount;
    }
  }

  res.json({
    success: true,
    readOnly: true,
    participants: Array.from(balances.values())
  });
});

module.exports = router;