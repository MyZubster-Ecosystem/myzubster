# N4K48 outbound catalog agent — offline correction checkpoint

This opt-in agent originates from the package sent to Nicola on 4 October 2026. Original agent SHA-256: `79ae718b1b9aad714fe7521e77bd2b5c9c3c2ff0ce248f0d7b03b3db67f5ea34`.

Updated agent SHA-256: `75ab34d21f668fa48383ac7070c717b074c868694c3042928e4532b5ccd34fa1`.

## Changes

- Gallery returns up to four titles (bounded current pilot catalogue); detail returns at most one. Titles remain limited to 140 characters and other source fields are not forwarded.
- Missing/invalid job id or lease_id skips local catalog access and result submission; the broker owns expiry/reassignment.
- Correlatable jobs with invalid actions/IDs produce generic errors without querying the local catalog.
- Non-object responses, absent/non-list sources and malformed source entries produce a generic catalog error. An explicit empty sources list is a valid empty catalogue.
- Local network timeouts produce an error result if the result endpoint is reachable. Poll/result transport or JSON failures do not terminate polling and are not reported as success.
- Errors contain no raw exception messages or credentials.

## Offline verification

Python 3.9+ standard library only. From the repository root:

```sh
python -m unittest discover -s integrations/contributors/n4k48-agent/bridge -p 'test_agent.py' -v
```

13 test methods passed using mocked exchanges, with parameterized malformed-input/network cases. These are our regression tests, separate from Nicola's original 13 characterization tests. No real token, VPS request or long-running agent loop was used.

## Activation boundary

Do not start before consent, scope agreement and review of the deployed broker contract. Configuration retains BRIDGE_URL (HTTPS), BRIDGE_NODE_TOKEN and LOCAL_CATALOG_API (local default http://127.0.0.1:5000). Do not include secret values in commits, email or logs. ALLOW_LOOPBACK_TEST=true is only for explicit local broker tests.

The response envelope retains id, lease_id and result, and endpoints remain /node/next and /node/result. The deployed broker still needs compatibility checks for four titles, generic job errors, lease expiry/reassignment and stale-result rejection. Result transport failure is not blindly retried. Offline success does not prove authenticated VPS–PC interoperability.

Nicola should verify the new file hash and repeat offline tests before any authenticated session. Record the exact agent and local catalogue commits, expected/actual responses and sanitized timing/correlation evidence. No code here provisions credentials or alters the VPS.
