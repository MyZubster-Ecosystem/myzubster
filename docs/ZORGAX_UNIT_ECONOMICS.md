# Zorgax unit economics configuration

Zorgax can calculate monthly gross revenue, provider costs, estimated Stripe fees and net margin from verified subscription payments.

Configure monthly provider costs in the deployment environment:

```text
ZORGAX_MONTHLY_COSTS_JSON={"openai_api":0,"chatgpt":0,"vercel":0,"aruba":0,"canva":0,"database":0,"storage":0,"monitoring":0,"email":0,"other":0}
ZORGAX_STRIPE_FEE_PERCENT=0
ZORGAX_STRIPE_FEE_FIXED_EUR=0
```

Use actual invoice totals. ChatGPT subscriptions and OpenAI API usage are separate cost centres. Never put API keys or invoice documents in these variables.

An authenticated administrator can request:

```text
GET /api/zorgax/monetization/economics?month=YYYY-MM
```

The response includes gross revenue, costs by provider, estimated Stripe fees, net margin, margin percentage, averages per paid customer, and a sustainability warning.

Stripe fee values are configurable estimates for management reporting. Authoritative accounting should reconcile the report against Stripe balance transactions and supplier invoices. EU VAT/tax treatment must be configured only after the relevant tax registrations and professional accounting review are confirmed.
