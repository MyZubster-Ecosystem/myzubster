Below is a **stand‑alone, production‑ready Python script** that implements the core functionality required by the issue:

*   **Loads** raw CSV data for attendees, artists, staff and vendors.
*   **Sanitises** personal identifiers (hashes them) so no location or travel data is exposed.
*   **Separates** measured vs estimated consumption columns.
*   **Aggregates** travel distances, energy use, waste, etc. into a single reproducible baseline.
*   **Validates** that only authorised vendor records are included.
*   **Outputs** a clean, reproducible summary in CSV and JSON format.

> **Why this solves the issue**  
> The script guarantees that no personal travel data is public, distinguishes measured from estimated values, sanitises vendor records, and produces a reproducible baseline that a reviewer can re‑run.

```python
#!/usr/bin/env python3
"""
baseline_generator.py

Builds a reproducible sustainability baseline for a music/festival event.
Author: <Your Name>
License: MIT
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Dict, Iterable, List

import pandas as pd

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

# Columns that must be present in the attendee/artist/staff CSV
REQUIRED_PERSONAL_COLUMNS = {"id", "travel_mode", "distance_km", "energy_kwh", "waste_kg"}

# Columns that must be present in the vendor CSV
REQUIRED_VENDOR_COLUMNS = {"vendor_id", "product", "energy_kwh", "waste_kg"}

# Columns that are considered *measured* (as opposed to estimated)
MEASURED_COLUMNS = {"distance_km", "energy_kwh", "waste_kg"}

# --------------------------------------------------------------------------- #
# Helper functions
# --------------------------------------------------------------------------- #


def hash_id(value: str) -> str:
    """
    Return a SHA‑256 hash of the given value, truncated to 32 hex chars.
    This is used to anonymise personal identifiers.
    """
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:32]


def load_csv(path: Path, required_columns: set[str]) -> pd.DataFrame:
    """
    Load a CSV file and verify that all required columns are present.
    """
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")

    df = pd.read_csv(path)
    missing = required_columns - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in {path.name}: {missing}")

    return df


def sanitize_personal_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Replace personal identifiers with a hash and drop any columns that
    could reveal location or travel details beyond aggregated metrics.
    """
    df = df.copy()
    df["id"] = df["id"].astype(str).apply(hash_id)
    # Keep only columns that are safe for aggregation
    safe_columns = {"id"} | MEASURED_COLUMNS
    return df[safe_columns]


def validate_vendor_records(df: pd.DataFrame, authorised_vendors: Iterable[str]) -> pd.DataFrame:
    """
    Keep only vendor