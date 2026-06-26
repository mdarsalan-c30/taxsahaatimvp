"""
orchestrator.py
===============
Single public entry point for the ITR Layer-1 engine.

Usage
-----
    from orchestrator import compute_itr, build_layer2_handoff
    from models import UserInput, SalaryInput, ...

    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000))
    result = compute_itr(user)
    handoff = build_layer2_handoff(result, user)
"""

from __future__ import annotations

from models import (
    UserInput,
    IncomeHeadsResult,
    DeductionsResult,
    BusinessIncomeResult,
    ITRResult,
)
from profiler import build_profile
from salary import compute_net_salary
from house_property import compute_house_property
from other_income import compute_other_income
from capital_gains import compute_capital_gains
from business_income import compute_business_income
from deductions import compute_deductions
from regime_compare import compute_regime_comparison
from risk_checker import run_risk_checks
from confidence import compute_confidence
from recommendations import generate_recommendations


def _auto_fill_deduction_inputs(user: UserInput, is_senior: bool) -> None:
    """Populate 80TTA/80TTB from savings interest if caller left it at zero."""
    d = user.deductions
    if d.savings_interest_deduction == 0 and user.other_income.savings_account_interest > 0:
        cap = 50_000 if is_senior else 10_000
        d.savings_interest_deduction = min(user.other_income.savings_account_interest, cap)


def compute_itr(user: UserInput) -> ITRResult:
    """
    Main computation function.

    Execution order
    ---------------
    1.  Profile validation + ITR form routing
    2.  Income heads (salary, HP, other, CG, business)
    3.  Gross Total Income aggregation
    4.  Deductions (old and new regime variants)
    5.  Regime tax computation (old + new in parallel)
    6.  Regime comparison + recommendation
    7.  Lawful optimization recommendations (Layer 2 hook)
    8.  Risk flags
    9.  Confidence scoring
    10. Package into ITRResult
    """

    profile = build_profile(user)
    if profile.out_of_scope_reasons:
        raise ValueError(
            "Input is out of scope for this engine:\n"
            + "\n".join(f"  • {r}" for r in profile.out_of_scope_reasons)
        )

    _auto_fill_deduction_inputs(user, profile.is_senior)

    salary_old = compute_net_salary(user.salary, regime="old")
    salary_new = compute_net_salary(user.salary, regime="new")

    hp_old = compute_house_property(user.house_property, regime="old")
    hp_new = compute_house_property(user.house_property, regime="new")

    other = compute_other_income(user.other_income)
    cg = compute_capital_gains(user.capital_gains)
    biz_dict = compute_business_income(user.business)

    biz_income = biz_dict["net_business_income"]

    gti_old = max(
        0.0,
        round(
            salary_old["net_salary_income"]
            + hp_old["net_house_property_income"]
            + other["total_other_income_gross"]
            + biz_income
            + cg["stcg_other_slab"]
            + cg["stcg_111a_net"]
            + cg["ltcg_112a_net"]
            + cg["ltcg_other_net"],
            2,
        ),
    )

    gti_new = max(
        0.0,
        round(
            salary_new["net_salary_income"]
            + hp_new["net_house_property_income"]
            + other["total_other_income_gross"]
            + biz_income
            + cg["stcg_other_slab"]
            + cg["stcg_111a_net"]
            + cg["ltcg_112a_net"]
            + cg["ltcg_other_net"],
            2,
        ),
    )

    ded_old_dict = compute_deductions(
        d=user.deductions,
        salary=user.salary,
        is_senior=profile.is_senior,
        regime="old",
        home_loan_principal=user.house_property.home_loan_principal,
        adjusted_total_income=gti_old,
    )
    ded_new_dict = compute_deductions(
        d=user.deductions,
        salary=user.salary,
        is_senior=profile.is_senior,
        regime="new",
        home_loan_principal=0.0,
    )

    deductions_result = DeductionsResult(
        raw_80c_pool=ded_old_dict["raw_80c_pool"],
        capped_80c=ded_old_dict["capped_80c"],
        deduction_80d=ded_old_dict["deduction_80d"],
        deduction_80ccd_1b=ded_old_dict["deduction_80ccd_1b"],
        deduction_80ccd_2=ded_old_dict["deduction_80ccd_2"],
        deduction_80e=ded_old_dict["deduction_80e"],
        deduction_80g=ded_old_dict["deduction_80g"],
        deduction_80gg=ded_old_dict["deduction_80gg"],
        deduction_80tta_ttb=ded_old_dict["deduction_80tta_ttb"],
        deduction_80u=ded_old_dict["deduction_80u"],
        total_chapter_via=ded_old_dict["total_chapter_via"],
        new_regime_deductions=ded_new_dict["new_regime_deductions"],
    )

    total_tax_paid = (
        user.taxes_paid.tds_salary
        + user.taxes_paid.tds_other
        + user.taxes_paid.advance_tax_paid
        + user.taxes_paid.self_assessment_tax_paid
    )

    std_ded_delta = salary_new["standard_deduction"] - salary_old["standard_deduction"]
    comparison = compute_regime_comparison(
        gti_old=gti_old,
        gti_new=gti_new,
        chapter_via_deductions=ded_old_dict["total_chapter_via"],
        new_regime_deductions=ded_new_dict["new_regime_deductions"],
        special_rate_components=cg,
        stcg_other_slab=cg["stcg_other_slab"],
        age=user.age,
        tds_and_advance=total_tax_paid,
        standard_deduction_delta=std_ded_delta,
        late_filing=user.late_filing,
    )

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

    business_result = BusinessIncomeResult(
        presumptive_44ad=biz_dict["presumptive_44ad"],
        presumptive_44ada=biz_dict["presumptive_44ada"],
        books_profit=biz_dict["books_profit"],
        net_business_income=biz_dict["net_business_income"],
        section_used=biz_dict["section_used"],
        presumptive_eligible=biz_dict["presumptive_eligible"],
    )

    risk_flags = run_risk_checks(user, profile, income_heads, deductions_result, comparison)
    recommendations = generate_recommendations(
        user, profile, income_heads, deductions_result, comparison, business_result
    )
    confidence = compute_confidence(user, profile, gti_old)

    return ITRResult(
        assessment_year=user.assessment_year,
        age=user.age,
        mode=user.mode,
        profile=profile,
        income_heads=income_heads,
        business_income=business_result,
        deductions=deductions_result,
        regime_comparison=comparison,
        risk_flags=risk_flags,
        recommendations=recommendations,
        confidence=confidence,
    )


