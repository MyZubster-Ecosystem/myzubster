# Independent Adoption Smoke Demo

This demo is intentionally small enough for an external developer to clone and run without special MyZubster access.

It validates three separate boundaries:

1. the published MyZubster technical identity artifact can be checked locally;
2. the signed technical credential verifier test suite passes locally;
3. optionally, a running MyZubster Gateway can be checked through its public `/api/health` endpoint.

## Requirements

- Git
- Node.js 20+ (Node.js 24 is the repository target)
- network access only if the optional Gateway health check is used

No production credentials, wallet seeds, private signing keys or privileged MyZubster account are required for the local verification steps.

## Clone and run

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster
node examples/independent-adoption-smoke/run.mjs
```

The command fails closed if either the identity-artifact verifier or the signed-credential tests fail.

## Optional Gateway check

Point the same demo at a Gateway instance you control or are authorized to test:

```bash
MYZUBSTER_GATEWAY_URL=https://your-authorized-gateway.example \
  node examples/independent-adoption-smoke/run.mjs
```

The demo performs only:

```text
GET /api/health
```

with a 10-second timeout. It does not authenticate, create orders, initiate payments, test third-party systems or submit any state-changing request.

## What counts as useful external evidence

An independent developer can create stronger adoption evidence by publishing, in a repository they control:

- the exact MyZubster commit SHA tested;
- the command used;
- pass/fail output with secrets removed;
- their own integration code, if any;
- the date of the run;
- for Gateway checks, the deployment/operator they are authorized to test.

A reproducible run is stronger than a star or untouched fork. A third-party repository that actually imports MyZubster code/API/data, or an independently operated deployment, may qualify for `INTEGRATION` or `DEPLOYMENT` after verification.

## Evidence boundaries

Passing this demo proves only that the referenced technical checks are reproducible in the tester's environment. It does **not** prove:

- legal or government identity;
- partnership or endorsement;
- payment, token issuance or settlement finality;
- commercial adoption;
- ownership or control of a third-party deployment.

Report independent-use evidence through a public issue or repository link so it can be evaluated by the MyZubster Adoption Radar.
