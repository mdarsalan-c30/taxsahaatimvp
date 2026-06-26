"""
engine.py — Layer 1: Deterministic Tax Computation
====================================================
All Layer 1 logic in one file. No external dependencies.

Public API:
    result = compute_itr(user_input)   # returns ITRResult

Covers (FY 2024-25 / AY 2025-26, salaried residents only):
  - Salary: HRA exemption, standard deduction, LTA, professional tax
  - House property: SOP (₹2L cap), let-out (30% repair), new-regime rules
  - Other income: FD interest, savings interest, dividends
  - Capital gains: STCL/LTCL set-off, LTCG 112A exemption, special rates
  - Deductions: 80C (₹1.5L cap), 80D, 80CCD, 80E, 80G, 80TTA/TTB, 80U
  - Tax: progressive slabs, 87A rebate, surcharge + marginal relief, 4% cess
  - Regime comparison: old vs new, breakeven via binary search
  - Risk flags and document confidence scoring
"""

from __future__ import annotations
from typing import Literal
from models import (
    UserInput, ITRResult,
    IncomeHeadsResult, DeductionsResult, SlabTaxResult,
    RegimeComparisonResult, RiskFlag, ConfidenceResult,
)


# ═══════════════════════════════════════════════════════════════
#  SECTION 1: PROFILER
# ═══════════════════════════════════════════════════════════════

def _build_profile(user: UserInput) -> dict:
    """Validate scope and extract senior/form flags."""
    out_of_scope = []
    if user.residential_status in ("nri", "rnor"):
        out_of_scope.append("NRI/RNOR: foreign income not supported in this version.")
    if user.age < 18:
        out_of_scope.append("Minor (age < 18): income clubbing with parent not supported.")
    if out_of_scope:
        raise ValueError("Input out of scope:\n" + "\n".join(f"  • {r}" for r in out_of_scope))

    is_senior = user.age >= 60
    is_super_senior = user.age >= 80
    cg = user.capital_gains
    has_cg = any([cg.stcg_111a, cg.ltcg_112a, cg.stcg_other, cg.ltcg_other,
                  cg.stcl_equity, cg.ltcl])
    itr_form = "ITR-2" if has_cg else "ITR-1"
    if itr_form == "ITR-1":
        total = (user.salary.gross_salary + user.other_income.fd_interest +
                 user.other_income.savings_account_interest + user.other_income.dividend_income)
        if total > 50_00_000:
            itr_form = "ITR-2"
    return {"is_senior": is_senior, "is_super_senior": is_super_senior, "itr_form": itr_form}


# ═══════════════════════════════════════════════════════════════
#  SECTION 2: INCOME HEADS
# ═══════════════════════════════════════════════════════════════

_OLD_SD = 50_000
_NEW_SD = 75_000


def _hra_exemption(hra: float, basic: float, rent: float, tier: str) -> float:
    """Sec 10(13A): least of actual HRA, 50%/40% of basic, rent − 10% of basic."""
    if hra <= 0 or rent <= 0 or basic <= 0:
        return 0.0
    factor = 0.50 if tier == "metro" else 0.40
    return round(min(hra, basic * factor, max(0.0, rent - 0.10 * basic)), 2)


def _compute_salary(user: UserInput, regime: str) -> dict:
    s = user.salary
    std = _NEW_SD if regime == "new" else _OLD_SD
    hra = _hra_exemption(s.hra_received, s.basic_salary, s.actual_rent_paid, s.city_tier) \
          if regime == "old" else 0.0
    lta = s.lta_claimed if regime == "old" else 0.0
    gross = s.gross_salary + s.perquisites_taxable
    net = max(0.0, round(gross - std - hra - lta - s.professional_tax, 2))
    return {"gross_salary": gross, "standard_deduction": std, "hra_exemption": hra,
            "professional_tax": s.professional_tax, "lta_exemption": lta,
            "net_salary_income": net}


