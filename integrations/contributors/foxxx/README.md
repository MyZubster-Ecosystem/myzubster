# foxxx009 KPI/evidence verifier

Independent verifier for the merged KPI, baseline, evidence/provenance and report framework contributed in PR #894.

Canonical contribution:

- PR: `MyZubster-Ecosystem/myzubster#894`
- contributor commit: `70cb32c6500525df4056859525fe215b95188a02`
- merge commit: `50f70aab6dc9a909f65b81cb70d932706143afec`

## Targeted VPS behavior

The verifier checks that current MyZubster code:

- keeps the synthetic-data disclaimer;
- separates baseline and pilot records correctly;
- generates JSON and Markdown reports;
- preserves evidence/provenance references;
- surfaces missing data instead of fabricating a value;
- does not generate EU funding / official-approval claims from the synthetic fixture.

## Run

```bash
python3 integrations/contributors/foxxx/verifier_check.py
```

## Boundary

A `TESTED` result covers only this deterministic software/reporting checkpoint using synthetic repository data.

It does not validate real-world measurements, scientific impact, environmental claims, EU LIFE participation, funding, endorsement, certification or production deployment.
