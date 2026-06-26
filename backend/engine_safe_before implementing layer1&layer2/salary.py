"""
salary.py
=========
Computes the taxable salary head.

Key rules
---------
Standard deduction
  Old regime : ₹50,000
  New regime : ₹75,000  (Finance Act 2023 / Budget 2024)

HRA exemption (Sec 10(13A)) — least of three:
  1. Actual HRA received
  2. 50% of basic (metro) / 40% of basic (non-metro)
  3. Actual rent paid − 10% of basic

  If the employee does not pay rent OR lives in own house → exemption = 0.
  HRA exemption is allowed in old regime only.
  In new regime, standard deduction (₹75k) replaces most allowances.

Professional tax : fully deductible (Sec 16(iii)), both regimes.
LTA (Sec 10(5)) : exempt only in old regime (actual amount claimed, subject to
                   block-year rules — we take the declared exempt amount as-is).
Employer NPS 80CCD(2) : deductible in BOTH regimes, up to 10% of basic.
  This is handled in deductions.py but the basic salary is needed here.
"""

from __future__ import annotations
from typing import Literal

from models import SalaryInput


OLD_STANDARD_DEDUCTION = 50_000
NEW_STANDARD_DEDUCTION = 75_000


def compute_hra_exemption(
    hra_received: float,
    basic_salary: float,
    actual_rent_paid: float,
    city_tier: Literal["metro", "non_metro"],
) -> float:
    """
    Returns the HRA exemption amount (old regime only).
    Returns 0 if any input is ≤ 0 or rent paid < 10% of basic.
    """
    if hra_received <= 0 or actual_rent_paid <= 0 or basic_salary <= 0:
        return 0.0

    metro_factor = 0.50 if city_tier == "metro" else 0.40

    limb1 = hra_received
    limb2 = basic_salary * metro_factor
    limb3 = max(0.0, actual_rent_paid - 0.10 * basic_salary)

    return round(min(limb1, limb2, limb3), 2)


def compute_net_salary(
    salary: SalaryInput,
    regime: Literal["old", "new"],
) -> dict:
    """
    Returns a dict with all intermediate salary head values.

    In new regime:
      - HRA exemption is NOT available (use std deduction ₹75k instead)
      - LTA exemption is NOT available
    In old regime:
      - HRA exemption computed if rent is paid
      - LTA claimed as declared
    """
    std_deduction = (
        NEW_STANDARD_DEDUCTION if regime == "new" else OLD_STANDARD_DEDUCTION
    )

    if regime == "old":
        hra_exemption = compute_hra_exemption(
            salary.hra_received,
            salary.basic_salary,
            salary.actual_rent_paid,
            salary.city_tier,
        )
        lta_exemption = salary.lta_claimed
    else:
        hra_exemption = 0.0
        lta_exemption = 0.0

    # Professional tax is deductible in both regimes
    prof_tax = salary.professional_tax

    # Taxable perquisites are always added
    taxable_gross = salary.gross_salary + salary.perquisites_taxable

    net_salary = (
        taxable_gross
        - std_deduction
        - hra_exemption
        - lta_exemption
        - prof_tax
    )

    return {
        "gross_salary": taxable_gross,
        "standard_deduction": std_deduction,
        "hra_exemption": hra_exemption,
        "professional_tax": prof_tax,
        "lta_exemption": lta_exemption,
        "net_salary_income": max(0.0, round(net_salary, 2)),
    }