def _compute_house_property(user: UserInput, regime: str) -> dict:
    hp = user.house_property
    zero = {"gross_annual_value": 0.0, "municipal_tax": 0.0, "net_annual_value": 0.0,
            "repair_deduction_30pct": 0.0, "interest_on_loan_24b": 0.0,
            "net_house_property_income": 0.0, "excess_interest_disallowed": 0.0}
    if hp.property_type == "none":
        return zero
    total_int = hp.home_loan_interest + hp.pre_construction_interest
    if hp.property_type == "self_occupied":
        if regime == "new":
            allowed, excess = 0.0, total_int
        else:
            allowed = min(total_int, 200_000)
            excess = max(0.0, total_int - 200_000)
        return {**zero, "interest_on_loan_24b": allowed,
                "net_house_property_income": round(-allowed, 2),
                "excess_interest_disallowed": round(excess, 2)}
    # let_out
    gav = hp.annual_rent_received
    nav = gav
    repair = round(nav * 0.30, 2)
    net = round(nav - repair - total_int, 2)
    excess = 0.0
    if net < 0:
        if regime == "new":
            excess, net = abs(net), 0.0
        elif abs(net) > 200_000:
            excess = abs(net) - 200_000
            net = -200_000
    return {"gross_annual_value": round(gav, 2), "municipal_tax": 0.0,
            "net_annual_value": round(nav, 2), "repair_deduction_30pct": round(repair, 2),
            "interest_on_loan_24b": round(total_int, 2),
            "net_house_property_income": round(net, 2),
            "excess_interest_disallowed": round(excess, 2)}


def _compute_other_income(user: UserInput) -> dict:
    oi = user.other_income
    total = round(oi.fd_interest + oi.savings_account_interest + oi.dividend_income, 2)
    return {"fd_interest": round(oi.fd_interest, 2),
            "savings_interest_gross": round(oi.savings_account_interest, 2),
            "dividend_income": round(oi.dividend_income, 2),
            "total_other_income_gross": total}


def _compute_capital_gains(user: UserInput) -> dict:
    """Apply STCL/LTCL set-off hierarchy and split into buckets."""
    cg = user.capital_gains
    s111a = max(0.0, cg.stcg_111a)
    l112a = max(0.0, cg.ltcg_112a)
    soth  = max(0.0, cg.stcg_other)
    loth  = max(0.0, cg.ltcg_other)
    stcl  = max(0.0, cg.stcl_equity)
    ltcl  = max(0.0, cg.ltcl)

    # Step 1: STCL vs STCG
    s111a_n = max(0.0, s111a - stcl); stcl = max(0.0, stcl - s111a)
    soth_n  = max(0.0, soth  - stcl); stcl = max(0.0, stcl - soth)
    # Step 2: residual STCL vs LTCG
    l112a_n = max(0.0, l112a - stcl); stcl = max(0.0, stcl - l112a)
    loth_n  = max(0.0, loth  - stcl); stcl = max(0.0, stcl - loth)
    # Step 3: LTCL vs LTCG only
    l112a_n = max(0.0, l112a_n - ltcl); ltcl = max(0.0, ltcl - l112a_n)
    loth_n  = max(0.0, loth_n  - ltcl); ltcl = max(0.0, ltcl - loth_n)
    # Step 4: LTCG 112A exemption
    l112a_taxable = max(0.0, l112a_n - 125_000)

    return {"stcg_111a_net": round(s111a_n, 2), "ltcg_112a_net": round(l112a_n, 2),
            "ltcg_112a_taxable": round(l112a_taxable, 2), "ltcg_other_net": round(loth_n, 2),
            "stcg_other_slab": round(soth_n, 2),
            "carry_forward_stcl": round(stcl, 2), "carry_forward_ltcl": round(ltcl, 2),
            "ltcg_112a_exemption_used": round(min(l112a_n, 125_000), 2)}


# ═══════════════════════════════════════════════════════════════
#  SECTION 3: DEDUCTIONS
# ═══════════════════════════════════════════════════════════════

