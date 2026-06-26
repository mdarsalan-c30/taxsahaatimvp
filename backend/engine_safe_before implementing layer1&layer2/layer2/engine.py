"""
engine.py — Layer 1: Deterministic Tax Computation
====================================================
All Layer 1 logic in one file. No external dependencies.

Public API:
    result = compute_itr(user_input)   # returns ITRResult

Rules implemented: FY 2025-26 / AY 2026-27 (salaried residents only).
See models.py module docstring for the full list of year-specific
provisions baked into this version.

Covers:
  - Salary: HRA exemption, standard deduction, LTA, professional tax
    (old regime only)
  - House property: SOP (₹2L cap), let-out (30% repair), new-regime rules
  - Other income: FD interest, savings interest, dividends
  - Capital gains: STCL/LTCL set-off, LTCG 112A exemption, special rates
  - Deductions: 80C (₹1.5L cap), 80D, 80CCD, 80E, 80G, 80TTA/TTB, 80U
  - Tax: progressive slabs, 87A rebate WITH marginal relief (both regimes),
    surcharge with marginal relief, capital-gains surcharge capped at 15%,
    4% cess
  - Regime comparison: old vs new — each computed from its OWN
    independently-derived gross total income (no cross-regime
    deduction-delta shortcuts), breakeven via binary search
  - Risk flags and document confidence scoring
"""

from __future__ import annotations
from typing import Literal, Optional
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
            itr_form = "ITR-2"  # upgrade silently
    return {"is_senior": is_senior, "is_super_senior": is_super_senior, "itr_form": itr_form}


# ═══════════════════════════════════════════════════════════════
#  SECTION 2: INCOME HEADS
# ═══════════════════════════════════════════════════════════════

_OLD_SD = 50_000
_NEW_SD = 75_000


def _hra_exemption(hra: float, basic: float, rent: float, tier: str) -> float:
    """Sec 10(13A) read with Rule 2A: least of actual HRA, 50%/40% of basic,
    rent − 10% of basic. Old regime only."""
    if hra <= 0 or rent <= 0 or basic <= 0:
        return 0.0
    factor = 0.50 if tier == "metro" else 0.40
    return round(min(hra, basic * factor, max(0.0, rent - 0.10 * basic)), 2)


def _compute_salary(user: UserInput, regime: str) -> dict:
    """
    Compute the taxable salary head for one regime.

    IMPORTANT: professional tax u/s 16(iii) is allowed ONLY under the old
    regime. Section 115BAC(1A) specifically restores the standard deduction
    u/s 16(ia) for the new regime, but does NOT restore 16(iii) professional
    tax or 16(ii) entertainment allowance. Likewise HRA (10(13A)) and LTA
    (10(5)) are old-regime-only exemptions.
    """
    s = user.salary
    std = _NEW_SD if regime == "new" else _OLD_SD

    if regime == "old":
        hra = _hra_exemption(s.hra_received, s.basic_salary, s.actual_rent_paid, s.city_tier)
        lta = s.lta_claimed
        prof_tax = s.professional_tax
    else:
        hra = 0.0
        lta = 0.0
        prof_tax = 0.0   # 16(iii) NOT available under new regime

    gross = s.gross_salary + s.perquisites_taxable
    net = max(0.0, round(gross - std - hra - lta - prof_tax, 2))
    return {"gross_salary": gross, "standard_deduction": std, "hra_exemption": hra,
            "professional_tax": prof_tax, "lta_exemption": lta,
            "net_salary_income": net}


