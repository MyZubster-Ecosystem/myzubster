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

Configured endpoints require a secret. Each request contains a JSON event with a stable delivery ID, event type, creation timestamp, and event-specific data. Receivers should deduplicate requests using `x-myzubster-delivery`.

The `x-myzubster-signature-256` header contains `sha256=<hex digest>`, calculated with HMAC-SHA256 over the exact JSON request body. Receivers must compare the signature in constant time before processing the event.

Delivery is attempted up to three times with exponential backoff. A failed webhook does not reverse a payment that has already passed independent verification and reached `CONFIRMED`; operators should monitor failed delivery results and retry them through their own durable queue when one is configured.

`payment.confirmed` is emitted by the current payment confirmation service. Escrow and bounty lifecycle services can call `escrowReleased()` and `bountyCompleted()` on the shared dispatcher when those transitions are completed.