def _compute_deductions(user: UserInput, is_senior: bool, regime: str,
                        home_loan_principal: float = 0.0) -> dict:
    d = user.deductions
    s = user.salary
    ccd2 = min(s.employer_nps_contribution, s.basic_salary * 0.10)
    if regime == "new":
        return {"raw_80c_pool": 0.0, "capped_80c": 0.0, "deduction_80d": 0.0,
                "deduction_80ccd_1b": 0.0, "deduction_80ccd_2": round(ccd2, 2),
                "deduction_80e": 0.0, "deduction_80g": 0.0, "deduction_80tta_ttb": 0.0,
                "deduction_80u": 0.0, "total_chapter_via": 0.0,
                "new_regime_deductions": round(ccd2, 2)}

    pool = d.epf + d.ppf + d.elss + d.lic_premium + d.nsc + home_loan_principal \
           + d.tuition_fees + d.other_80c
    c80c = min(pool, 150_000)

    d80d_self = min(d.health_insurance_self, 50_000 if is_senior else 25_000)
    d80d_par  = min(d.health_insurance_parents, 50_000 if d.parents_senior else 25_000)
    d80d = d80d_self + d80d_par

    d80ccd1b = min(d.nps_self, 50_000)
    d80e     = max(0.0, d.education_loan_interest)
    d80g     = d.donations_100pct + d.donations_50pct * 0.50
    d80ttx   = min(d.savings_interest_deduction, 50_000 if is_senior else 10_000)
    d80u     = (125_000 if d.disability_severe else 75_000) if d.self_disability else 0.0

    total = round(c80c + d80d + d80ccd1b + ccd2 + d80e + d80g + d80ttx + d80u, 2)
    return {"raw_80c_pool": round(pool, 2), "capped_80c": round(c80c, 2),
            "deduction_80d": round(d80d, 2), "deduction_80ccd_1b": round(d80ccd1b, 2),
            "deduction_80ccd_2": round(ccd2, 2), "deduction_80e": round(d80e, 2),
            "deduction_80g": round(d80g, 2), "deduction_80tta_ttb": round(d80ttx, 2),
            "deduction_80u": round(d80u, 2), "total_chapter_via": total,
            "new_regime_deductions": round(ccd2, 2)}


# ═══════════════════════════════════════════════════════════════
#  SECTION 4: TAX SLABS, SURCHARGE, CESS
# ═══════════════════════════════════════════════════════════════

_OLD_GENERAL    = [(250_000,0.0),(500_000,0.05),(1_000_000,0.20),(None,0.30)]
_OLD_SENIOR     = [(300_000,0.0),(500_000,0.05),(1_000_000,0.20),(None,0.30)]
_OLD_SUPER      = [(500_000,0.0),(1_000_000,0.20),(None,0.30)]
_NEW_SLABS      = [(400_000,0.0),(800_000,0.05),(1_200_000,0.10),(1_600_000,0.15),
                   (2_000_000,0.20),(2_400_000,0.25),(None,0.30)]
_SURCHARGE_OLD  = [(5_000_000,0.0),(10_000_000,0.10),(20_000_000,0.15),
                   (50_000_000,0.25),(None,0.37)]
_SURCHARGE_NEW  = [(5_000_000,0.0),(10_000_000,0.10),(20_000_000,0.15),(None,0.25)]

def _slab_tax(income: float, slabs: list) -> float:
    if income <= 0:
        return 0.0
    tax, prev = 0.0, 0.0
    for upper, rate in slabs:
        chunk = (min(income, upper) if upper else income) - prev
        if chunk <= 0:
            break
        tax += chunk * rate
        if not upper or income <= upper:
            break
        prev = upper
    return round(tax, 2)

def _surcharge_rate(income: float, bands: list) -> float:
    for upper, rate in bands:
        if not upper or income <= upper:
            return rate
    return 0.0

def _rebate_87a(income: float, tax: float, regime: str) -> float:
    if regime == "old":
        return min(tax, 12_500) if income <= 500_000 else 0.0
    return tax if income <= 1_200_000 else 0.0

