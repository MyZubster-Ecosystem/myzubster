# Aming9303 signed payment webhook verifier

Independent verifier for the merged signed lifecycle webhook contribution.

Canonical contribution:

- PR: `MyZubster-Ecosystem/myzubster#891`
- contributor commit: `cee464b6a69e621442b30a57d2d56933988827e2`
- merge commit: `be78e0cf9081c3346aa0c61e022acd297d745619`

## Targeted behavior

The verifier reruns bounded current-main checks for:

- HMAC-SHA256 signature generation on the exact event body;
- stable delivery ID across a transient retry;
- rejection of configured endpoints without a signing secret;
- delivery-ID binding + one-time replay claim;
- timestamp-window rejection before replay-store mutation.

## Run on VPS

```bash
python3 integrations/contributors/aming/verifier_check.py
```

## Boundary

A `TESTED` result means only that this signed-webhook behavior was independently reproduced on the checked-out MyZubster code.

It does not validate an external receiver deployment, payment settlement, wallet security, production delivery guarantees, or broader application security.
