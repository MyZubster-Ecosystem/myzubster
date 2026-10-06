# Payment webhooks

MyZubster can notify external systems after these lifecycle events:

- `payment.confirmed`
- `escrow.released`
- `bounty.completed`

Set a comma-separated endpoint list and a signing secret:

```text
PAYMENT_WEBHOOK_URLS=https://example.org/myzubster/events
PAYMENT_WEBHOOK_SECRET=replace-with-a-long-random-secret
```

Configured endpoints require a secret. Each request contains a JSON event with a stable delivery ID, event type, creation timestamp, and event-specific data.

The `x-myzubster-signature-256` header contains `sha256=<hex digest>`, calculated with HMAC-SHA256 over the exact raw JSON request body. Receivers must compare the signature in constant time before processing the event.

Receivers must enforce all of these replay controls before applying side effects:

1. verify the signature against the unmodified raw request body;
2. require `x-myzubster-delivery` to match the signed event `id`;
3. reject events more than five minutes old or more than five minutes in the future;
4. atomically claim the delivery ID in a durable store and reject an ID that was already claimed.

`PaymentWebhookVerifier` implements the signature, timestamp, header binding, and replay checks. Its `replayStore.claim(deliveryId, expiresAt)` dependency must perform an atomic insert-if-absent operation in a shared durable store such as Redis or a database. It returns `true` only for the first delivery. The verifier uses `crypto.timingSafeEqual` for the signature comparison.

Delivery is attempted up to three times with exponential backoff for network failures, timeouts, HTTP 408/429, and 5xx responses. Other 4xx responses are treated as permanent and are not retried. A failed webhook does not reverse a payment that has already passed independent verification and reached `CONFIRMED`; the confirmation records a `metadata.webhookDelivery` outcome without returning a failed payment response.

`payment.confirmed` is emitted by the current payment confirmation service. Escrow and bounty lifecycle services can call `escrowReleased()` and `bountyCompleted()` on the shared dispatcher when those transitions are completed.