def _special_rate_tax(cg: dict) -> float:
    stcg_tax  = max(0.0, cg["stcg_111a_net"]) * 0.20
    ltcg_tax  = max(0.0, cg["ltcg_112a_net"] - 125_000) * 0.125
    ltcg_o    = max(0.0, cg["ltcg_other_net"]) * 0.20
    return round(stcg_tax + ltcg_tax + ltcg_o, 2)

def _compute_full_tax(taxable: float, regime: str, age: int,
                      spec_tax: float, surcharge_base: float) -> dict:
    taxable = max(0.0, taxable)
    slabs = (_NEW_SLABS if regime == "new"
             else _OLD_SUPER if age >= 80
             else _OLD_SENIOR if age >= 60
             else _OLD_GENERAL)
    st = _slab_tax(taxable, slabs)
    reb = _rebate_87a(taxable, st, regime)
    tar = max(0.0, st - reb)
    gross = tar + spec_tax
    bands = _SURCHARGE_NEW if regime == "new" else _SURCHARGE_OLD
    sr = _surcharge_rate(surcharge_base, bands)
    sur = round(gross * sr, 2)
    # marginal relief
    for thr in [5_000_000, 10_000_000, 20_000_000, 50_000_000]:
        if surcharge_base > thr:
            relief = max(0.0, gross + sur - (gross + (surcharge_base - thr)))
            sur = max(0.0, sur - round(relief, 2))
            break
    t_s = gross + sur
    cess = round(t_s * 0.04, 2)
    return {"taxable_income": taxable, "slab_tax": st, "special_rate_tax": spec_tax,
            "gross_tax": gross, "rebate_87a": reb, "tax_after_rebate": tar,
            "surcharge": sur, "surcharge_rate": sr, "marginal_relief": 0.0,
            "tax_plus_surcharge": t_s, "cess": cess, "total_tax": round(t_s + cess, 2)}


# ═══════════════════════════════════════════════════════════════
#  SECTION 5: REGIME COMPARISON
# ═══════════════════════════════════════════════════════════════

def _make_slab_result(regime: str, gti: float, deductions: float, cg: dict,
                      age: int, tds: float) -> SlabTaxResult:
    spec_cg = cg["stcg_111a_net"] + cg["ltcg_112a_net"] + cg["ltcg_other_net"]
    taxable = max(0.0, gti - deductions - spec_cg + cg["stcg_other_slab"])
    sb_base = max(0.0, gti - deductions)
    spec_tax = _special_rate_tax(cg)
    r = _compute_full_tax(taxable, regime, age, spec_tax, sb_base)
    return SlabTaxResult(
        regime=regime, taxable_income=r["taxable_income"], slab_tax=r["slab_tax"],
        special_rate_tax=r["special_rate_tax"], gross_tax=r["gross_tax"],
        rebate_87a=r["rebate_87a"], tax_after_rebate=r["tax_after_rebate"],
        surcharge=r["surcharge"], surcharge_rate=r["surcharge_rate"],
        marginal_relief=r["marginal_relief"], tax_plus_surcharge=r["tax_plus_surcharge"],
        cess=r["cess"], total_tax=r["total_tax"], tds_and_advance_tax=tds,
        net_payable=round(r["total_tax"] - tds, 2))

def _breakeven(gti: float, new_ded: float, cg: dict, age: int, new_tax: float) -> float:
    spec_cg = cg["stcg_111a_net"] + cg["ltcg_112a_net"] + cg["ltcg_other_net"]
    spec_tax = _special_rate_tax(cg)
    def old_at(d):
        t = max(0.0, gti - d - spec_cg + cg["stcg_other_slab"])
        return _compute_full_tax(t, "old", age, spec_tax, max(0.0, gti - d))["total_tax"]
    lo, hi = 0.0, gti
    for _ in range(60):
        mid = (lo + hi) / 2
        (lo if old_at(mid) > new_tax else hi).__class__  # dummy
        if old_at(mid) > new_tax:
            lo = mid
        else:
            hi = mid
    return hi

