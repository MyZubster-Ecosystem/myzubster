"""MyZubster Pilot Baseline, KPI & Evidence Framework.

A reusable framework for MyZubster smart-agriculture pilots.
Defines KPI schemas, baseline data models, evidence/provenance
tracking, and a reproducible baseline-vs-pilot comparison report.

This package is a *scaffold* — it ships with synthetic, non-sensitive
data only. Real pilot partners must define their own final targets;
do not infer production credentials, partner identities, or any
percentage improvements that are not derived from the supplied
synthetic dataset.
"""

__version__ = "0.1.0"
__all__ = [
    "kpi_schema",
    "baseline",
    "evidence",
    "calculator",
    "report",
    "validation",
]