"""Tests for the KPI schema module."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from myzpkpi.kpi_schema import (
    KPI,
    SCHEMA_VERSION,
    UNITS,
    default_kpis,
    load_kpis,
    write_kpis,
)


def test_default_kpis_returns_all_required_families():
    families = {kpi.family for kpi in default_kpis()}
    required = {
        "water", "energy", "yield", "nutrient",
        "labour", "data_quality", "ops", "ai_validation",
    }
    missing = required - families
    assert not missing, f"Missing required KPI families: {missing}"


def test_default_kpis_have_valid_units():
    for kpi in default_kpis():
        assert kpi.unit in UNITS, f"Unknown unit {kpi.unit!r} in {kpi.id}"


def test_default_kpis_have_inputs_listed():
    for kpi in default_kpis():
        assert kpi.inputs, f"KPI {kpi.id} has no inputs declared"
        # Each input must be a valid identifier-like string.
        for inp in kpi.inputs:
            assert inp.replace("_", "").isalnum()


def test_default_kpis_have_versions():
    for kpi in default_kpis():
        assert kpi.version == SCHEMA_VERSION


def test_kpi_from_dict_rejects_unknown_unit():
    raw = {
        "id": "x", "family": "test", "name": "x", "unit": "furlongs/fortnight",
        "formula": "a / b", "description": "x",
        "inputs": ["a", "b"],
    }
    with pytest.raises(ValueError):
        KPI.from_dict(raw)


def test_kpi_from_dict_rejects_missing_keys():
    with pytest.raises(ValueError):
        KPI.from_dict({"id": "x", "family": "test"})


def test_kpi_from_dict_rejects_bad_aggregation():
    raw = {
        "id": "x", "family": "test", "name": "x", "unit": "ratio",
        "formula": "a / b", "description": "x",
        "inputs": ["a", "b"], "aggregation": "min",
    }
    with pytest.raises(ValueError):
        KPI.from_dict(raw)


def test_kpi_from_dict_rejects_bad_direction():
    raw = {
        "id": "x", "family": "test", "name": "x", "unit": "ratio",
        "formula": "a / b", "description": "x",
        "inputs": ["a", "b"], "direction": "sideways",
    }
    with pytest.raises(ValueError):
        KPI.from_dict(raw)


def test_kpi_from_dict_accepts_ratio_of_totals():
    raw = {
        "id": "x", "family": "test", "name": "x", "unit": "L/kg",
        "formula": "a / b", "description": "x",
        "inputs": ["a", "b"], "aggregation": "ratio-of-totals",
    }
    kpi = KPI.from_dict(raw)
    assert kpi.aggregation == "ratio-of-totals"


def test_default_kpis_use_derived_units_for_ratio_kpis():
    ratio_kpis = {
        "water.use.l_per_kg_yield": "L/kg",
        "water.use.l_per_m2_per_day": "L/m²/day",
        "energy.use.kwh_per_kg_yield": "kWh/kg",
        "yield.kg_per_m2": "kg/m²",
        "nutrient.n_kg_per_kg_yield": "kg/kg",
        "labour.h_per_kg_yield": "h/kg",
        "labour.h_per_m2": "h/m²",
    }
    kpi_map = {k.id: k for k in default_kpis()}
    for kpi_id, expected_unit in ratio_kpis.items():
        assert kpi_map[kpi_id].unit == expected_unit, (
            f"{kpi_id} unit should be {expected_unit!r}, got {kpi_map[kpi_id].unit!r}"
        )


def test_default_kpis_use_ratio_of_totals_for_ratio_kpis():
    ratio_kpis = {
        "water.use.l_per_kg_yield",
        "water.use.l_per_m2_per_day",
        "energy.use.kwh_per_kg_yield",
        "yield.kg_per_m2",
        "nutrient.n_kg_per_kg_yield",
        "labour.h_per_kg_yield",
        "labour.h_per_m2",
    }
    kpi_map = {k.id: k for k in default_kpis()}
    for kpi_id in ratio_kpis:
        assert kpi_map[kpi_id].aggregation == "ratio-of-totals", (
            f"{kpi_id} aggregation should be ratio-of-totals, "
            f"got {kpi_map[kpi_id].aggregation!r}"
        )


def test_load_kpis_from_json(tmp_path: Path):
    catalog = default_kpis()
    target = tmp_path / "catalog.json"
    write_kpis(catalog, target)
    loaded = load_kpis(target)
    assert len(loaded) == len(catalog)
    assert {k.id for k in loaded} == {k.id for k in catalog}


def test_load_kpis_from_catalog_file():
    repo_root = Path(__file__).resolve().parent.parent
    catalog_path = repo_root / "data" / "config" / "kpi_catalog.json"
    if catalog_path.exists():
        kpis = load_kpis(catalog_path)
        assert kpis, "catalog file should yield at least one KPI"


def test_default_kpis_contains_anomaly_response():
    ids = {k.id for k in default_kpis()}
    assert "ops.anomaly_response.min" in ids


def test_load_kpis_rejects_non_list():
    p = Path("non_list.json")
    p.write_text(json.dumps({"kpis": {"id": "x"}}), encoding="utf-8")
    try:
        with pytest.raises((ValueError, TypeError)):
            load_kpis(p)
    finally:
        p.unlink(missing_ok=True)
