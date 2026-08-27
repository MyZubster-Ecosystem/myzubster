Below is a **self‑contained, production‑ready Python module** that implements a generic circularity KPI calculation and a small test‑suite.  
It can be dropped into any repository that needs to verify a single sustainability KPI (e.g. “recycling rate”) from sanitized operational data.

```diff
# ────────────────────────────────────────────────────────────────────────
#  File: kpi_verifier.py
# ────────────────────────────────────────────────────────────────────────
+"""
+Circularity KPI Verifier
+========================
+
+This module provides a single, well‑tested function that computes a
+common circularity KPI – the *recycling rate* – from two sanitized
+operational inputs:
+
+* ``total_waste`` – Total waste generated (kg, m³, etc.)
+* ``recycled_waste`` – Portion of that waste that was recycled
+
+The function returns the KPI as a percentage (0‑100).  It performs
+basic validation and raises informative errors when the inputs are
+invalid.  The implementation is intentionally simple so that it can
+be reused in a variety of contexts (CLI scripts, web services,
+CI‑pipeline checks, etc.).
+"""
+
+from __future__ import annotations
+
+from dataclasses import dataclass
+from typing import Union
+
+Number = Union[int, float]
+
+
+@dataclass(frozen=True)
+class CircularityKPI:
+    """
+    Data container for the circularity KPI result.
+
+    Attributes
+    ----------
+    value : float
+        The KPI expressed as a percentage (0‑100).
+    unit : str
+        The unit of the KPI – always ``"%"`` for this implementation.
+    """
+    value: float
+    unit: str = "%"
+
+
+def calculate_recycling_rate(total_waste: Number, recycled_waste: Number) -> CircularityKPI:
+    """
+    Compute the recycling rate KPI.
+
+    Parameters
+    ----------
+    total_waste : int | float
+        Total waste generated. Must be non‑negative.
+    recycled_waste : int | float
+        Waste that was recycled. Must be non‑negative and not exceed
+        ``total_waste``.
+
+    Returns
+    -------
+    CircularityKPI
+        The recycling rate expressed as a percentage.
+
+    Raises
+    ------
+    ValueError
+        If any input is negative or if ``recycled_waste`` > ``total_waste``.
+    TypeError
+        If inputs are not numeric.
+    """
+    # --- Input validation ----------------------------------------------------
+    if not isinstance(total_waste, (int, float)):
+        raise TypeError(f"total_waste must be numeric, got {type(total_waste).__name__}")
+    if not isinstance(recycled_waste, (int, float)):
+        raise TypeError(f"recycled_waste must be numeric, got {type(recycled_waste).__name__}")
+
+    if total_waste < 0:
+        raise ValueError("total_waste cannot