"""
Comprehensive tests for Auditable Revenue Split Calculator
Verifies all 8 acceptance criteria from #1463:
1. Zero platform fee
2. Normal split scenario
3. Zero treasury allocation
4. Fractional/rounding cases with strict invariant reconciliation
5. Invalid percentage ranges (<0 or >100)
6. Zero-value sale
7. Unsupported/missing asset rejection
8. Settlement boundary assertion (calculation != settlement)
"""

import pytest
from decimal import Decimal
from myzpkpi.auditable_revenue_split_calculator import (
    calculate_revenue_split,
    SplitResult,
    InvalidInputError,
    UnsupportedCurrencyError
)


def test_normal_pilot_split_scenario():
    """Illustrative pilot scenario: 100 EUR, 10% fee, 50% treasury allocation."""
    result = calculate_revenue_split(
        gross_amount="100.00",
        currency="EUR",
        platform_fee_percent="10.0",
        treasury_share_percent="50.0"
    )
    assert result.gross_amount == Decimal("100.00")
    assert result.creator_amount == Decimal("90.00")
    assert result.myzubster_gross_fee == Decimal("10.00")
    assert result.treasury_allocation == Decimal("5.00")
    assert result.myzubster_project_revenue == Decimal("5.00")
    assert result.rounding_delta == Decimal("0.00")
    assert result.settlement_executed is False
    assert result.creator_amount + result.treasury_allocation + result.myzubster_project_revenue == result.gross_amount


def test_zero_platform_fee():
    """When platform fee is 0%, creator receives 100% and fees are 0."""
    result = calculate_revenue_split(
        gross_amount="250.00",
        currency="USDC",
        platform_fee_percent="0.0",
        treasury_share_percent="50.0"
    )
    assert result.creator_amount == Decimal("250.00")
    assert result.myzubster_gross_fee == Decimal("0.00")
    assert result.treasury_allocation == Decimal("0.00")
    assert result.myzubster_project_revenue == Decimal("0.00")
    assert result.creator_amount + result.treasury_allocation + result.myzubster_project_revenue == result.gross_amount


def test_zero_treasury_allocation():
    """When treasury allocation is 0%, all platform fee goes to project infrastructure."""
    result = calculate_revenue_split(
        gross_amount="150.00",
        currency="EUR",
        platform_fee_percent="10.0",
        treasury_share_percent="0.0"
    )
    assert result.creator_amount == Decimal("135.00")
    assert result.myzubster_gross_fee == Decimal("15.00")
    assert result.treasury_allocation == Decimal("0.00")
    assert result.myzubster_project_revenue == Decimal("15.00")
    assert result.creator_amount + result.treasury_allocation + result.myzubster_project_revenue == result.gross_amount


def test_fractional_and_odd_rounding_reconciliation():
    """Odd numbers produce repeating decimals; sum must strictly reconcile to gross amount."""
    test_cases = [
        ("33.33", "7.77", "33.33"),
        ("99.99", "12.5", "37.5"),
        ("1.01", "15.0", "50.0"),
        ("0.03", "10.0", "50.0"),
        ("12345.67", "8.25", "45.0")
    ]
    for gross_str, fee_str, treas_str in test_cases:
        result = calculate_revenue_split(
            gross_amount=gross_str,
            currency="EUR",
            platform_fee_percent=fee_str,
            treasury_share_percent=treas_str
        )
        total_allocated = result.creator_amount + result.treasury_allocation + result.myzubster_project_revenue
        assert total_allocated == result.gross_amount, f"Reconciliation failed for {gross_str}: {total_allocated} != {result.gross_amount}"
        assert result.rounding_delta == Decimal("0.00")


def test_zero_value_sale():
    """Zero gross amount returns zeros without exception."""
    result = calculate_revenue_split(
        gross_amount="0.00",
        currency="EUR"
    )
    assert result.gross_amount == Decimal("0.00")
    assert result.creator_amount == Decimal("0.00")
    assert result.treasury_allocation == Decimal("0.00")
    assert result.myzubster_project_revenue == Decimal("0.00")
    assert result.settlement_executed is False


def test_invalid_negative_gross_rejected():
    with pytest.raises(InvalidInputError, match="cannot be negative"):
        calculate_revenue_split(gross_amount="-50.00", currency="EUR")


def test_invalid_percentage_ranges_rejected():
    with pytest.raises(InvalidInputError, match="Platform fee percent must be between 0 and 100"):
        calculate_revenue_split(gross_amount="100.00", currency="EUR", platform_fee_percent="105.0")

    with pytest.raises(InvalidInputError, match="Platform fee percent must be between 0 and 100"):
        calculate_revenue_split(gross_amount="100.00", currency="EUR", platform_fee_percent="-1.0")

    with pytest.raises(InvalidInputError, match="Treasury share percent must be between 0 and 100"):
        calculate_revenue_split(gross_amount="100.00", currency="EUR", treasury_share_percent="150.0")


def test_unsupported_currency_rejected():
    with pytest.raises(UnsupportedCurrencyError, match="Unsupported asset/currency 'DOGE'"):
        calculate_revenue_split(gross_amount="100.00", currency="DOGE")

    with pytest.raises(UnsupportedCurrencyError, match="Asset/currency identifier must not be empty"):
        calculate_revenue_split(gross_amount="100.00", currency="")


def test_crypto_high_precision_rounding():
    """Crypto like ETH and SOL uses 6 decimal places (micro units)."""
    result = calculate_revenue_split(
        gross_amount="1.543210",
        currency="ETH",
        platform_fee_percent="5.0",
        treasury_share_percent="50.0"
    )
    assert result.currency == "ETH"
    assert result.creator_amount + result.treasury_allocation + result.myzubster_project_revenue == result.gross_amount


def test_settlement_boundary_guarantee():
    """Explicitly verify that calculation never performs settlement or triggers transfers."""
    result = calculate_revenue_split(gross_amount="500.00", currency="USDC")
    assert result.settlement_executed is False
    assert "CALCULATION_ONLY" in result.audit_notice
    d = result.to_dict()
    assert d["settlement_executed"] is False

def test_maintainer_quantization_reconciliation_case():
    """Exact case flagged by @danieldirimini-myzubster in review: invariant must hold on quantized values."""
    result = calculate_revenue_split(
        gross_amount="2.345",
        currency="EUR",
        platform_fee_percent="10",
        treasury_share_percent="50"
    )
    assert result.gross_amount == Decimal("2.34")
    assert result.creator_amount == Decimal("2.11")
    assert result.myzubster_gross_fee == Decimal("0.23")
    assert result.treasury_allocation == Decimal("0.12")
    assert result.myzubster_project_revenue == Decimal("0.11")
    assert result.creator_amount + result.treasury_allocation + result.myzubster_project_revenue == result.gross_amount
    assert result.rounding_delta == Decimal("0.00")