def _compare_regimes(gti: float, old_ded: float, new_ded: float, cg: dict,
                     age: int, tds: float) -> RegimeComparisonResult:
    old_r = _make_slab_result("old", gti, old_ded, cg, age, tds)
    new_r = _make_slab_result("new", gti, new_ded, cg, age, tds)
    rec = "old" if old_r.total_tax <= new_r.total_tax else "new"
    be  = _breakeven(gti, new_ded, cg, age, new_r.total_tax)
    return RegimeComparisonResult(
        old=old_r, new=new_r, recommended_regime=rec,
        tax_saving=round(abs(old_r.total_tax - new_r.total_tax), 2),
        breakeven_deductions=round(be, 2),
        deductions_lost_in_new=round(max(0.0, old_ded - new_ded), 2),
        old_effective_rate=round(old_r.total_tax / gti * 100, 2) if gti > 0 else 0.0,
        new_effective_rate=round(new_r.total_tax / gti * 100, 2) if gti > 0 else 0.0)


# ═══════════════════════════════════════════════════════════════
#  SECTION 6: RISK FLAGS
# ═══════════════════════════════════════════════════════════════

def _risk_flags(user: UserInput, ih: IncomeHeadsResult,
                ded: DeductionsResult, rc: RegimeComparisonResult) -> list[RiskFlag]:
    flags = []
    def f(code, sev, msg): flags.append(RiskFlag(code=code, severity=sev, message=msg))

    if user.mode == "estimate":
        f("ESTIMATE_MODE_WARNING", "warning",
          "Planning estimate only. Not filing-ready. Upload documents and switch to Exact mode before filing.")
    if ih.gross_total_income > 50_00_000:
        f("INCOME_ABOVE_50L", "info",
          f"GTI ₹{ih.gross_total_income:,.0f} exceeds ₹50L. CA review recommended for surcharge optimisation.")
    if user.salary.multiple_employers:
        f("MULTI_EMPLOYER", "warning",
          "Multiple employers detected. Reconcile all Form 16s and ensure Form 12B was filed.")
    cg = user.capital_gains
    if any([cg.stcg_111a, cg.ltcg_112a, cg.stcg_other, cg.ltcg_other, cg.stcl_equity, cg.ltcl]):
        f("CAPITAL_GAINS_PRESENT", "info", "Capital gains present — ITR-2 required, not ITR-1.")
        if not user.documents.has_capital_gains_statement:
            f("MISSING_CG_STATEMENT", "warning",
              "Capital gains declared but no statement uploaded. Download from CAMS/Zerodha/Groww.")
        if cg.ltcg_112a > 125_000:
            f("LTCG_EXEMPTION_APPLIED", "info",
              f"LTCG 112A ₹{cg.ltcg_112a:,.0f} exceeds ₹1.25L exemption. Verify acquisition dates.")
    if ded.raw_80c_pool > 150_000:
        f("80C_OVERSHOT", "warning",
          f"80C pool ₹{ded.raw_80c_pool:,.0f} exceeds ₹1.5L cap. "
          f"₹{ded.raw_80c_pool - 150_000:,.0f} wasted — redirect to 80CCD(1B) NPS.")
    if ih.excess_interest_disallowed > 0:
        f("HOME_LOAN_INTEREST_CAP", "info",
          f"SOP interest ₹{ih.interest_on_loan_24b:,.0f} exceeds ₹2L cap. "
          f"₹{ih.excess_interest_disallowed:,.0f} disallowed.")
    if not user.documents.has_form16:
        f("MISSING_FORM16", "error", "Form 16 not uploaded — mandatory for exact filing.")
    if not user.documents.has_ais:
        f("MISSING_AIS", "warning", "AIS not uploaded. ITD cross-checks AIS against your return.")
    if not user.documents.has_form26as:
        f("MISSING_26AS", "warning", "Form 26AS not uploaded — TDS credit cannot be verified.")
    total_tds = user.taxes_paid.tds_salary + user.taxes_paid.tds_other
    net_pay = rc.old.net_payable if rc.recommended_regime == "old" else rc.new.net_payable
    if net_pay > 10_000 and total_tds == 0:
        f("TDS_MISMATCH", "warning",
          f"Tax payable ₹{net_pay:,.0f} but no TDS recorded. Verify Form 16 / 26AS.")
    taxable = rc.old.taxable_income if rc.recommended_regime == "old" else rc.new.taxable_income
    if taxable > 250_000 and user.taxes_paid.advance_tax_paid == 0 and total_tds < 5_000:
        f("ADVANCE_TAX_CHECK", "info",
          "Taxable income > ₹2.5L with no advance tax. Interest u/s 234B/234C may apply.")
    return flags


