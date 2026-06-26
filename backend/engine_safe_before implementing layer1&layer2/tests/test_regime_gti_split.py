"""Regime-specific GTI — HRA and HP must not bias new-regime tax."""

from __future__ import annotations

import pytest

from models import HousePropertyInput, SalaryInput, UserInput
from orchestrator import compute_itr


def test_hra_claimant_new_regime_uses_higher_gti():
    """New regime must not inherit old-regime HRA exemption in GTI."""
    user = UserInput(
        age=32,
        salary=SalaryInput(
            gross_salary=2_000_000,
            basic_salary=1_000_000,
            hra_received=600_000,
            actual_rent_paid=480_000,
            city_tier="metro",
        ),
    )
    result = compute_itr(user)
    rc = result.regime_comparison

    assert result.income_heads.hra_exemption > 0
    assert rc.new.taxable_income > rc.old.taxable_income


def test_hra_and_80gg_mutually_exclusive():
    from deductions import compute_deductions
    from models import DeductionsInput

    salary = SalaryInput(
        gross_salary=1_200_000,
        basic_salary=600_000,
        hra_received=200_000,
        actual_rent_paid=180_000,
        city_tier="metro",
    )
    d = DeductionsInput(rent_paid_no_hra=60_000)
    out = compute_deductions(d, salary, is_senior=False, regime="old", adjusted_total_income=1_000_000)
    assert out["deduction_80gg"] == 0.0


def test_ltcl_carry_forward_not_phantom():
    from capital_gains import compute_capital_gains
    from models import CapitalGainsInput

    cg = compute_capital_gains(
        CapitalGainsInput(ltcg_112a=100_000, ltcl=80_000)
    )
    assert cg["ltcg_112a_net"] == pytest.approx(20_000, abs=1)
    assert cg["carry_forward_ltcl"] == pytest.approx(0, abs=1)
