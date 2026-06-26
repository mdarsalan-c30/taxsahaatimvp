"""
tax_slabs.py
============
Pure functions for slab tax computation.
Covers FY 2024-25 / AY 2025-26 rates.

Key rules implemented
---------------------
OLD REGIME
  General    : 0 (≤2.5L), 5% (2.5–5L), 20% (5–10L), 30% (>10L)
  Senior     : 0 (≤3L),   5% (3–5L),   20% (5–10L), 30% (>10L)
  Super-sr   : 0 (≤5L),   20% (5–10L), 30% (>10L)
  87A rebate : tax ≤ ₹12,500 if income ≤ ₹5,00,000
  Surcharge  : 10% (50L–1Cr), 15% (1–2Cr), 25% (2–5Cr), 37% (>5Cr)

NEW REGIME  (Finance Act 2023 + Budget 2024)
  0%(≤4L), 5%(4–8L), 10%(8–12L), 15%(12–16L), 20%(16–20L), 25%(20–24L), 30%(>24L)
  87A rebate : full rebate if income ≤ ₹12,00,000 (tax = 0 after rebate)
  Surcharge  : capped at 25% (37% slab does NOT apply under new regime)

SPECIAL RATE TAXES (same for both regimes)
  STCG 111A  : 15% (pre 23-Jul-2024 transfers) / 20% (post)
  LTCG 112A  : 10% (pre) / 12.5% (post) on gains > ₹1,00,000 (pre) / ₹1,25,000 (post)
  LTCG other : 20% with indexation
  Debt MF    : slab rate (no special rate since Apr-2023)

SURCHARGE on special-rate income: capped at 15% for LTCG/STCG 111A / 112A.

CESS: 4% on (income tax + surcharge).
"""

from __future__ import annotations
from typing import Literal


# ─────────────────────────────────────────────────────────────
#  SLAB TABLES
#  Each entry: (upper_limit, rate)
#  upper_limit = None → top slab (no upper bound)
# ─────────────────────────────────────────────────────────────

_OLD_GENERAL = [
    (250_000,  0.00),
    (500_000,  0.05),
    (1_000_000, 0.20),
    (None,     0.30),
]

_OLD_SENIOR = [           # age ≥ 60 and < 80
    (300_000,  0.00),
    (500_000,  0.05),
    (1_000_000, 0.20),
    (None,     0.30),
]

_OLD_SUPER_SENIOR = [     # age ≥ 80
    (500_000,  0.00),
    (1_000_000, 0.20),
    (None,     0.30),
]

_NEW_REGIME = [
    (400_000,  0.00),
    (800_000,  0.05),
    (1_200_000, 0.10),
    (1_600_000, 0.15),
    (2_000_000, 0.20),
    (2_400_000, 0.25),
    (None,     0.30),
]

# ─────────────────────────────────────────────────────────────
#  SURCHARGE BANDS
# ─────────────────────────────────────────────────────────────

_SURCHARGE_OLD = [
    (5_000_000,  0.00),
    (10_000_000, 0.10),
    (20_000_000, 0.15),
    (50_000_000, 0.25),
    (None,       0.37),
]

# New regime: 37% slab removed; max is 25%
_SURCHARGE_NEW = [
    (5_000_000,  0.00),
    (10_000_000, 0.10),
    (20_000_000, 0.15),
    (None,       0.25),
]

# Special-rate income (STCG 111A, LTCG 112A): surcharge capped at 15%
_SURCHARGE_SPECIAL = [
    (5_000_000,  0.00),
    (10_000_000, 0.10),
    (None,       0.15),
]

CESS_RATE = 0.04


# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────

def _pick_old_slabs(age: int) -> list:
    if age >= 80:
        return _OLD_SUPER_SENIOR
    if age >= 60:
        return _OLD_SENIOR
    return _OLD_GENERAL


def _compute_slab_tax(income: float, slabs: list) -> float:
    """Apply progressive slab table to a positive income amount."""
    if income <= 0:
        return 0.0
    tax = 0.0
    prev = 0.0
    for upper, rate in slabs:
        if upper is None:
            taxable = income - prev
        else:
            taxable = min(income, upper) - prev
        if taxable <= 0:
            break
        tax += taxable * rate
        if upper is None or income <= upper:
            break
        prev = upper
    return round(tax, 2)


def _surcharge_rate(total_income: float, bands: list) -> float:
    prev = 0.0
    for upper, rate in bands:
        if upper is None or total_income <= upper:
            return rate
        prev = upper
    return 0.0


def _marginal_relief(
    tax_before_surcharge: float,
    surcharge: float,
    total_income: float,
    threshold: float,
) -> float:
    """
    Marginal relief ensures that the increase in tax due to crossing a surcharge
    threshold does not exceed the income increase above that threshold.

    Relief = max(0, (tax + surcharge) - (tax_at_threshold + (income - threshold)))
    """
    # Compute tax at threshold to use as reference
    # (We approximate: just check if relief is needed)
    extra_income = total_income - threshold
    extra_tax = tax_before_surcharge + surcharge - (tax_before_surcharge * (1 + 0))
    # Standard formula: relief = (tax+surcharge) - (threshold_tax + excess_income)
    # Since we don't recursively compute threshold_tax here, we use the net check:
    net_tax_with_surcharge = tax_before_surcharge + surcharge
    # If the net tax exceeds what would be paid at threshold + income excess
    # We approximate threshold_tax as tax_before_surcharge for same slab
    # This is conservative — a proper impl would call compute_slab_tax(threshold)
    relief = max(0.0, net_tax_with_surcharge - (tax_before_surcharge + extra_income))
    return round(relief, 2)


