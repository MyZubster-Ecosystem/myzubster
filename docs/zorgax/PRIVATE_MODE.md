# Zorgax Privato

The assistant service and `/api/zorgax/assistant/chat` default to `privacyMode: "private"`.
Complexity, paid plans, configured OpenAI keys and `useWeb: true` do not override it.
Private requests call loopback Ollama directly; they do not call the public AI gateway,
OpenAI, Brave, Tavily or Wikipedia. Failure returns an error without an external fallback.

External processing requires both `privacyMode: "external"` and `externalConsent: true`.
The main `/zorgax` UI explains recipients before consent, starts unchecked on every
page load, clears transmitted history on either mode change and supports revocation.
Web search remains a separate checkbox. Automatically enriched account context is
excluded from external requests. OpenAI requests set `store: false`; this is not a
guarantee of zero provider retention. Audit provider terms/settings separately.

## Deployment requirement

Run the assistant backend and a local-only Ollama instance on the same server:

```
ZORGAX_PRIVATE_OLLAMA_URL=http://127.0.0.1:11434
ZORGAX_PRIVATE_OLLAMA_MODEL=qwen2.5:3b
```

Only literal IPv4/IPv6 loopback endpoints are accepted; redirects are rejected.
Use a locally downloaded model, disable Ollama cloud functionality and enforce an
egress policy preventing Ollama from forwarding requests. Cloud model names are
also rejected by the service; model aliases and server configuration still require
operator verification. Install models before the private processing acceptance test.
A Vercel function cannot reach Ollama on a separate VPS via its own loopback address.
Deploy this backend alongside Ollama before claiming the private chat is available.
Do not replace the private endpoint with an external gateway to work around failure.

## Scope and remaining work

Private means no prompt sent to external AI/search providers by this assistant flow.
The browser still sends messages to MyZubster. Hosting access, reverse proxy logs,
browser storage in profile onboarding, backups and retention require separate audit.
Other legacy chat endpoints, research APIs and integrations are not certified private
by this change. Telegram/Messenger callers of this service also default to local-only.
Gmail/onboarding callers without a mode default to private, including private context.

The GDPR AI processing inventory/retention task remains open. This change does not
claim legal compliance, anonymity, zero logging or a verified production deployment.
Release gate: verify loopback deployment, no Ollama cloud/egress, external consent,
revocation, local downtime and upstream logs using synthetic messages only.

Validation: `npm test -- --runInBand test/zorgaxPrivateMode.test.js`.