def _compute_house_property(user: UserInput, regime: str) -> dict:
    """
    Sec 22-27.
      SOP: GAV=NAV=0. Interest u/s 24(b) capped at ₹2L old regime;
           disallowed entirely under new regime (115BAC).
      Let-out: GAV=rent received, 30% repair u/s 24(a) (allowed in BOTH
           regimes — only SOP interest is regime-restricted), interest
           u/s 24(b) uncapped. Loss set-off against other heads capped at
           ₹2L (old regime); not set off in current year under new regime
           (115BAC disallows house-property loss set-off against other
           heads — carry-forward to future HP income only).
    """
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
    """Apply Sec 70-74 STCL/LTCL set-off hierarchy and split into buckets."""
    cg = user.capital_gains
    s111a = max(0.0, cg.stcg_111a)
    l112a = max(0.0, cg.ltcg_112a)
    soth  = max(0.0, cg.stcg_other)
    loth  = max(0.0, cg.ltcg_other)
    stcl  = max(0.0, cg.stcl_equity)
    ltcl  = max(0.0, cg.ltcl)

    # Step 1: STCL vs STCG (111A first, then other)
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
    """
    Old regime: full Chapter VI-A.
    New regime: ONLY 80CCD(2) employer NPS.

    80CCD(2) cap (Finance Act 2024):
      New regime — 14% of basic salary, ALL employees.
      Old regime — 14% of basic if central govt employee, else 10%.
    """
    d = user.deductions
    s = user.salary

    if regime == "new":
        ccd2_cap = s.basic_salary * 0.14
        ccd2 = min(s.employer_nps_contribution, ccd2_cap)
        return {"raw_80c_pool": 0.0, "capped_80c": 0.0, "deduction_80d": 0.0,
                "deduction_80ccd_1b": 0.0, "deduction_80ccd_2": round(ccd2, 2),
                "deduction_80e": 0.0, "deduction_80g": 0.0, "deduction_80tta_ttb": 0.0,
                "deduction_80u": 0.0, "total_chapter_via": 0.0,
                "new_regime_deductions": round(ccd2, 2)}

    # ── Old regime ──
    ccd2_rate = 0.14 if s.is_central_govt_employee else 0.10
    ccd2 = min(s.employer_nps_contribution, s.basic_salary * ccd2_rate)

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
#  SECTION 4: TAX SLABS, 87A REBATE, SURCHARGE, CESS
# ═══════════════════════════════════════════════════════════════

# Old regime — unchanged for over a decade
_OLD_GENERAL = [(250_000, 0.0), (500_000, 0.05), (1_000_000, 0.20), (None, 0.30)]
_OLD_SENIOR  = [(300_000, 0.0), (500_000, 0.05), (1_000_000, 0.20), (None, 0.30)]
_OLD_SUPER   = [(500_000, 0.0), (1_000_000, 0.20), (None, 0.30)]

# New regime — Finance Act 2025 (Budget Feb-2025), FY2025-26/AY2026-27
_NEW_SLABS = [(400_000, 0.0), (800_000, 0.05), (1_200_000, 0.10), (1_600_000, 0.15),
              (2_000_000, 0.20), (2_400_000, 0.25), (None, 0.30)]

# Surcharge bands (apply to the SLAB-taxed portion of income)
_SURCHARGE_OLD = [(5_000_000, 0.0), (10_000_000, 0.10), (20_000_000, 0.15),
                  (50_000_000, 0.25), (None, 0.37)]
# New regime: 37% slab removed since FY2023-24; max 25%
_SURCHARGE_NEW = [(5_000_000, 0.0), (10_000_000, 0.10), (20_000_000, 0.15), (None, 0.25)]

# 87A rebate thresholds (total income, i.e. taxable_income here)
_REBATE_THRESHOLD_OLD = 500_000
_REBATE_THRESHOLD_NEW = 1_200_000

# Special-rate capital gains rates (Finance Act 2024, eff. all of FY2025-26)
STCG_111A_RATE      = 0.20    # Sec 111A
LTCG_112A_RATE      = 0.125   # Sec 112A
LTCG_112A_EXEMPTION = 125_000
LTCG_OTHER_RATE     = 0.125   # Sec 112, non-equity assets, no indexation (post 23-Jul-2024)

# Surcharge on STCG111A/LTCG112A/LTCG-other is capped at 15% regardless of
# the slab-income surcharge rate (Finance Act 2022/2024 relief for CG income)
CG_SURCHARGE_CAP = 0.15

CESS_RATE = 0.04


def _slab_tax(income: float, slabs: list) -> float:
    """Progressive slab tax on a non-negative income amount."""
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


def _rebate_87a(taxable_income: float, slab_tax: float, regime: str) -> float:
    """
    Sec 87A rebate, including marginal relief, for OLD and NEW regimes.

    Unified formula:  rebate = max(0, slab_tax - max(0, taxable_income - threshold))

    At taxable_income <= threshold:  excess=0  -> rebate = slab_tax (full rebate, tax=0)
    Just above threshold:            rebate phases out so that
                                      net_tax = min(slab_tax, excess)
                                      i.e. tax payable never exceeds the
                                      amount by which income exceeds the
                                      threshold (the statutory marginal-relief
                                      guarantee).
    The phase-out completes naturally once slab_tax > excess:
      - Old regime: completes at taxable_income ≈ ₹5,15,625
      - New regime: completes at taxable_income ≈ ₹12,70,588
    No separate ₹12,500 / ₹60,000 cap constant is needed — those figures
    are simply slab_tax evaluated exactly at the threshold.
    """
    threshold = _REBATE_THRESHOLD_OLD if regime == "old" else _REBATE_THRESHOLD_NEW
    excess = max(0.0, taxable_income - threshold)
    return round(max(0.0, slab_tax - excess), 2)


def _special_rate_tax(cg: dict) -> float:
    """Tax on STCG111A + LTCG112A (post ₹1.25L exemption) + LTCG-other, all flat-rate."""
    stcg_tax = max(0.0, cg["stcg_111a_net"]) * STCG_111A_RATE
    ltcg_tax = max(0.0, cg["ltcg_112a_net"] - LTCG_112A_EXEMPTION) * LTCG_112A_RATE
    ltcg_o   = max(0.0, cg["ltcg_other_net"]) * LTCG_OTHER_RATE
    return round(stcg_tax + ltcg_tax + ltcg_o, 2)


def _find_relief_threshold(surcharge_base: float, bands: list) -> Optional[tuple]:
    """
    Return (threshold, rate_below_threshold) for the surcharge band boundary
    the taxpayer just crossed into a HIGHER rate, or None if surcharge_base
    sits exactly on a boundary (no crossing yet) or in the lowest (0%) band.

    `rate_below_threshold` is needed because at the 2nd/3rd/4th surcharge
    thresholds (e.g. ₹1Cr, ₹2Cr, ₹5Cr for the old regime) the surcharge rate
    JUST BELOW the threshold is already non-zero (10%/15%/25%) — the relief
    target must include that pre-existing surcharge, not assume zero.
    """
    prev_upper, prev_rate = 0.0, 0.0
    for upper, rate in bands:
        if upper is None or surcharge_base <= upper:
            return (prev_upper, prev_rate) if rate > prev_rate else None
        prev_upper, prev_rate = upper, rate
    return None


def _compute_full_tax(taxable: float, regime: str, age: int,
                      spec_tax: float, surcharge_base: float) -> dict:
    """
    Full tax computation for one regime: slab tax -> 87A rebate (with
    marginal relief) -> add special-rate CG tax -> surcharge (slab portion
    via regular bands with marginal relief; CG portion capped at 15%) -> cess.
    """
    taxable = max(0.0, taxable)
    slabs = (_NEW_SLABS if regime == "new"
             else _OLD_SUPER if age >= 80
             else _OLD_SENIOR if age >= 60
             else _OLD_GENERAL)

    st  = _slab_tax(taxable, slabs)
    reb = _rebate_87a(taxable, st, regime)
    tar = max(0.0, st - reb)                 # tax-after-rebate on slab income

    bands  = _SURCHARGE_NEW if regime == "new" else _SURCHARGE_OLD
    sr_slab = _surcharge_rate(surcharge_base, bands)
    sr_cg   = min(sr_slab, CG_SURCHARGE_CAP)

    sur_slab = round(tar * sr_slab, 2)
    sur_cg   = round(spec_tax * sr_cg, 2)

    marginal_relief = 0.0
    if sr_slab > 0:
        thr_info = _find_relief_threshold(surcharge_base, bands)
        if thr_info is not None:
            threshold, rate_below = thr_info
            excess = surcharge_base - threshold
            taxable_at_thr = max(0.0, taxable - excess)
            st_at_thr  = _slab_tax(taxable_at_thr, slabs)
            reb_at_thr = _rebate_87a(taxable_at_thr, st_at_thr, regime)
            tar_at_thr = max(0.0, st_at_thr - reb_at_thr)
            # Target = (tax + surcharge at the threshold rate) + excess income.
            # rate_below is the surcharge rate that applied AT/BELOW the
            # threshold (0% for the first threshold, non-zero for later ones).
            target = tar_at_thr * (1 + rate_below) + excess
            actual = tar + sur_slab
            marginal_relief = round(max(0.0, actual - target), 2)
            sur_slab = round(max(0.0, sur_slab - marginal_relief), 2)

    surcharge = round(sur_slab + sur_cg, 2)
    gross_tax = round(tar + spec_tax, 2)            # tax before surcharge
    tax_plus_surcharge = round(gross_tax + surcharge, 2)
    cess = round(tax_plus_surcharge * CESS_RATE, 2)
    total_tax = round(tax_plus_surcharge + cess, 2)

    return {"taxable_income": taxable, "slab_tax": st, "special_rate_tax": spec_tax,
            "gross_tax": gross_tax, "rebate_87a": reb, "tax_after_rebate": tar,
            "surcharge": surcharge, "surcharge_rate": sr_slab,
            "marginal_relief": marginal_relief,
            "tax_plus_surcharge": tax_plus_surcharge, "cess": cess, "total_tax": total_tax}


# ═══════════════════════════════════════════════════════════════
#  SECTION 5: REGIME COMPARISON
# ═══════════════════════════════════════════════════════════════

def _make_slab_result(regime: str, gti: float, deductions: float, cg: dict,
                      age: int, tds: float) -> SlabTaxResult:
    """
    Build a SlabTaxResult from a regime's OWN gross total income (gti) and
    its OWN applicable deductions. `gti` must already reflect regime-specific
    salary/house-property treatment (HRA/LTA/professional-tax/SOP-interest
    differences) — see compute_itr() for how gti_old/gti_new are derived.
    """
    spec_cg = cg["stcg_111a_net"] + cg["ltcg_112a_net"] + cg["ltcg_other_net"]
    taxable = max(0.0, gti - deductions - spec_cg + cg["stcg_other_slab"])
    surcharge_base = max(0.0, gti - deductions)
    spec_tax = _special_rate_tax(cg)
    r = _compute_full_tax(taxable, regime, age, spec_tax, surcharge_base)
    return SlabTaxResult(
        regime=regime, taxable_income=r["taxable_income"], slab_tax=r["slab_tax"],
        special_rate_tax=r["special_rate_tax"], gross_tax=r["gross_tax"],
        rebate_87a=r["rebate_87a"], tax_after_rebate=r["tax_after_rebate"],
        surcharge=r["surcharge"], surcharge_rate=r["surcharge_rate"],
        marginal_relief=r["marginal_relief"], tax_plus_surcharge=r["tax_plus_surcharge"],
        cess=r["cess"], total_tax=r["total_tax"], tds_and_advance_tax=tds,
        net_payable=round(r["total_tax"] - tds, 2))


def _breakeven(gti_old: float, new_total_tax: float, cg: dict, age: int) -> float:
    """
    Binary search over OLD-regime Chapter VI-A deduction amount `d` (holding
    gti_old fixed) to find the `d` at which old-regime total_tax equals the
    (fixed) new-regime total_tax. 60 iterations -> precision << ₹1.
    """
    spec_cg  = cg["stcg_111a_net"] + cg["ltcg_112a_net"] + cg["ltcg_other_net"]
    spec_tax = _special_rate_tax(cg)

    def old_tax_at(d: float) -> float:
        taxable = max(0.0, gti_old - d - spec_cg + cg["stcg_other_slab"])
        sb = max(0.0, gti_old - d)
        return _compute_full_tax(taxable, "old", age, spec_tax, sb)["total_tax"]

    lo, hi = 0.0, gti_old
    for _ in range(60):
        mid = (lo + hi) / 2
        if old_tax_at(mid) > new_total_tax:
            lo = mid
        else:
            hi = mid
    return hi


def _compare_regimes(gti_old: float, gti_new: float, old_ded: float, new_ded: float,
                     cg: dict, age: int, tds: float) -> RegimeComparisonResult:
    """
    Compare old vs new regime.

    CRITICAL: gti_old and gti_new are INDEPENDENT figures, each already
    reflecting their own regime's salary/HP rules (HRA/LTA/professional-tax
    are subtracted only in gti_old; SOP-interest differs between the two).
    old_ded = Chapter VI-A total (old regime). new_ded = 80CCD(2) only
    (new regime) — the new regime's higher standard deduction is already
    baked into gti_new via _compute_salary(..., "new").
    """
    old_r = _make_slab_result("old", gti_old, old_ded, cg, age, tds)
    new_r = _make_slab_result("new", gti_new, new_ded, cg, age, tds)
    rec = "old" if old_r.total_tax <= new_r.total_tax else "new"
    be  = _breakeven(gti_old, new_r.total_tax, cg, age)
    return RegimeComparisonResult(
        old=old_r, new=new_r, recommended_regime=rec,
        tax_saving=round(abs(old_r.total_tax - new_r.total_tax), 2),
        breakeven_deductions=round(be, 2),
        deductions_lost_in_new=round(max(0.0, old_ded - new_ded), 2),
        old_effective_rate=round(old_r.total_tax / gti_old * 100, 2) if gti_old > 0 else 0.0,
        new_effective_rate=round(new_r.total_tax / gti_new * 100, 2) if gti_new > 0 else 0.0)


# ═══════════════════════════════════════════════════════════════
#  SECTION 6: RISK FLAGS
# ═══════════════════════════════════════════════════════════════

def _risk_flags(user: UserInput, ih: IncomeHeadsResult,
                ded: DeductionsResult, rc: RegimeComparisonResult,
                cg: dict) -> list[RiskFlag]:
    flags = []
    def f(code, sev, msg): flags.append(RiskFlag(code=code, severity=sev, message=msg))

    if user.mode == "estimate":
        f("ESTIMATE_MODE_WARNING", "warning",
          "Planning estimate only. Not filing-ready. Upload documents and switch to Exact mode before filing.")

    if user.assessment_year != "2026-27":
        f("ASSESSMENT_YEAR_NOTE", "info",
          f"This engine implements tax rules for AY 2026-27 (FY 2025-26). "
          f"You specified AY {user.assessment_year}. Rules are not year-conditional in "
          f"this version — e.g. AY2025-26 (FY2024-25) had different new-regime slabs "
          f"(3L-15L bands, ₹7L rebate threshold) and a 15%/10% STCG111A/LTCG112A split "
          f"by transfer date. Results above reflect AY2026-27 rules regardless.")

    if ih.gross_total_income > 50_00_000 or ih.gross_total_income_new_regime > 50_00_000:
        f("INCOME_ABOVE_50L", "info",
          f"GTI exceeds ₹50L (old: ₹{ih.gross_total_income:,.0f}, "
          f"new: ₹{ih.gross_total_income_new_regime:,.0f}). CA review recommended for "
          f"surcharge optimisation.")

    if user.salary.multiple_employers:
        f("MULTI_EMPLOYER", "warning",
          "Multiple employers detected. Reconcile all Form 16s and ensure Form 12B was filed.")

    has_cg = any([user.capital_gains.stcg_111a, user.capital_gains.ltcg_112a,
                  user.capital_gains.stcg_other, user.capital_gains.ltcg_other,
                  user.capital_gains.stcl_equity, user.capital_gains.ltcl])
    if has_cg:
        f("CAPITAL_GAINS_PRESENT", "info", "Capital gains present — ITR-2 required, not ITR-1.")
        if not user.documents.has_capital_gains_statement:
            f("MISSING_CG_STATEMENT", "warning",
              "Capital gains declared but no statement uploaded. Download from CAMS/Zerodha/Groww.")
        if user.capital_gains.ltcg_112a > 125_000:
            f("LTCG_EXEMPTION_APPLIED", "info",
              f"LTCG 112A ₹{user.capital_gains.ltcg_112a:,.0f} exceeds ₹1.25L exemption. "
              f"Taxed at 12.5% on the excess.")

    if user.capital_gains.ltcg_other > 0:
        f("LTCG_OTHER_RATE_NOTE", "info",
          "LTCG on non-equity assets (property, gold, unlisted shares) is computed at "
          "12.5% WITHOUT indexation (Finance Act 2024). If this is IMMOVABLE PROPERTY "
          "acquired before 23-Jul-2024, you may have a grandfathering option to instead "
          "compute tax at 20% WITH indexation and use whichever is lower — this engine "
          "does not compute that alternative; consult a CA if applicable. If this is a "
          "DEBT MUTUAL FUND gain, it should instead be entered as 'STCG other' (taxed at "
          "slab rate) regardless of holding period, per Finance Act 2023.")

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
    rec = rc.recommended_regime
    rec_result = rc.old if rec == "old" else rc.new
    rec_gti = ih.gross_total_income if rec == "old" else ih.gross_total_income_new_regime
    rec_threshold = _REBATE_THRESHOLD_OLD if rec == "old" else _REBATE_THRESHOLD_NEW

    if rec_result.net_payable > 10_000 and total_tds == 0:
        f("TDS_MISMATCH", "warning",
          f"Tax payable ₹{rec_result.net_payable:,.0f} but no TDS recorded. Verify Form 16 / 26AS.")

    if rec_result.taxable_income > 250_000 and user.taxes_paid.advance_tax_paid == 0 and total_tds < 5_000:
        f("ADVANCE_TAX_CHECK", "info",
          "Taxable income > ₹2.5L with no advance tax. Interest u/s 234B/234C may apply.")

    # ── 87A marginal relief applied? ──
    if 0 < rec_result.rebate_87a < rec_result.slab_tax and rec_result.taxable_income > rec_threshold:
        f("REBATE_87A_MARGINAL_RELIEF", "info",
          f"Your income is just above the ₹{rec_threshold:,.0f} Sec 87A rebate threshold "
          f"({rec.upper()} regime). Marginal relief caps your slab tax at "
          f"₹{rec_result.taxable_income - rec_threshold:,.0f} — the amount by which your "
          f"income exceeds the threshold — instead of the full ₹{rec_result.slab_tax:,.0f}.")

    # ── 87A rebate excludes special-rate CG tax ──
    if rec_result.taxable_income <= rec_threshold and rec_result.special_rate_tax > 0:
        f("REBATE_EXCLUDES_SPECIAL_RATE", "info",
          f"Your total income (₹{rec_result.taxable_income:,.0f}) is within the Sec 87A "
          f"rebate threshold, so slab tax is nil. However, the Sec 87A rebate does NOT "
          f"cover tax on capital gains taxed at special rates (111A/112A) — "
          f"₹{rec_result.special_rate_tax:,.0f} of capital-gains tax remains payable.")

    # ── Surcharge marginal relief applied? ──
    if rec_result.marginal_relief > 0:
        f("SURCHARGE_MARGINAL_RELIEF_APPLIED", "info",
          f"Marginal relief of ₹{rec_result.marginal_relief:,.0f} was applied to your "
          f"surcharge ({rec.upper()} regime) to ensure the tax increase from crossing a "
          f"surcharge threshold does not exceed your income increase above that threshold.")

    # ── New vs old regime income-base difference ──
    delta = ih.gross_total_income_new_regime - ih.gross_total_income
    if abs(delta) > 1_000:
        if delta > 0:
            f("NEW_REGIME_INCOME_HIGHER", "info",
              f"New-regime gross total income (₹{ih.gross_total_income_new_regime:,.0f}) is "
              f"₹{delta:,.0f} HIGHER than old-regime GTI (₹{ih.gross_total_income:,.0f}). "
              f"This is because HRA/LTA/professional-tax exemptions and/or SOP home-loan "
              f"interest (beyond what's allowed under 115BAC) reduce old-regime income but "
              f"are NOT available under the new regime.")
        else:
            f("NEW_REGIME_INCOME_LOWER", "info",
              f"New-regime gross total income (₹{ih.gross_total_income_new_regime:,.0f}) is "
              f"₹{-delta:,.0f} LOWER than old-regime GTI (₹{ih.gross_total_income:,.0f}), "
              f"mainly because the higher new-regime standard deduction (₹75,000 vs "
              f"₹50,000) outweighs the old-regime-only exemptions you would otherwise claim.")

    # ── Employer NPS cap info ──
    if user.salary.employer_nps_contribution > 0:
        old_rate = 0.14 if user.salary.is_central_govt_employee else 0.10
        f("EMPLOYER_NPS_CAP_INFO", "info",
          f"80CCD(2) employer NPS is capped at 14% of basic salary "
          f"(₹{user.salary.basic_salary*0.14:,.0f}) under the new regime, and at "
          f"{'14%' if user.salary.is_central_govt_employee else '10%'} of basic "
          f"(₹{user.salary.basic_salary*old_rate:,.0f}) under the old regime"
          f"{' for central government employees' if user.salary.is_central_govt_employee else ''}.")

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