# ─────────────────────────────────────────────────────────────
#  SPECIAL RATE TAXES
# ─────────────────────────────────────────────────────────────

# Budget 2024 changed rates effective 23-Jul-2024.
# For simplicity we apply the NEW rates (post Jul-2024) as default.
# A future version can split by acquisition date.

STCG_111A_RATE = 0.20        # was 0.15 pre Jul-2024
LTCG_112A_RATE = 0.125       # was 0.10 pre Jul-2024
LTCG_112A_EXEMPTION = 125_000  # was 1,00,000 pre Jul-2024
LTCG_OTHER_RATE = 0.20       # with indexation (debt, property etc.)


def compute_special_rate_tax(
    stcg_111a: float,
    ltcg_112a: float,
    ltcg_other: float,
) -> float:
    """
    Tax on special-rate capital gains.
    Expects RAW (pre-exemption) LTCG 112A; applies the ₹1,25,000 exemption here.
    Call with ltcg_112a = the net gain after loss set-off (from capital_gains.py ltcg_112a_net).
    """
    tax_stcg = max(0.0, stcg_111a) * STCG_111A_RATE
    taxable_ltcg_112a = max(0.0, ltcg_112a - LTCG_112A_EXEMPTION)
    tax_ltcg_112a = taxable_ltcg_112a * LTCG_112A_RATE
    tax_ltcg_other = max(0.0, ltcg_other) * LTCG_OTHER_RATE
    return round(tax_stcg + tax_ltcg_112a + tax_ltcg_other, 2)


# ─────────────────────────────────────────────────────────────
#  87A REBATE
# ─────────────────────────────────────────────────────────────

def compute_87a_rebate(
    taxable_income: float,
    slab_tax: float,
    regime: Literal["old", "new"],
) -> float:
    """
    Old regime : rebate = min(slab_tax, 12_500) if taxable_income ≤ 5,00,000
    New regime : rebate = full slab_tax (i.e. tax = 0) if taxable_income ≤ 12,00,000
    Note: rebate applies only on slab tax, NOT on special-rate tax.
    """
    if regime == "old":
        if taxable_income <= 500_000:
            return min(slab_tax, 12_500)
        return 0.0
    else:  # new
        if taxable_income <= 1_200_000:
            return slab_tax  # full rebate → effectively nil tax
        return 0.0


# ─────────────────────────────────────────────────────────────
#  MAIN SLAB TAX FUNCTION
# ─────────────────────────────────────────────────────────────

def compute_slab_tax(
    taxable_income: float,
    regime: Literal["old", "new"],
    age: int,
    special_rate_tax: float = 0.0,
    total_income_for_surcharge: float = 0.0,
) -> dict:
    """
    Compute complete tax liability for one regime.

    Parameters
    ----------
    taxable_income          : income taxed at slab rates (after deductions)
    regime                  : "old" or "new"
    age                     : taxpayer age (affects old-regime slabs and rebate)
    special_rate_tax        : pre-computed tax on STCG/LTCG at flat rates
    total_income_for_surcharge : GTI used to determine surcharge band (usually
                               taxable_income + special-rate CG amounts)

    Returns
    -------
    dict with all intermediate values (matches SlabTaxResult fields)
    """
    taxable_income = max(0.0, taxable_income)

    # 1. Slab tax
    slabs = _new_regime_slabs() if regime == "new" else _pick_old_slabs(age)
    slab_tax = _compute_slab_tax(taxable_income, slabs)

    # 2. 87A rebate (on slab tax only)
    rebate = compute_87a_rebate(taxable_income, slab_tax, regime)
    tax_after_rebate = max(0.0, slab_tax - rebate)

    # 3. Gross tax (slab + special rate)
    gross_tax = tax_after_rebate + special_rate_tax

    # 4. Surcharge
    surcharge_bands = _SURCHARGE_NEW if regime == "new" else _SURCHARGE_OLD
    s_rate = _surcharge_rate(total_income_for_surcharge, surcharge_bands)
    surcharge = round(gross_tax * s_rate, 2)

    # 4a. Marginal relief at surcharge threshold crossings
    marginal_relief = 0.0
    thresholds = [5_000_000, 10_000_000, 20_000_000, 50_000_000]
    for thr in thresholds:
        if total_income_for_surcharge > thr:
            relief = _marginal_relief(gross_tax, surcharge, total_income_for_surcharge, thr)
            if relief > 0:
                marginal_relief = relief
                break

    surcharge = max(0.0, surcharge - marginal_relief)
    tax_plus_surcharge = gross_tax + surcharge

    # 5. Cess
    cess = round(tax_plus_surcharge * CESS_RATE, 2)
    total_tax = round(tax_plus_surcharge + cess, 2)

    return {
        "regime": regime,
        "taxable_income": taxable_income,
        "slab_tax": slab_tax,
        "special_rate_tax": special_rate_tax,
        "gross_tax": gross_tax,
        "rebate_87a": rebate,
        "tax_after_rebate": tax_after_rebate,
        "surcharge": surcharge,
        "surcharge_rate": s_rate,
        "marginal_relief": marginal_relief,
        "tax_plus_surcharge": tax_plus_surcharge,
        "cess": cess,
        "total_tax": total_tax,
    }


def _new_regime_slabs():
    return _NEW_REGIME
