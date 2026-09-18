# Zorgax AI model router

Zorgax keeps ordinary chat on the existing local Ollama model and may escalate complex work to GPT-6 Astra.

## Environment

- `ZORGAX_ASTRA_ENABLED=true` enables Astra routing.
- `ZORGAX_ASTRA_MODEL=gpt-6-astra` selects the remote model.
- `ZORGAX_ASTRA_MONTHLY_BUDGET_USD=25` sets the application-side monthly guard.
- `OPENAI_API_KEY` must be configured only in the deployment secret store, never committed.

The router classifies research, coding/deployment and long multi-step requests as complex. When Astra is disabled or the application budget is exhausted, it falls back to Ollama.

## Important

The budget guard must be fed with persisted monthly usage before production activation. The router module includes `estimateAstraCost()` for usage accounting, but this PR deliberately does not enable paid API calls until persistent accounting and the deployment secret are connected.
