# Meta Messenger Operations Runbook

Status: Production operations guide  
Scope: MyZubster Community Facebook Page ↔ Zorgax bridge  
Related architecture document: `docs/META_MESSENGER_ZORGAX_BRIDGE.md`

## 1. Purpose

This runbook is the short operational companion to the full Messenger bridge architecture document. Use it when deploying, testing, monitoring, troubleshooting, rotating credentials, or responding to incidents affecting the MyZubster Community Facebook Messenger integration.

It intentionally focuses on actions and checks rather than architecture background.

## 2. Production endpoints

```text
Webhook:
https://www.myzubster.com/api/meta/messenger/webhook

Status:
https://www.myzubster.com/api/meta/messenger/status

Comic Universe:
https://www.myzubster.com/fumetto

Marketplace:
https://www.myzubster.com/marketplace
```

## 3. Required production environment variables

The Messenger bridge depends on these Meta-related variables:

```text
META_WEBHOOK_VERIFY_TOKEN
META_APP_SECRET
META_PAGE_ACCESS_TOKEN
META_GRAPH_API_VERSION
```

Never place the actual values in Git, docs, PR comments, screenshots, public logs, chat transcripts, or support tickets.

If any production token or secret is exposed, treat it as compromised and rotate it.

## 4. Normal operating state

The integration should be considered healthy when all of the following are true:

- production deployment is successful;
- `GET /api/meta/messenger/status` returns `ok: true`;
- `configured` is true;
- `autoReplyAllInbound` is true;
- supported inbound events include message, quick reply, postback and attachment;
- Meta webhook subscription remains active for the Page;
- a real profile can send a Page message and receive an automatic Zorgax reply;
- runtime logs show `message_handled`;
- no recurring `Meta Send API` error is present;
- no echo loop occurs.

## 5. Fast production smoke test

After every Messenger-related production deployment, run this sequence.

### Test A — basic message

Send from a non-Page Facebook profile:

```text
Ciao Zorgax
```

Expected:

- webhook receives the event;
- Zorgax replies automatically;
- reply language is Italian;
- runtime logs include `message_handled`.

### Test B — multi-turn context

Send:

```text
Voglio diventare Seller
```

Then:

```text
Quanto costa?
```

Expected:

- Zorgax understands that `Quanto costa?` refers to Seller;
- it does not invent fees or commissions;
- it states the configured default Seller price carefully;
- it points the user to Marketplace for live verification.

### Test C — Comic media

Send:

```text
Mostrami il fumetto di MyZubster
```

Expected:

- deterministic Comic route is selected;
- image delivery is attempted;
- text links to `https://www.myzubster.com/fumetto`;
- fiction/concept content is not described as real-world evidence;
- logs expose `imageSent`.

### Test D — alternate inbound shapes

Test at least one of:

- quick reply;
- Page postback/button;
- attachment-only message.

Expected: the event is normalized and receives an automatic response instead of being silently dropped.

## 6. Runtime log patterns

Search for the prefix:

```text
[meta-messenger]
```

Healthy examples:

```text
{"event":"message_handled","mode":"zorgax"}
```

or:

```text
{"event":"message_handled","mode":"comic-deterministic","comicImage":true,"imageSent":true}
```

Important error patterns:

```text
Meta Send API
comic_image_send_failed
fallback_send_failed
Zorgax ha restituito una risposta vuota
```

Remember:

```text
POST /api/meta/messenger/webhook 200
```

does not by itself prove that a Messenger reply was delivered.

## 7. Incident: user sends a message but gets no automatic reply

Check in this order:

1. Confirm the message was sent to the MyZubster Community Page, not a personal Facebook profile.
2. Check Vercel runtime logs for `POST /api/meta/messenger/webhook` around the message time.
3. If there is no webhook POST, inspect Meta Page/app webhook subscription state.
4. If there is a webhook POST but no `message_handled`, inspect whether the event was ignored as an echo, duplicate, or unsupported event shape.
5. If `message_handled` appears, search the same time window for `Meta Send API` errors.
6. Confirm `META_PAGE_ACCESS_TOKEN` is current and belongs to the intended Page/app relationship.
7. Confirm the latest production deployment contains the expected Messenger bridge code.

## 8. Incident: webhook verification fails

Symptom:

```text
GET /api/meta/messenger/webhook → 403
```

Check:

