"""
deductions.py
=============
Computes all deductions under Chapter VI-A (and 24b interest which is
a head-specific deduction, handled separately in house_property.py).

Old regime: all deductions applicable
New regime: ONLY standard deduction (in salary.py) + 80CCD(2) employer NPS

Limits (FY 2024-25)
--------------------
80C pool cap          : ₹1,50,000
80CCD(1B) NPS self    : ₹50,000  (over and above 80C)
80CCD(2) employer NPS : min(employer_contribution, 10% of basic)  — BOTH regimes
80D self+family       : ₹25,000 (₹50,000 if taxpayer is senior)
80D parents           : ₹25,000 (₹50,000 if parents are senior)
80E edu loan interest : no cap (only first 8 years of repayment)
80G                   : 100% or 50% as declared; qualifying limit applies for some
80TTA savings int.    : ₹10,000 (non-senior)
80TTB all int.        : ₹50,000 (senior) — replaces 80TTA
80U self disability   : ₹75,000 normal / ₹1,25,000 severe
"""

from __future__ import annotations
from typing import Literal

from models import DeductionsInput, SalaryInput

# ── Limits ──────────────────────────────────────
CAP_80C = 150_000
CAP_80CCD_1B = 50_000
CAP_80D_SELF_NORMAL = 25_000
CAP_80D_SELF_SENIOR = 50_000
CAP_80D_PARENTS_NORMAL = 25_000
CAP_80D_PARENTS_SENIOR = 50_000
CAP_80TTA = 10_000
CAP_80TTB = 50_000
CAP_80U_NORMAL = 75_000
CAP_80U_SEVERE = 125_000


def compute_deductions(
    d: DeductionsInput,
    salary: SalaryInput,
    is_senior: bool,
    regime: Literal["old", "new"],
    home_loan_principal: float = 0.0,   # pulled from HousePropertyInput
) -> dict:
    """
    Returns dict with all deduction line items and totals.
    """

    # ── 80CCD(2) Employer NPS — allowed in BOTH regimes ──
    max_ccd2 = salary.basic_salary * 0.10
    ccd2 = min(salary.employer_nps_contribution, max_ccd2)

    if regime == "new":
        # Only employer NPS is available in new regime
        return {
            "raw_80c_pool": 0.0,
            "capped_80c": 0.0,
            "deduction_80d": 0.0,
            "deduction_80ccd_1b": 0.0,
            "deduction_80ccd_2": round(ccd2, 2),
            "deduction_80e": 0.0,
            "deduction_80g": 0.0,
            "deduction_80tta_ttb": 0.0,
            "deduction_80u": 0.0,
            "total_chapter_via": 0.0,
            "new_regime_deductions": round(ccd2, 2),
        }

    # ── Old regime: full Chapter VI-A ──

    # 80C pool
    pool_80c = (
        d.epf
        + d.ppf
        + d.elss
        + d.lic_premium
        + d.nsc
        + home_loan_principal           # from house property
        + d.tuition_fees
        + d.other_80c
    )
    capped_80c = min(pool_80c, CAP_80C)

    # 80D
    self_limit = CAP_80D_SELF_SENIOR if is_senior else CAP_80D_SELF_NORMAL
    parent_limit = CAP_80D_PARENTS_SENIOR if d.parents_senior else CAP_80D_PARENTS_NORMAL
    deduction_80d = min(d.health_insurance_self, self_limit) + min(
        d.health_insurance_parents, parent_limit
    )

    # 80CCD(1B)
    deduction_80ccd_1b = min(d.nps_self, CAP_80CCD_1B)

    # 80E — no cap
    deduction_80e = max(0.0, d.education_loan_interest)

    # 80G
    deduction_80g = d.donations_100pct + (d.donations_50pct * 0.50)
    # Note: qualifying limit (10% of GTI) for some categories is applied
    # in orchestrator once GTI is known; here we take full declared amount.

    # 80TTA / 80TTB
    if is_senior:
        deduction_80tta_ttb = min(d.savings_interest_deduction, CAP_80TTB)
    else:
        deduction_80tta_ttb = min(d.savings_interest_deduction, CAP_80TTA)

    # 80U
    if d.self_disability:
        deduction_80u = CAP_80U_SEVERE if d.disability_severe else CAP_80U_NORMAL
    else:
        deduction_80u = 0.0

    total_chapter_via = round(
        capped_80c
        + deduction_80d
        + deduction_80ccd_1b
        + ccd2
        + deduction_80e
        + deduction_80g
        + deduction_80tta_ttb
        + deduction_80u,
        2,
    )

    return {
        "raw_80c_pool": round(pool_80c, 2),
        "capped_80c": round(capped_80c, 2),
        "deduction_80d": round(deduction_80d, 2),
        "deduction_80ccd_1b": round(deduction_80ccd_1b, 2),
        "deduction_80ccd_2": round(ccd2, 2),
        "deduction_80e": round(deduction_80e, 2),
        "deduction_80g": round(deduction_80g, 2),
        "deduction_80tta_ttb": round(deduction_80tta_ttb, 2),
        "deduction_80u": round(deduction_80u, 2),
        "total_chapter_via": total_chapter_via,
        "new_regime_deductions": round(ccd2, 2),
    }