def build_layer2_handoff(result: ITRResult, user: UserInput) -> dict:
    """JSON payload for RAG Layer 2 CA brain (screens 17–18)."""
    rc = result.regime_comparison
    rec = rc.recommended_regime
    net_old = rc.old.net_payable
    net_new = rc.new.net_payable

    return {
        "assessment_year": result.assessment_year,
        "mode": result.mode,
        "profile": {
            "age": result.age,
            "age_group": result.profile.age_group,
            "is_senior": result.profile.is_senior,
            "itr_form": result.profile.itr_form,
            "routing_reasons": result.profile.routing_reasons,
            "expert_required": result.profile.expert_required,
            "residential_status": user.residential_status,
            "income_band": user.profile_flags.income_band,
            "business_type_code": user.profile_flags.business_type_code,
        },
        "income_summary": {
            "gross_total_income": result.income_heads.gross_total_income,
            "net_salary_income": result.income_heads.net_salary_income,
            "net_house_property_income": result.income_heads.net_house_property_income,
            "net_business_income": result.business_income.net_business_income,
            "total_other_income": result.income_heads.total_other_income,
            "stcg_111a_net": result.income_heads.stcg_111a_net,
            "ltcg_112a_net": result.income_heads.ltcg_112a_net,
        },
        "deductions_summary": {
            "total_chapter_via": result.deductions.total_chapter_via,
            "capped_80c": result.deductions.capped_80c,
            "deduction_80d": result.deductions.deduction_80d,
            "deductions_lost_in_new": rc.deductions_lost_in_new,
        },
        "regime_comparison": {
            "recommended_regime": rec,
            "old_net_payable": net_old,
            "new_net_payable": net_new,
            "tax_saving": rc.tax_saving,
            "breakeven_deductions": rc.breakeven_deductions,
        },
        "recommendations": [
            {
                "id": r.id,
                "plain_english": r.plain_english,
                "gov_section": r.gov_section,
                "risk": r.risk,
                "proof_required": r.proof_required,
                "requires_user_confirmation": r.requires_user_confirmation,
                "estimated_benefit": r.estimated_benefit,
                "blocked": r.blocked,
            }
            for r in result.recommendations
            if not r.blocked
        ],
        "risk_flags": [
            {"code": f.code, "severity": f.severity, "message": f.message}
            for f in result.risk_flags
        ],
        "confidence": {
            "completeness_score": result.confidence.completeness_score,
            "filing_ready": result.confidence.filing_ready,
            "missing_documents": result.confidence.missing_documents,
            "ca_escalation_recommended": result.confidence.ca_escalation_recommended,
        },
        "profession_hint": user.business.profession_name or None,
        "layer1_complete": True,
    }
