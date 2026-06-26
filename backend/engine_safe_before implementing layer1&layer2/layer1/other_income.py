"""
other_income.py
===============
Computes income under the head "Income from Other Sources" (Sec 56).

Items handled
-------------
- FD interest (fully taxable at slab; TDS deducted by bank at 10%)
- Savings account interest (taxable; deduction via 80TTA/TTB in old regime)
- Dividend income (taxable since FY 2020-21; TDS 10% above ₹5,000 p.a.)

Note: Sec 80TTA/TTB deduction on savings interest is computed in deductions.py,
not here. The gross interest flows into GTI; the deduction reduces it later.
"""

from __future__ import annotations
from models import OtherIncomeInput


def compute_other_income(oi: OtherIncomeInput) -> dict:
    """
    Returns a flat dict of other income components and total.
    All amounts are gross (pre-deduction / pre-TDS credit).
    """
    total = round(
        oi.fd_interest
        + oi.savings_account_interest
        + oi.dividend_income,
        2,
    )
    return {
        "fd_interest": round(oi.fd_interest, 2),
        "savings_interest_gross": round(oi.savings_account_interest, 2),
        "dividend_income": round(oi.dividend_income, 2),
        "total_other_income_gross": total,
    }
