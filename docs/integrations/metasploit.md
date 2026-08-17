# Metasploit Framework integration

MyZubster can consume findings produced by an authorized Metasploit Framework assessment environment.

Upstream project: https://github.com/rapid7/metasploit-framework

## Scope

The first integration is **report-import only**. MyZubster does not start `msfconsole`, execute Metasploit modules, deliver payloads, or expose an exploitation API.

This keeps the integration suitable for importing results from a separately controlled security-testing environment.

## Enable

Set:

```env
METASPLOIT_INTEGRATION_ENABLED=true
```

The integration is disabled by default.

## Endpoints

### Status

`GET /api/security/metasploit/status`

Returns provider, enabled state, and confirms that execution is disabled.

### Import findings

`POST /api/security/metasploit/import`

Example payload:

```json
{
  "findings": [
    {
      "id": "example-check",
      "name": "Example finding",
      "severity": "medium",
      "host": "192.0.2.10",
      "port": 443,
      "protocol": "tcp",
      "cve": "CVE-2025-0000",
      "description": "Example finding from an authorized assessment"
    }
  ]
}
```

The route normalizes findings and returns them with `source: "metasploit"`. Persistence and downstream remediation can be added separately.

## Security requirements

- Run assessments only against assets for which authorization exists.
- Keep the integration disabled unless it is needed.
- Do not place Metasploit credentials, RPC tokens, payloads, or private keys in the repository.
- Treat imported findings as untrusted input and validate them before persistence or automation.
- Any future active-control integration must add explicit authorization, target allowlisting, audit logging, and a separate approval workflow.
