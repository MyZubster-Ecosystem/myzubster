# MyZubster reproducible observation demo

## What this demo proves
This demo shows one narrow public flow: an external person can open a single HTML file in a browser, enter a local observation and generate a structured evidence record without maintainer credentials, API keys, wallets, backend services or local development setup.

It does **not** prove external adoption, production deployment, environmental impact, scientific validation, partnership, endorsement, payment, institutional support or commercial use.

## Source
`demo/observation-demo.html`

## Run it
### Option A — GitHub only
1. Open `demo/observation-demo.html` in the repository.
2. Click **Raw**.
3. Save the file locally as `observation-demo.html`.
4. Open it in any modern browser.

### Option B — fresh clone
```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster
```
Then open `demo/observation-demo.html` in a browser.

No installation command is required.

## Reproducible test
Enter:

- Category: `Water`
- Observation: `I observed a public drinking-water point in use during a local event.`
- Date: any valid date
- Approximate location: `Rimini, Emilia-Romagna, Italy`
- Public evidence: any valid public URL you are authorized to cite

Click **Generate evidence record**.

## Expected result
A JSON object appears with these fields:

- `schema = myzubster.observation.demo.v1`
- `category`
- `observation`
- `date`
- `approximate_location`
- `public_evidence`
- `interpretation`
- `generated_at`
- `demo_only = true`

The page also links to the real public GitHub observation form.

## Failure modes
- Missing observation, date, location or evidence: the demo refuses to generate the record.
- Invalid or inaccessible evidence link: the browser may accept the text, but that does not make the evidence verified. Public verification remains a separate review step.
- Opening the HTML through a restrictive preview renderer may prevent JavaScript from executing; download the raw file and open it locally instead.

## Adoption classification
Maintainer creation or execution of this demo is **not** adoption.

If an external party independently runs, documents, modifies, integrates or deploys it, classify the evidence using the Adoption Radar based on what is actually proven. Only then should a qualifying signal be considered for `ADOPTION.md`.
