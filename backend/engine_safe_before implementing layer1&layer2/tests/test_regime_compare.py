"""Regime comparison edge cases — refund display, default draft profile, deductions lost."""

from __future__ import annotations

import pytest

from models import DeductionsInput, OtherIncomeInput, SalaryInput, TaxPaidInput, UserInput
from orchestrator import compute_itr


def _default_draft_user() -> UserInput:
    """Mirrors lib/engine/draftToUserInput default draft (₹12L salary, ₹85k TDS, FD ₹18.4k)."""
    return UserInput(
        age=32,
        mode="estimate",
        residential_status="resident",
        assessment_year="2025-26",
        salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000),
        other_income=OtherIncomeInput(fd_interest=18_400),
        deductions=DeductionsInput(
            epf=150_000,
            health_insurance_self=25_000,
            nps_self=50_000,
        ),
        taxes_paid=TaxPaidInput(tds_salary=85_000),
    )


def test_default_draft_gti_and_refund():
    result = compute_itr(_default_draft_user())
    rc = result.regime_comparison

    assert result.income_heads.gross_total_income == pytest.approx(1_168_400, abs=1)
    assert rc.recommended_regime == "new"
    assert rc.new.total_tax == pytest.approx(0, abs=1)
    assert rc.new.net_payable == pytest.approx(-85_000, abs=1)
    assert rc.old.net_payable == pytest.approx(20_227.2, abs=1)
    assert rc.tax_saving == pytest.approx(105_227.2, abs=1)


def test_high_tds_refund_equals_excess_tds_when_nil_tax():
    """When liability is nil, refund should equal TDS paid (not a phantom amount)."""
    user = UserInput(
        age=30,
        salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000),
        taxes_paid=TaxPaidInput(tds_salary=85_000),
    )
    result = compute_itr(user)
    rc = result.regime_comparison

    assert rc.new.total_tax == pytest.approx(0, abs=1)
    assert rc.new.net_payable == pytest.approx(-85_000, abs=1)
    assert rc.new.tds_and_advance_tax == pytest.approx(85_000, abs=1)


def test_deductions_lost_excludes_standard_deduction_delta():
    """Chapter VI-A forfeited must not subtract the new-regime std-ded salary adjustment."""
    result = compute_itr(_default_draft_user())
    rc = result.regime_comparison

    assert result.deductions.total_chapter_via == pytest.approx(225_000, abs=1)
    assert rc.deductions_lost_in_new == pytest.approx(225_000, abs=1)


def test_net_payable_equals_total_tax_minus_tds_both_regimes():
    user = _default_draft_user()
    result = compute_itr(user)
    rc = result.regime_comparison

    for side in (rc.old, rc.new):
        assert side.net_payable == pytest.approx(
            side.total_tax - side.tds_and_advance_tax, abs=1
        )


def test_regime_recommendation_by_lower_total_tax():
    user = UserInput(
        age=30,
        salary=SalaryInput(gross_salary=2_000_000, basic_salary=1_000_000),
        deductions=DeductionsInput(
            epf=50_000,
            ppf=50_000,
            elss=50_000,
            health_insurance_self=25_000,
            nps_self=50_000,
        ),
    )
    result = compute_itr(user)
    rc = result.regime_comparison

    cheaper = "old" if rc.old.total_tax <= rc.new.total_tax else "new"
    assert rc.recommended_regime == cheaper
    assert rc.tax_saving == pytest.approx(
        abs(rc.old.total_tax - rc.new.total_tax), abs=1
    )
