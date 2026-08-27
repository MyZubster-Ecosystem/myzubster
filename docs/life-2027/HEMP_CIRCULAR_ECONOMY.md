# Life — Hemp Circular Economy & Regulated Compliance

## Scope

This module extends MyZubster Life with a hemp circular-economy track focused on industrial hemp, reuse, material recovery, traceability and measurable environmental outcomes.

The module also defines a compliance-only registry for regulated cannabinoid operators. It does not itself authorize or enable the sale of THC/CBD products.

## Industrial hemp / circular economy

Supported categories include:

- fiber and textiles;
- paper and packaging;
- building materials and biocomposites;
- agricultural residues and reuse;
- pilot projects that measure recovered material, avoided waste and estimated avoided CO2e.

Life evidence should distinguish measured values from estimates and preserve provenance for every claim.

## Regulated cannabinoid operator registry

A regulated operator record may include jurisdiction, operator type, licensing authority/reference, validity dates, age restrictions, traceability references and lab-documentation requirements.

Default state is `UNVERIFIED`.

No regulated-commerce feature may be enabled merely because an operator is listed. A separate product/jurisdiction review and explicit production approval are required.

## Guardrails

- regulated products default to disabled;
- jurisdiction and license checks are mandatory before any commerce capability can be considered;
- age gates and lab documentation are required where applicable;
- cross-border enablement is never automatic;
- MyZubster must not present public bodies, utilities, dispensaries or distributors as partners unless there is documented evidence;
- medical claims are outside the scope of this module;
- Life environmental KPIs must not be mixed with commercial or medical claims.

## KPI model

Initial circular-economy KPIs:

- total evidence entries;
- verified evidence entries;
- reused material (kg);
- avoided waste (kg);
- estimated avoided CO2e (kg).

## Technical entry point

Frontend data model: `frontend/src/data/lifeHempCircularEconomy.js`.

Future work can expose these fields in the Life portal and add persistence/API support after privacy, jurisdiction and compliance review.
