```python
# kpi_verifier.py
"""
A small, production‑ready helper for verifying a single sustainability KPI
for a music/festival intervention.

The module deliberately contains no references to personal data, copyrighted
assets or any other sensitive information.  It only operates on numeric
values that are expected to be supplied by the user (e.g. from a sanitized
CSV, JSON or database export).

The public API is intentionally tiny:

    verify_kpi(baseline: float,
               intervention: float,
               tolerance: float = 0.05) -> bool

The function returns ``True`` if the relative change between the baseline
and the intervention is within the supplied tolerance, otherwise ``False``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Tuple


@dataclass(frozen=True)
class KPIResult:
    """Result of a KPI verification run."""
    baseline: float
    intervention: float
    relative_change: float
    within_tolerance: bool
    tolerance: float


def _relative_change(baseline: float, intervention: float) -> float:
    """
    Compute the relative change between two numeric values.

    The relative change is defined as:

        (intervention - baseline) / baseline

    A zero baseline is treated as a special case: if both baseline and
    intervention are zero the relative change is defined as 0.0; otherwise
    a ``ZeroDivisionError`` is raised to avoid silent failures.

    Parameters
    ----------
    baseline : float
        The baseline KPI value.
    intervention : float
        The KPI value after the intervention.

    Returns
    -------
    float
        The relative change.
    """
    if baseline == 0.0:
        if intervention == 0.0:
            return 0.0
        raise ZeroDivisionError(
            "Baseline is zero while intervention is non‑zero; "
            "relative change is undefined."
        )
    return (intervention - baseline) / baseline


def verify_kpi(
    baseline: float,
    intervention: float,
    tolerance: float = 0.05,
) -> KPIResult:
    """
    Verify a single KPI against a tolerance.

    Parameters
    ----------
    baseline : float
        The KPI value before the intervention.
    intervention : float
        The KPI value after the intervention.
    tolerance : float, optional
        The maximum allowed absolute relative change (default 5%).

    Returns
    -------
    KPIResult
        A dataclass instance containing the verification details.

    Raises
    ------
    ValueError
        If ``tolerance`` is negative.
    ZeroDivisionError
        If ``baseline`` is zero and ``intervention`` is non‑zero.
    """
    if tolerance < 0:
        raise ValueError("Tolerance must be non‑negative")

    rel_change = _relative_change(baseline, intervention)
    within = abs(rel_change) <= tolerance

    return KPIResult(
        baseline=baseline,
        intervention=intervention,
        relative_change=rel_change,
        within_tolerance=within,
        tolerance=tolerance,
    )


# --------------------------------------------------------------------------- #
# Example usage (uncomment to run as a script)
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="Verify a sustainability KPI against a tolerance."
    )
    parser.add_argument(
        "baseline",
        type=float,
        help="Baseline KPI value (pre‑intervention).",
    )
    parser.add_argument(
        "intervention",
        type=float,
        help="Intervention KPI value (post‑intervention).",
    )
    parser.add_argument(
        "-t",
        "--tolerance",
        type=float,
        default=0.05,
        help="Tolerance as a decimal (default 0.05 = 5%).",
    )

    args = parser.parse_args()

    try:
        result = verify_kpi(
            baseline=args.baseline,
            intervention=args.intervention,
            tolerance=args.tolerance,
        )
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"Baseline: {result.baseline}")
    print(f"Intervention: {result.intervention}")
    print(f"Relative change: