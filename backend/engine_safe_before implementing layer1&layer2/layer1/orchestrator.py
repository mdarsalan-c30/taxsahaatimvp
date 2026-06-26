"""
orchestrator.py
===============
Single public entry point for the ITR Layer-1 engine.

Usage
-----
    from orchestrator import compute_itr
    from models import UserInput, SalaryInput, ...

    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000))
    result = compute_itr(user)
    print(result.regime_comparison.recommended_regime)
    print(result.net_payable)

The function raises ValueError if the input is out of scope
(NRI, minor, etc.) with a clear message.
"""

from __future__ import annotations

from models import (
    UserInput,
    IncomeHeadsResult,
    DeductionsResult,
    ITRResult,
)
from profiler import build_profile
from salary import compute_net_salary
from house_property import compute_house_property
from other_income import compute_other_income
from capital_gains import compute_capital_gains
from deductions import compute_deductions
from regime_compare import compute_regime_comparison
from risk_checker import run_risk_checks
from confidence import compute_confidence


def compute_itr(user: UserInput) -> ITRResult:
    """
    Main computation function.

    Execution order
    ---------------
    1.  Profile validation
    2.  Income heads (salary, house property, other income, capital gains)
    3.  Gross Total Income aggregation
    4.  Deductions (old and new regime variants)
    5.  Regime tax computation (old + new in parallel)
    6.  Regime comparison + recommendation
    7.  Risk flags
    8.  Confidence scoring
    9.  Package into ITRResult
    """

    # ────────────────────────────────────────────
    # 1. Profile & validation
    # ────────────────────────────────────────────
    profile = build_profile(user)
    if profile.out_of_scope_reasons:
        raise ValueError(
            "Input is out of scope for this engine:\n"
            + "\n".join(f"  • {r}" for r in profile.out_of_scope_reasons)
        )

    # ────────────────────────────────────────────
    # 2. Income heads — compute for BOTH regimes
    #    (salary differs between old/new; others are regime-independent)
    # ────────────────────────────────────────────
    salary_old = compute_net_salary(user.salary, regime="old")
    salary_new = compute_net_salary(user.salary, regime="new")

    hp_old = compute_house_property(user.house_property, regime="old")
    hp_new = compute_house_property(user.house_property, regime="new")

    other = compute_other_income(user.other_income)

    cg = compute_capital_gains(user.capital_gains)

    # ────────────────────────────────────────────
    # 3. Gross Total Income (using OLD regime salary for GTI baseline;
    #    the regime fork happens downstream)
    # ────────────────────────────────────────────
    # GTI is computed once (using old regime salary) as the pre-deduction base.
    # The new regime simply applies a smaller deduction set.
    gti_old = round(
        salary_old["net_salary_income"]
        + hp_old["net_house_property_income"]
        + other["total_other_income_gross"]
        + cg["stcg_other_slab"]          # slab-rate STCG flows into normal income
        + cg["stcg_111a_net"]            # special-rate items included in GTI
        + cg["ltcg_112a_net"]
        + cg["ltcg_other_net"],
        2,
    )

    gti_new = round(
        salary_new["net_salary_income"]
        + hp_new["net_house_property_income"]
        + other["total_other_income_gross"]
        + cg["stcg_other_slab"]
        + cg["stcg_111a_net"]
        + cg["ltcg_112a_net"]
        + cg["ltcg_other_net"],
        2,
    )

    # ────────────────────────────────────────────
    # 4. Deductions
    # ────────────────────────────────────────────
    # Home loan principal automatically added to 80C pool
    ded_old_dict = compute_deductions(
        d=user.deductions,
        salary=user.salary,
        is_senior=profile.is_senior,
        regime="old",
        home_loan_principal=user.house_property.home_loan_principal,
    )
    ded_new_dict = compute_deductions(
        d=user.deductions,
        salary=user.salary,
        is_senior=profile.is_senior,
        regime="new",
        home_loan_principal=0.0,   # not used in new regime
    )

    deductions_result = DeductionsResult(
        raw_80c_pool=ded_old_dict["raw_80c_pool"],
        capped_80c=ded_old_dict["capped_80c"],
        deduction_80d=ded_old_dict["deduction_80d"],
        deduction_80ccd_1b=ded_old_dict["deduction_80ccd_1b"],
        deduction_80ccd_2=ded_old_dict["deduction_80ccd_2"],
        deduction_80e=ded_old_dict["deduction_80e"],
        deduction_80g=ded_old_dict["deduction_80g"],
        deduction_80tta_ttb=ded_old_dict["deduction_80tta_ttb"],
        deduction_80u=ded_old_dict["deduction_80u"],
        total_chapter_via=ded_old_dict["total_chapter_via"],
        new_regime_deductions=ded_new_dict["new_regime_deductions"],
    )

    # ────────────────────────────────────────────
    # 5 + 6. Regime comparison
    # ────────────────────────────────────────────
    total_tax_paid = (
        user.taxes_paid.tds_salary
        + user.taxes_paid.tds_other
        + user.taxes_paid.advance_tax_paid
        + user.taxes_paid.self_assessment_tax_paid
    )

    # We use old GTI as the base for comparison (most common convention)
    # The new regime's lower standard deduction difference is captured in
    # new_regime_deductions being higher (75k vs 50k std deduction is
    # already baked into salary_new vs salary_old income heads).
    # We pass gti_old as the GTI; the regime_compare module subtracts
    # old or new deductions accordingly.
    comparison = compute_regime_comparison(
        gti=gti_old,
        chapter_via_deductions=ded_old_dict["total_chapter_via"],
        new_regime_deductions=ded_new_dict["new_regime_deductions"]
                              + (salary_new["standard_deduction"] - salary_old["standard_deduction"]),
        special_rate_components=cg,
        stcg_other_slab=cg["stcg_other_slab"],
        age=user.age,
        tds_and_advance=total_tax_paid,
    )

    # ────────────────────────────────────────────
    # 7. Build IncomeHeadsResult (use old regime values for the summary;
    #    new regime differences are captured in regime comparison)
    # ────────────────────────────────────────────
    income_heads = IncomeHeadsResult(
        gross_salary=salary_old["gross_salary"],
        standard_deduction=salary_old["standard_deduction"],
        hra_exemption=salary_old["hra_exemption"],
        professional_tax=salary_old["professional_tax"],
        lta_exemption=salary_old["lta_exemption"],
        net_salary_income=salary_old["net_salary_income"],
        gross_annual_value=hp_old["gross_annual_value"],
        municipal_tax=hp_old["municipal_tax"],
        net_annual_value=hp_old["net_annual_value"],
        repair_deduction_30pct=hp_old["repair_deduction_30pct"],
        interest_on_loan_24b=hp_old["interest_on_loan_24b"],
        net_house_property_income=hp_old["net_house_property_income"],
        excess_interest_disallowed=hp_old["excess_interest_disallowed"],
        fd_interest=other["fd_interest"],
        savings_interest_gross=other["savings_interest_gross"],
        dividend_income=other["dividend_income"],
        stcg_other_slab=cg["stcg_other_slab"],
        total_other_income=other["total_other_income_gross"],
        stcg_111a_net=cg["stcg_111a_net"],
        ltcg_112a_net=cg["ltcg_112a_net"],
        ltcg_other_net=cg["ltcg_other_net"],
        gross_total_income=gti_old,
        carry_forward_loss_set_off=cg["carry_forward_stcl"] + cg["carry_forward_ltcl"],
    )

    # ────────────────────────────────────────────
    # 8. Risk flags
    # ────────────────────────────────────────────
    risk_flags = run_risk_checks(user, income_heads, deductions_result, comparison)

    # ────────────────────────────────────────────
    # 9. Confidence
    # ────────────────────────────────────────────
    confidence = compute_confidence(user, gti_old)

    return ITRResult(
        assessment_year=user.assessment_year,
        age=user.age,
        mode=user.mode,
        income_heads=income_heads,
        deductions=deductions_result,
        regime_comparison=comparison,
        risk_flags=risk_flags,
        confidence=confidence,
    )