- callback URL is exactly the production webhook URL;
- Meta verify token and `META_WEBHOOK_VERIFY_TOKEN` correspond;
- the environment variable exists in Production;
- a redeploy has occurred after changing the variable when required;
- Meta is sending `hub.mode=subscribe`.

Do not put the actual verify token in logs while troubleshooting.

## 9. Incident: webhook POST returns 401

Likely cause: signature verification failure.

Check:

- `META_APP_SECRET` is correct for the active Meta app;
- request raw-body handling has not changed;
- the request is reaching the correct route;
- no proxy/middleware is mutating the body before signature validation;
- the Meta app configuration points to the intended production app.

Do not disable signature validation to make the webhook pass.

## 10. Incident: Messenger receives duplicate Zorgax replies

The bridge contains a warm-instance deduplication layer.

Check:

- runtime logs for repeated delivery of the same Meta event;
- whether duplicates occur across different Vercel instances;
- whether the Page is subscribed through more than one app/webhook path;
- whether an old integration is still active.

Current deduplication is local to a warm instance, so distributed duplicate suppression is not guaranteed across serverless instances.

If duplicates become a recurring production problem, move idempotency to a shared persistent store.

## 11. Incident: Zorgax replies to its own messages

The bridge ignores Messenger echo events through `event.message.is_echo`.

If a loop occurs:

- inspect the raw event shape;
- verify Meta is still marking Page-generated messages as echoes;
- check that echo filtering remains active in the deployed route;
- immediately stop the loop by disabling the affected integration path if needed before debugging further.

Never solve this by blindly suppressing all repeated text, because legitimate users may send the same message twice.

## 12. Incident: Comic text arrives but no image

Check runtime logs for:

```text
comic_image_send_failed
```

and the `imageSent` field.

Then verify:

- selected image URL is publicly reachable;
- Meta can fetch the image URL without authentication;
- image format is supported;
- Page Access Token still permits Messenger sends;
- the Comic asset still exists in its source repository.

The text response should continue even if the image send fails.

## 13. Incident: wrong Comic answer

For explicit Comic requests, the deterministic route should take precedence over generic Zorgax generation.

If Zorgax says the Comic Universe is unavailable:

- confirm the production code includes the deterministic Comic route;
- verify the message matches Comic intent detection;
- check that the event is not being transformed into an unexpected prompt before routing;
- verify `https://www.myzubster.com/fumetto` is still the canonical public route.

Do not fix this by merely adding persuasive language to the LLM prompt if the application already knows the correct state. Prefer deterministic application truth.

## 14. Incident: unsupported Seller pricing or commercial claims

Examples of unacceptable behavior:

- inventing a registration fee;
- claiming Seller is free when configuration says otherwise;
- inventing commissions;
- inventing payment fees;
- inventing discounts or refund terms.

Operational response:

1. capture the exact user prompt and Zorgax answer without exposing personal data;
2. verify the current application-backed Seller configuration;
3. correct the grounded channel rules or deterministic application data;
4. test `Voglio diventare Seller` → `Quanto costa?` again;
5. deploy only after the answer is grounded and consistent.

## 15. Incident: attachment-only message receives no reply

The current bridge supports attachment-only events by passing Zorgax a safe summary of attachment types.

If no reply is sent:

- confirm the event contains `message.attachments`;
- verify the attachment event is not an echo;
- inspect normalization logs/source;
- confirm the deployed code includes attachment handling.

The bridge must not pass private attachment URLs to Zorgax unless a future implementation explicitly supports secure media analysis.

## 16. Incident: Zorgax unavailable

If the main Zorgax processing fails, the bridge attempts a fallback Messenger response.

Check for:

```text
fallback_send_failed
```

If both Zorgax and fallback sends fail, prioritize the Meta Send API/Page token path first.

If Meta Send succeeds but Zorgax fails, inspect Zorgax service dependencies separately.

## 17. MongoDB-related errors

Some Zorgax/application flows may depend on MongoDB. Historical production failures have included Atlas connection timeouts/server-selection failures.

If Messenger handling is blocked by database connectivity:

- inspect runtime logs for MongoDB timeout/server-selection errors;
- verify Atlas network access configuration;
- verify connection string and credentials in the production environment;
- distinguish a transient connection timeout from a persistent configuration issue;
- do not expose the MongoDB URI while troubleshooting.

