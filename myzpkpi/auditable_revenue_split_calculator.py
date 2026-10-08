"""
MyZubster Auditable Revenue Split Calculator (Pure Deterministic Calculation Layer)
Related: #1462, #1463
Scope: Deterministic revenue-split calculator without execution of settlement.
Guarantees:
  - Pure calculation without wallet private keys, blockchain writes, or settlement.
  - Sum of allocations strictly reconciles to gross settled amount (zero leak).
  - Explicit non-settlement boundaries maintained.
  - Invariant holds strictly on quantized values: sum(allocations) == quantized_gross.
"""

from decimal import Decimal, ROUND_HALF_EVEN, InvalidOperation
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict

SUPPORTED_CURRENCIES = {"EUR", "USD", "USDC", "USDT", "ETH", "SOL", "DAI"}


class RevenueSplitError(ValueError):
    """Base error for revenue split calculation failures."""
    pass


class InvalidInputError(RevenueSplitError):
    """Raised when calculation inputs are outside valid ranges."""
    pass


class UnsupportedCurrencyError(RevenueSplitError):
    """Raised when an unapproved currency/asset identifier is specified."""
    pass


@dataclass(frozen=True)
class SplitResult:
    gross_amount: Decimal
    currency: str
    creator_amount: Decimal
    myzubster_gross_fee: Decimal
    treasury_allocation: Decimal
    myzubster_project_revenue: Decimal
    rounding_delta: Decimal
    policy_version: str
    settlement_executed: bool = False
    audit_notice: str = "CALCULATION_ONLY: No funds moved, no settlement executed."

    def to_dict(self) -> Dict[str, Any]:
        return {
            "gross_amount": str(self.gross_amount),
            "currency": self.currency,
            "creator_amount": str(self.creator_amount),
            "myzubster_gross_fee": str(self.myzubster_gross_fee),
            "treasury_allocation": str(self.treasury_allocation),
            "myzubster_project_revenue": str(self.myzubster_project_revenue),
            "rounding_delta": str(self.rounding_delta),
            "policy_version": self.policy_version,
            "settlement_executed": self.settlement_executed,
            "audit_notice": self.audit_notice,
        }


def calculate_revenue_split(
    gross_amount: Any,
    currency: str,
    platform_fee_percent: Any = Decimal("10.0"),
    treasury_share_percent: Any = Decimal("50.0"),
    policy_version: str = "2026-v1.0-pilot",
    strict_currency_check: bool = True
) -> SplitResult:
    """
    Deterministically calculates revenue allocations for a gross primary sale.

    Args:
        gross_amount: Gross proceeds received (must be >= 0).
        currency: Identifier for the asset (e.g. 'EUR', 'USDC').
        platform_fee_percent: Platform fee percentage of gross (0.0 to 100.0).
        treasury_share_percent: Treasury share percentage of platform fee (0.0 to 100.0).
        policy_version: Version identifier of the fee policy applied.
        strict_currency_check: Whether to reject unknown currencies.

    Returns:
        SplitResult dataclass with exact reconciling amounts.
    """
    try:
        gross = Decimal(str(gross_amount))
    except (InvalidOperation, TypeError, ValueError) as e:
        raise InvalidInputError(f"Gross amount cannot be parsed as Decimal: {gross_amount}") from e

    if gross < Decimal("0"):
        raise InvalidInputError(f"Gross amount cannot be negative: {gross}")

    curr_clean = (currency or "").strip().upper()
    if not curr_clean:
        raise UnsupportedCurrencyError("Asset/currency identifier must not be empty.")

    if strict_currency_check and curr_clean not in SUPPORTED_CURRENCIES:
        raise UnsupportedCurrencyError(f"Unsupported asset/currency '{curr_clean}'. Supported: {sorted(SUPPORTED_CURRENCIES)}")

    try:
        fee_pct = Decimal(str(platform_fee_percent))
        treasury_pct = Decimal(str(treasury_share_percent))
    except (InvalidOperation, TypeError, ValueError) as e:
        raise InvalidInputError(f"Percentage inputs must be numeric: {e}") from e

    if not (Decimal("0") <= fee_pct <= Decimal("100")):
        raise InvalidInputError(f"Platform fee percent must be between 0 and 100: {fee_pct}")

    if not (Decimal("0") <= treasury_pct <= Decimal("100")):
        raise InvalidInputError(f"Treasury share percent must be between 0 and 100: {treasury_pct}")

    # Rounding quantum to 2 decimal places (cents) or 6 places if crypto
    quantum = Decimal("0.000001") if curr_clean in {"ETH", "SOL"} else Decimal("0.01")

    # Handling zero gross proceeds edge-case
    if gross == Decimal("0"):
        zero = Decimal("0").quantize(quantum)
        return SplitResult(
            gross_amount=zero,
            currency=curr_clean,
            creator_amount=zero,
            myzubster_gross_fee=zero,
            treasury_allocation=zero,
            myzubster_project_revenue=zero,
            rounding_delta=zero,
            policy_version=policy_version,
            settlement_executed=False
        )

    # Reconcile invariant on quantized gross amount upfront
    gross_quantized = gross.quantize(quantum, rounding=ROUND_HALF_EVEN)

    # High precision math based on quantized gross
    platform_fee_ratio = fee_pct / Decimal("100")
    treasury_ratio = treasury_pct / Decimal("100")

    # 1. Platform Fee (quantized)
    raw_platform_fee = gross_quantized * platform_fee_ratio
    platform_fee = raw_platform_fee.quantize(quantum, rounding=ROUND_HALF_EVEN)

    # 2. Creator proceeds (strictly gross_quantized - platform_fee)
    creator_amount = gross_quantized - platform_fee

    # 3. Treasury allocation from platform fee (quantized)
    raw_treasury = platform_fee * treasury_ratio
    treasury_allocation = raw_treasury.quantize(quantum, rounding=ROUND_HALF_EVEN)

    # 4. Remaining MyZubster project revenue
    project_revenue = platform_fee - treasury_allocation

    # Invariant Check: creator + treasury + project == gross_quantized
    reconciled_sum = creator_amount + treasury_allocation + project_revenue
    rounding_delta = gross_quantized - reconciled_sum

    if rounding_delta != Decimal("0"):
        # Adjust project revenue by the rounding delta (safe absorbing)
        project_revenue += rounding_delta
        rounding_delta = Decimal("0").quantize(quantum)
    else:
        rounding_delta = Decimal("0").quantize(quantum)

    return SplitResult(
        gross_amount=gross_quantized,
        currency=curr_clean,
        creator_amount=creator_amount,
        myzubster_gross_fee=platform_fee,
        treasury_allocation=treasury_allocation,
        myzubster_project_revenue=project_revenue,
        rounding_delta=rounding_delta,
        policy_version=policy_version,
        settlement_executed=False
    )
