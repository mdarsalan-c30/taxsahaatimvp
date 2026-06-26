"""
regime_compare.py
=================
Runs the full tax pipeline for OLD and NEW regimes, then compares results.

Outputs
-------
- SlabTaxResult for each regime (with net payable / refund)
- Recommended regime (lower net payable)
- Tax saving vs the worse regime
- Breakeven deduction level (at what Chapter VI-A total does old regime = new regime)
- Effective tax rates on GTI
"""

from __future__ import annotations
from models import SlabTaxResult, RegimeComparisonResult
from tax_slabs import compute_slab_tax, compute_special_rate_tax


def _build_slab_tax_result(
    regime,
    taxable_income,
    special_rate_components,
    total_income_for_surcharge,
    age,
    tds_and_advance,
) -> SlabTaxResult:
    """Helper: compute full SlabTaxResult for one regime."""
    special_rate_tax = compute_special_rate_tax(
        stcg_111a=special_rate_components["stcg_111a_net"],
        ltcg_112a=special_rate_components["ltcg_112a_net"],   # raw net; exemption applied inside
        ltcg_other=special_rate_components["ltcg_other_net"],
    )

    result = compute_slab_tax(
        taxable_income=taxable_income,
        regime=regime,
        age=age,
        special_rate_tax=special_rate_tax,
        total_income_for_surcharge=total_income_for_surcharge,
    )

    net_payable = round(result["total_tax"] - tds_and_advance, 2)

    return SlabTaxResult(
        regime=regime,
        taxable_income=result["taxable_income"],
        slab_tax=result["slab_tax"],
        special_rate_tax=result["special_rate_tax"],
        gross_tax=result["gross_tax"],
        rebate_87a=result["rebate_87a"],
        tax_after_rebate=result["tax_after_rebate"],
        surcharge=result["surcharge"],
        surcharge_rate=result["surcharge_rate"],
        marginal_relief=result["marginal_relief"],
        tax_plus_surcharge=result["tax_plus_surcharge"],
        cess=result["cess"],
        total_tax=result["total_tax"],
        tds_and_advance_tax=tds_and_advance,
        net_payable=net_payable,
    )


def compute_regime_comparison(
    gti: float,                          # Gross Total Income (before any deductions)
    chapter_via_deductions: float,       # total old-regime deductions (from deductions.py)
    new_regime_deductions: float,        # 80CCD(2) only
    special_rate_components: dict,       # from capital_gains.py output
    stcg_other_slab: float,              # STCG at slab rate (added to normal income)
    age: int,
    tds_and_advance: float,
) -> RegimeComparisonResult:
    """
    Runs both regime pipelines and returns a full comparison.

    Parameters
    ----------
    gti                     : Gross Total Income (all heads summed, before VI-A)
    chapter_via_deductions  : total old-regime Chapter VI-A deductions
    new_regime_deductions   : 80CCD(2) deductions valid in new regime
    special_rate_components : dict from capital_gains.compute_capital_gains()
    stcg_other_slab         : STCG taxable at slab rate (from capital gains)
    age                     : taxpayer age
    tds_and_advance         : total tax already paid (TDS + advance + SAT)
    """

    # ── Special-rate CG amounts (excluded from normal slab income) ──
    special_cg_income = (
        special_rate_components["stcg_111a_net"]
        + special_rate_components["ltcg_112a_net"]
        + special_rate_components["ltcg_other_net"]
    )

    # ── OLD REGIME ──
    old_taxable = max(0.0, gti - chapter_via_deductions - special_cg_income + stcg_other_slab)
    old_surcharge_base = max(0.0, gti - chapter_via_deductions)
    old_result = _build_slab_tax_result(
        regime="old",
        taxable_income=old_taxable,
        special_rate_components=special_rate_components,
        total_income_for_surcharge=old_surcharge_base,
        age=age,
        tds_and_advance=tds_and_advance,
    )

    # ── NEW REGIME ──
    new_taxable = max(0.0, gti - new_regime_deductions - special_cg_income + stcg_other_slab)
    new_surcharge_base = max(0.0, gti - new_regime_deductions)
    new_result = _build_slab_tax_result(
        regime="new",
        taxable_income=new_taxable,
        special_rate_components=special_rate_components,
        total_income_for_surcharge=new_surcharge_base,
        age=age,
        tds_and_advance=tds_and_advance,
    )

    # ── Recommendation ──
    recommended = "old" if old_result.total_tax <= new_result.total_tax else "new"
    tax_saving = abs(old_result.total_tax - new_result.total_tax)

    # ── Effective rates ──
    old_eff = round((old_result.total_tax / gti * 100), 2) if gti > 0 else 0.0
    new_eff = round((new_result.total_tax / gti * 100), 2) if gti > 0 else 0.0

    # ── Breakeven deduction level ──
    # At what total old-regime deduction does old_tax = new_tax?
    # We approximate with a binary search over Chapter VI-A total.
    breakeven = _compute_breakeven(
        gti=gti,
        new_regime_deductions=new_regime_deductions,
        special_rate_components=special_rate_components,
        stcg_other_slab=stcg_other_slab,
        age=age,
        new_total_tax=new_result.total_tax,
    )

    deductions_lost = max(0.0, chapter_via_deductions - new_regime_deductions)

    return RegimeComparisonResult(
        old=old_result,
        new=new_result,
        recommended_regime=recommended,
        tax_saving=round(tax_saving, 2),
        breakeven_deductions=round(breakeven, 2),
        deductions_lost_in_new=round(deductions_lost, 2),
        old_effective_rate=old_eff,
        new_effective_rate=new_eff,
    )


def _compute_breakeven(
    gti, new_regime_deductions, special_rate_components,
    stcg_other_slab, age, new_total_tax,
) -> float:
    """
    Binary search: find chapter_via_deduction level where old tax = new tax.
    Returns 0 if old regime is always worse, or cap (1.5L+50k+2L+more) if always better.
    """
    from tax_slabs import compute_slab_tax, compute_special_rate_tax

    special_cg = (
        special_rate_components["stcg_111a_net"]
        + special_rate_components["ltcg_112a_net"]
        + special_rate_components["ltcg_other_net"]
    )
    special_tax = compute_special_rate_tax(
        stcg_111a=special_rate_components["stcg_111a_net"],
        ltcg_112a=special_rate_components["ltcg_112a_taxable"],
        ltcg_other=special_rate_components["ltcg_other_net"],
    )

    def old_tax_at(deduction: float) -> float:
        taxable = max(0.0, gti - deduction - special_cg + stcg_other_slab)
        surcharge_base = max(0.0, gti - deduction)
        r = compute_slab_tax(
            taxable_income=taxable,
            regime="old",
            age=age,
            special_rate_tax=special_tax,
            total_income_for_surcharge=surcharge_base,
        )
        return r["total_tax"]

    lo, hi = 0.0, gti
    for _ in range(60):   # ~60 bisection steps → precision ~₹1 on any income
        mid = (lo + hi) / 2
        if old_tax_at(mid) > new_total_tax:
            lo = mid
        else:
            hi = mid
    return hi