def _gti(sal: dict, hp: dict, oth: dict, cg: dict) -> float:
    return round(sal["net_salary_income"] + hp["net_house_property_income"]
                 + oth["total_other_income_gross"] + cg["stcg_other_slab"]
                 + cg["stcg_111a_net"] + cg["ltcg_112a_net"] + cg["ltcg_other_net"], 2)


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

    # Income heads — computed independently per regime
    sal_old = _compute_salary(user, "old")
    sal_new = _compute_salary(user, "new")
    hp_old  = _compute_house_property(user, "old")
    hp_new  = _compute_house_property(user, "new")
    oth     = _compute_other_income(user)
    cg      = _compute_capital_gains(user)

    gti_old = _gti(sal_old, hp_old, oth, cg)
    gti_new = _gti(sal_new, hp_new, oth, cg)

    # Deductions
    ded_old = _compute_deductions(user, is_senior, "old", user.house_property.home_loan_principal)
    ded_new = _compute_deductions(user, is_senior, "new")

    tds = (user.taxes_paid.tds_salary + user.taxes_paid.tds_other
           + user.taxes_paid.advance_tax_paid + user.taxes_paid.self_assessment_tax_paid)

    # Regime comparison — each regime uses its OWN gti and OWN deductions
    comparison = _compare_regimes(gti_old, gti_new, ded_old["total_chapter_via"],
                                  ded_new["new_regime_deductions"], cg, user.age, tds)

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
        carry_forward_loss_set_off=cg["carry_forward_stcl"] + cg["carry_forward_ltcl"],
        net_salary_income_new_regime=sal_new["net_salary_income"],
        net_house_property_income_new_regime=hp_new["net_house_property_income"],
        gross_total_income_new_regime=gti_new)

    ded_result = DeductionsResult(
        raw_80c_pool=ded_old["raw_80c_pool"], capped_80c=ded_old["capped_80c"],
        deduction_80d=ded_old["deduction_80d"], deduction_80ccd_1b=ded_old["deduction_80ccd_1b"],
        deduction_80ccd_2=ded_old["deduction_80ccd_2"], deduction_80e=ded_old["deduction_80e"],
        deduction_80g=ded_old["deduction_80g"], deduction_80tta_ttb=ded_old["deduction_80tta_ttb"],
        deduction_80u=ded_old["deduction_80u"], total_chapter_via=ded_old["total_chapter_via"],
        new_regime_deductions=ded_new["new_regime_deductions"])

    risk = _risk_flags(user, ih, ded_result, comparison, cg)
    conf = _confidence(user, gti_old)

    return ITRResult(assessment_year=user.assessment_year, age=user.age, mode=user.mode,
                     income_heads=ih, deductions=ded_result, regime_comparison=comparison,
                     risk_flags=risk, confidence=conf)