## 18. Credential rotation procedure

Use this procedure whenever a Meta secret/token must be rotated.

### Page Access Token

1. Generate/retrieve a new valid Page Access Token through the approved Meta flow.
2. Update `META_PAGE_ACCESS_TOKEN` in the production hosting environment.
3. Redeploy if required by the hosting platform.
4. Run the basic Messenger smoke test.
5. Revoke the old token if it remains active.

### Meta App Secret

1. Rotate the secret in Meta if required.
2. Update `META_APP_SECRET` in production.
3. Redeploy.
4. Verify webhook POST signature validation succeeds.
5. Confirm Messenger send still works.

### Webhook Verify Token

1. Generate a new high-entropy value.
2. Update `META_WEBHOOK_VERIFY_TOKEN` in production.
3. Update the matching verify token in Meta webhook configuration.
4. Re-run webhook verification.
5. Ensure old values are no longer used anywhere.

## 19. Deployment checklist

Before merge:

- code review or self-review completed;
- no secrets present in diff;
- tests updated for changed Messenger behavior;
- Vercel preview/check is green;
- deterministic application facts remain grounded.

After merge:

- production deployment is successful;
- status endpoint is healthy;
- basic message test passes;
- one alternate inbound event test passes;
- runtime logs show `message_handled`;
- no recurring Send API error appears.

For Comic-related changes, also run the Comic media smoke test.

For Seller-related changes, also run the multi-turn pricing smoke test.

## 20. Rollback criteria

Consider rolling back the latest Messenger deployment if any of these occur immediately after release:

- webhook POSTs consistently return 401/5xx;
- Page messages stop receiving replies;
- Zorgax creates an echo loop;
- Meta Send API fails for all users;
- deterministic routes regress into known hallucinations;
- duplicate replies become widespread;
- a security control was accidentally removed.

Rollback should restore the last known healthy production commit, then the incident should be analyzed separately.

## 21. Data and privacy handling

Operational logs should avoid unnecessary personal content.

Current protections include:

- sender IDs are hashed for conversation-memory keys;
- attachment URLs are not passed into Zorgax by the bridge;
- secrets/tokens are environment variables;
- echo and duplicate controls reduce unintended repeated processing.

When sharing logs in issues or support channels, redact:

- Page/user access tokens;
- app secrets;
- verify tokens;
- database credentials;
- personal message content not required for diagnosis;
- private attachment URLs.

## 22. Known operational limitations

- conversation memory is warm-instance only;
- deduplication is warm-instance only;
- attachment contents are not analyzed;
- Facebook personal-profile private messages are outside this bridge;
- Meta permissions, Page access, Graph API behavior and platform policy can change independently of the codebase;
- the current bridge is optimized for Page conversations and known MyZubster product routes, not arbitrary omnichannel messaging.

## 23. Escalation decision tree

```text
No reply from Messenger?
   ↓
Did webhook POST arrive?
   ├─ No → Meta subscription / Page configuration
   └─ Yes
       ↓
Was event normalized?
       ├─ No → event shape / echo / duplicate / unsupported type
       └─ Yes
           ↓
Did message_handled appear?
           ├─ No → Zorgax/application processing
           └─ Yes
               ↓
Did Meta Send API succeed?
               ├─ No → Page token / Meta Send API
               └─ Yes → inspect Messenger delivery/client behavior
```

## 24. Routine maintenance

Recommended recurring checks:

- verify Meta webhook subscription after major Meta app changes;
- rotate exposed or suspicious credentials immediately;
- review runtime errors after Messenger-related deployments;
- keep Graph API version strategy current;
- re-test known deterministic routes when product URLs or pricing change;
- migrate conversation memory/deduplication to shared storage if operational volume makes warm-instance behavior insufficient;
- keep this runbook synchronized with `META_MESSENGER_ZORGAX_BRIDGE.md`.

## 25. Related development history

Key PRs behind the current production bridge:

```text
#1007  keep Zorgax processing alive after webhook acknowledgement
#1008  improve Messenger conversation quality and context
#1009  ground Seller pricing answers
#1010  connect Comic Universe images
#1011  prioritize public Comic Universe responses
#1014  auto-reply to all supported Page inbound events
#1015  document Meta Messenger ↔ Zorgax architecture
```

When future PRs materially change operations, add them here and update the relevant incident procedure.