# ═══════════════════════════════════════════════════════════════
#  SECTION 7: CONFIDENCE SCORING
# ═══════════════════════════════════════════════════════════════

_DOC_WEIGHTS  = {"has_form16": 35, "has_ais": 20, "has_form26as": 20,
                 "has_bank_interest_cert": 10, "has_home_loan_cert": 10,
                 "has_capital_gains_statement": 5}
_ALWAYS_REQ   = {"has_form16", "has_ais", "has_form26as"}
_DOC_NAMES    = {"has_form16": "Form 16 (Part A + B)", "has_ais": "AIS",
                 "has_form26as": "Form 26AS", "has_bank_interest_cert": "Bank interest certificate",
                 "has_home_loan_cert": "Home loan certificate",
                 "has_capital_gains_statement": "Capital gains statement"}

def _confidence(user: UserInput, gti: float) -> ConfidenceResult:
    docs = user.documents
    flag_map = {"has_form16": docs.has_form16, "has_ais": docs.has_ais,
                "has_form26as": docs.has_form26as, "has_bank_interest_cert": docs.has_bank_interest_cert,
                "has_home_loan_cert": docs.has_home_loan_cert,
                "has_capital_gains_statement": docs.has_capital_gains_statement}
    relevant = set(_ALWAYS_REQ)
    if user.other_income.fd_interest > 0 or user.other_income.savings_account_interest > 0:
        relevant.add("has_bank_interest_cert")
    if user.house_property.home_loan_interest > 0:
        relevant.add("has_home_loan_cert")
    cg = user.capital_gains
    if any([cg.stcg_111a, cg.ltcg_112a, cg.stcg_other, cg.ltcg_other]):
        relevant.add("has_capital_gains_statement")
    total_w = sum(_DOC_WEIGHTS[d] for d in relevant)
    earned  = sum(_DOC_WEIGHTS[d] for d in relevant if flag_map.get(d))
    missing = [_DOC_NAMES[d] for d in relevant if not flag_map.get(d)]
    score   = round(earned / total_w * 100, 1) if total_w > 0 else 100.0
    filing_ready = (user.mode == "exact" and not any(
        not flag_map.get(d) for d in _ALWAYS_REQ) and not missing)
    ca_reasons = []
    if gti > 50_00_000: ca_reasons.append("GTI above ₹50L (surcharge applicable)")
    if user.salary.multiple_employers: ca_reasons.append("Multiple Form 16s")
    if cg.stcl_equity > 0 or cg.ltcl > 0: ca_reasons.append("Capital losses with carry-forward")
    if (cg.ltcg_112a + cg.ltcg_other) > 10_00_000: ca_reasons.append("Capital gains above ₹10L")
    if user.house_property.home_loan_interest > 200_000: ca_reasons.append("Home loan interest exceeds SOP cap")
    return ConfidenceResult(completeness_score=score, filing_ready=filing_ready,
                            missing_documents=missing, ca_escalation_recommended=bool(ca_reasons),
                            ca_escalation_reasons=ca_reasons, is_estimate_mode=user.mode == "estimate")


# ═══════════════════════════════════════════════════════════════
#  SECTION 8: PUBLIC API
# ═══════════════════════════════════════════════════════════════

