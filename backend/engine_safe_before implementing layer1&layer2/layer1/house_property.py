"""
house_property.py
=================
Computes income / loss from house property (Sec 22–27).

Rules implemented
-----------------
Self-Occupied Property (SOP)
  Gross Annual Value (GAV)         = 0 (deemed)
  Net Annual Value (NAV)           = 0
  Deduction u/s 24(b) interest cap = ₹2,00,000 p.a.
  Loss from SOP is set off against salary/other income (both regimes),
  BUT the ₹2L interest cap means excess interest is disallowed.
  Pre-construction interest: deductible in 5 equal instalments from
  year of completion. Caller supplies the 1/5th amount directly.

Let-Out Property
  GAV                              = annual rent received
  Municipal taxes (30% standard deduction u/s 24(a)) applied to NAV
  Deduction u/s 24(b)              = actual interest paid (no cap)
  Net income can be positive (taxable) or negative (loss)
  Loss set-off against other heads capped at ₹2,00,000 (remaining
  carried forward for 8 years).

New Regime (Budget 2023 onwards)
  Interest deduction u/s 24(b) for SOP is NOT available under the
  new regime (standard deduction replaces most deductions).
  However, let-out property income/loss computation remains the same.
  Loss from let-out property under new regime cannot be set off
  against other income (no loss set-off for house property in new regime).
"""

from __future__ import annotations
from typing import Literal

from models import HousePropertyInput

SOP_INTEREST_CAP = 200_000          # ₹2 lakh cap for self-occupied
LOSS_SETOFF_CAP = 200_000           # max set-off against other heads (let-out too)
REPAIR_DEDUCTION_RATE = 0.30        # Sec 24(a) standard deduction


def compute_house_property(
    hp: HousePropertyInput,
    regime: Literal["old", "new"],
) -> dict:
    """
    Returns dict with all house property head values.
    """
    if hp.property_type == "none":
        return _zero_hp()

    if hp.property_type == "self_occupied":
        return _compute_sop(hp, regime)

    return _compute_let_out(hp, regime)


def _zero_hp() -> dict:
    return {
        "gross_annual_value": 0.0,
        "municipal_tax": 0.0,
        "net_annual_value": 0.0,
        "repair_deduction_30pct": 0.0,
        "interest_on_loan_24b": 0.0,
        "net_house_property_income": 0.0,
        "excess_interest_disallowed": 0.0,
    }


def _compute_sop(hp: HousePropertyInput, regime: Literal["old", "new"]) -> dict:
    gav = 0.0
    municipal_tax = 0.0
    nav = 0.0
    repair = 0.0
    total_interest = hp.home_loan_interest + hp.pre_construction_interest

    if regime == "new":
        # SOP interest deduction not available in new regime
        allowed_interest = 0.0
        excess = total_interest
    else:
        allowed_interest = min(total_interest, SOP_INTEREST_CAP)
        excess = max(0.0, total_interest - SOP_INTEREST_CAP)

    net_hp_income = round(nav - repair - allowed_interest, 2)   # will be 0 or negative

    return {
        "gross_annual_value": gav,
        "municipal_tax": municipal_tax,
        "net_annual_value": nav,
        "repair_deduction_30pct": repair,
        "interest_on_loan_24b": allowed_interest,
        "net_house_property_income": net_hp_income,
        "excess_interest_disallowed": round(excess, 2),
    }


def _compute_let_out(hp: HousePropertyInput, regime: Literal["old", "new"]) -> dict:
    gav = hp.annual_rent_received
    municipal_tax = 0.0    # caller may supply; we treat municipal tax as 0 by default
                           # (they are deductible but rarely entered separately — safe to 0)
    nav = gav - municipal_tax
    repair = round(nav * REPAIR_DEDUCTION_RATE, 2)
    nav_after_repair = nav - repair

    total_interest = hp.home_loan_interest + hp.pre_construction_interest
    # No cap on interest for let-out property
    net_hp_income = round(nav_after_repair - total_interest, 2)

    # Loss set-off cap in both regimes
    excess_disallowed = 0.0
    if regime == "new" and net_hp_income < 0:
        # New regime: HP loss cannot be set off — disallow entirely
        excess_disallowed = abs(net_hp_income)
        net_hp_income = 0.0
    elif regime == "old" and net_hp_income < 0:
        # Old regime: cap set-off at ₹2L; carry forward the rest
        if abs(net_hp_income) > LOSS_SETOFF_CAP:
            excess_disallowed = abs(net_hp_income) - LOSS_SETOFF_CAP
            net_hp_income = -LOSS_SETOFF_CAP
        # else full loss allowed (within cap)

    return {
        "gross_annual_value": round(gav, 2),
        "municipal_tax": round(municipal_tax, 2),
        "net_annual_value": round(nav, 2),
        "repair_deduction_30pct": round(repair, 2),
        "interest_on_loan_24b": round(total_interest, 2),
        "net_house_property_income": round(net_hp_income, 2),
        "excess_interest_disallowed": round(excess_disallowed, 2),
    }