def compute_itr(user: UserInput) -> ITRResult:
    """
    Run the full Layer 1 deterministic tax computation.

    Parameters
    ----------
    user : UserInput — the taxpayer's income, deduction, and document data.

    Returns
    -------
    ITRResult — complete computation with both regime results and comparison.

    Raises
    ------
    ValueError — if the input is out of scope (NRI, minor).
    """
    profile = _build_profile(user)
    is_senior = profile["is_senior"]

    # Income heads (salary and HP differ by regime; others are regime-independent)
    sal_old = _compute_salary(user, "old")
    sal_new = _compute_salary(user, "new")
    hp_old  = _compute_house_property(user, "old")
    hp_new  = _compute_house_property(user, "new")
    oth     = _compute_other_income(user)
    cg      = _compute_capital_gains(user)

    def _gti(sal, hp):
        return round(sal["net_salary_income"] + hp["net_house_property_income"]
                     + oth["total_other_income_gross"] + cg["stcg_other_slab"]
                     + cg["stcg_111a_net"] + cg["ltcg_112a_net"] + cg["ltcg_other_net"], 2)

    gti_old = _gti(sal_old, hp_old)
    gti_new = _gti(sal_new, hp_new)

    # Deductions
    ded_old = _compute_deductions(user, is_senior, "old", user.house_property.home_loan_principal)
    ded_new = _compute_deductions(user, is_senior, "new")

    # New regime effective deductions = 80CCD(2) + extra standard deduction vs old
    new_ded_total = ded_new["new_regime_deductions"] + (_NEW_SD - _OLD_SD)

    tds = (user.taxes_paid.tds_salary + user.taxes_paid.tds_other
           + user.taxes_paid.advance_tax_paid + user.taxes_paid.self_assessment_tax_paid)

    # Regime comparison (uses gti_old as canonical GTI)
    comparison = _compare_regimes(gti_old, ded_old["total_chapter_via"],
                                  new_ded_total, cg, user.age, tds)

    # Assemble income heads result (old regime values as canonical)
    ih = IncomeHeadsResult(
        gross_salary=sal_old["gross_salary"], standard_deduction=sal_old["standard_deduction"],
        hra_exemption=sal_old["hra_exemption"], professional_tax=sal_old["professional_tax"],
        lta_exemption=sal_old["lta_exemption"], net_salary_income=sal_old["net_salary_income"],
        gross_annual_value=hp_old["gross_annual_value"], municipal_tax=hp_old["municipal_tax"],
        net_annual_value=hp_old["net_annual_value"],
        repair_deduction_30pct=hp_old["repair_deduction_30pct"],
        interest_on_loan_24b=hp_old["interest_on_loan_24b"],
        net_house_property_income=hp_old["net_house_property_income"],
        excess_interest_disallowed=hp_old["excess_interest_disallowed"],
        fd_interest=oth["fd_interest"], savings_interest_gross=oth["savings_interest_gross"],
        dividend_income=oth["dividend_income"], stcg_other_slab=cg["stcg_other_slab"],
        total_other_income=oth["total_other_income_gross"],
        stcg_111a_net=cg["stcg_111a_net"], ltcg_112a_net=cg["ltcg_112a_net"],
        ltcg_other_net=cg["ltcg_other_net"], gross_total_income=gti_old,
        carry_forward_loss_set_off=cg["carry_forward_stcl"] + cg["carry_forward_ltcl"])

    ded_result = DeductionsResult(
        raw_80c_pool=ded_old["raw_80c_pool"], capped_80c=ded_old["capped_80c"],
        deduction_80d=ded_old["deduction_80d"], deduction_80ccd_1b=ded_old["deduction_80ccd_1b"],
        deduction_80ccd_2=ded_old["deduction_80ccd_2"], deduction_80e=ded_old["deduction_80e"],
        deduction_80g=ded_old["deduction_80g"], deduction_80tta_ttb=ded_old["deduction_80tta_ttb"],
        deduction_80u=ded_old["deduction_80u"], total_chapter_via=ded_old["total_chapter_via"],
        new_regime_deductions=ded_new["new_regime_deductions"])

    risk  = _risk_flags(user, ih, ded_result, comparison)
    conf  = _confidence(user, gti_old)

    return ITRResult(assessment_year=user.assessment_year, age=user.age, mode=user.mode,
                     income_heads=ih, deductions=ded_result, regime_comparison=comparison,
                     risk_flags=risk, confidence=conf)
