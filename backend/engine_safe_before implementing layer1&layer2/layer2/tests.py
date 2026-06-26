"""
tests.py — ITR Engine v3 Test Suite
=====================================
Run:
    python tests.py            # all tests
    python tests.py -v         # verbose (show each test name)

Organisation
------------
  1. Tax-math unit tests       — slab tax, 87A rebate + marginal relief,
                                  surcharge + marginal relief, CG surcharge cap
  2. Income-heads unit tests   — salary/HRA, house property, capital gains
  3. Deductions unit tests     — 80C/80D/80CCD/80E/80G/80TTA-TTB/80U
  4. Integration tests          — full compute_itr() on representative profiles,
                                  with hand-derived expected values
  5. Regime-comparison tests    — gti_old vs gti_new independence, breakeven
  6. Invariant sweeps            — monotonicity (no tax cliffs) across full
                                  income range and at every threshold
  7. Risk-flag tests             — every flag fires under the right conditions
  8. Scope / validation tests    — NRI, minors, edge inputs
"""

import sys
import traceback

from models import (
    UserInput, SalaryInput, HousePropertyInput, OtherIncomeInput,
    CapitalGainsInput, DeductionsInput, TaxPaidInput, DocumentFlags,
)
from engine import (
    compute_itr, _compute_salary, _compute_house_property,
    _compute_other_income, _compute_capital_gains, _compute_deductions,
    _slab_tax, _rebate_87a, _compute_full_tax, _special_rate_tax,
    _OLD_GENERAL, _OLD_SENIOR, _OLD_SUPER, _NEW_SLABS,
    _SURCHARGE_OLD, _SURCHARGE_NEW,
    LTCG_112A_RATE, LTCG_112A_EXEMPTION, LTCG_OTHER_RATE, STCG_111A_RATE,
)

# ─────────────────────────────────────────────
#  TINY TEST FRAMEWORK
# ─────────────────────────────────────────────

_tests = []
_failures = []

def test(fn):
    _tests.append(fn)
    return fn

def approx(a, b, tol=0.01):
    return abs(a - b) <= tol


# ═══════════════════════════════════════════════════════════════
#  1. TAX-MATH UNIT TESTS
# ═══════════════════════════════════════════════════════════════

@test
def test_slab_tax_zero_income():
    assert _slab_tax(0, _OLD_GENERAL) == 0.0
    assert _slab_tax(-100, _OLD_GENERAL) == 0.0

@test
def test_slab_tax_old_general_boundaries():
    assert _slab_tax(250_000, _OLD_GENERAL) == 0.0
    assert approx(_slab_tax(500_000, _OLD_GENERAL), 12_500)
    assert approx(_slab_tax(1_000_000, _OLD_GENERAL), 12_500 + 100_000)
    assert approx(_slab_tax(1_500_000, _OLD_GENERAL), 112_500 + 150_000)

@test
def test_slab_tax_old_senior_boundaries():
    assert _slab_tax(300_000, _OLD_SENIOR) == 0.0
    assert approx(_slab_tax(500_000, _OLD_SENIOR), 10_000)
    assert approx(_slab_tax(1_000_000, _OLD_SENIOR), 10_000 + 100_000)

@test
def test_slab_tax_old_super_senior_boundaries():
    assert _slab_tax(500_000, _OLD_SUPER) == 0.0
    assert approx(_slab_tax(1_000_000, _OLD_SUPER), 100_000)

@test
def test_slab_tax_new_regime_boundaries():
    assert _slab_tax(400_000, _NEW_SLABS) == 0.0
    assert approx(_slab_tax(800_000, _NEW_SLABS), 20_000)
    assert approx(_slab_tax(1_200_000, _NEW_SLABS), 60_000)
    assert approx(_slab_tax(1_600_000, _NEW_SLABS), 120_000)
    assert approx(_slab_tax(2_000_000, _NEW_SLABS), 200_000)
    assert approx(_slab_tax(2_400_000, _NEW_SLABS), 300_000)
    assert approx(_slab_tax(3_400_000, _NEW_SLABS), 300_000 + 300_000)

@test
def test_slab_tax_new_regime_top_rate():
    # income 50L: 300000 (up to 24L) + 30% of (5000000-2400000)=780000 -> 1080000
    assert approx(_slab_tax(5_000_000, _NEW_SLABS), 300_000 + 0.30 * 2_600_000)


# ── 87A rebate: full rebate zone ──

@test
def test_87a_old_full_rebate_below_threshold():
    for inc in [0, 100_000, 250_000, 400_000, 499_999, 500_000]:
        st = _slab_tax(inc, _OLD_GENERAL)
        reb = _rebate_87a(inc, st, "old")
        assert approx(reb, st), f"income={inc}: rebate {reb} != slab_tax {st}"
        assert approx(st - reb, 0.0)

@test
def test_87a_new_full_rebate_below_threshold():
    for inc in [0, 400_000, 800_000, 1_000_000, 1_199_999, 1_200_000]:
        st = _slab_tax(inc, _NEW_SLABS)
        reb = _rebate_87a(inc, st, "new")
        assert approx(reb, st), f"income={inc}: rebate {reb} != slab_tax {st}"
        assert approx(st - reb, 0.0)


# ── 87A marginal relief zone: net tax == excess over threshold ──

@test
def test_87a_old_marginal_relief_zone():
    # marginal relief applies for taxable income in (500000, 515625]
    for inc in [500_001, 501_000, 505_000, 510_000, 515_000, 515_625]:
        st = _slab_tax(inc, _OLD_GENERAL)
        reb = _rebate_87a(inc, st, "old")
        net = st - reb
        excess = inc - 500_000
        assert approx(net, excess), f"income={inc}: net_tax {net} != excess {excess}"

@test
def test_87a_new_marginal_relief_zone():
    # marginal relief applies for taxable income in (1200000, 1270588.24]
    for inc in [1_200_001, 1_201_000, 1_210_000, 1_250_000, 1_270_588]:
        st = _slab_tax(inc, _NEW_SLABS)
        reb = _rebate_87a(inc, st, "new")
        net = st - reb
        excess = inc - 1_200_000
        assert approx(net, excess, tol=0.5), f"income={inc}: net_tax {net} != excess {excess}"


# ── 87A relief phase-out: beyond the phase-out point, rebate = 0 ──

@test
def test_87a_old_relief_phaseout():
    st = _slab_tax(516_000, _OLD_GENERAL)
    reb = _rebate_87a(516_000, st, "old")
    assert reb == 0.0
    st2 = _slab_tax(600_000, _OLD_GENERAL)
    assert _rebate_87a(600_000, st2, "old") == 0.0

@test
def test_87a_new_relief_phaseout():
    st = _slab_tax(1_271_000, _NEW_SLABS)
    reb = _rebate_87a(1_271_000, st, "new")
    assert reb == 0.0
    st2 = _slab_tax(1_500_000, _NEW_SLABS)
    assert _rebate_87a(1_500_000, st2, "new") == 0.0


# ── No cliff at 87A thresholds: total_tax(threshold+1) - total_tax(threshold) is small ──

@test
def test_no_cliff_at_old_87a_threshold():
    t0 = _compute_full_tax(500_000, "old", 35, 0.0, 500_000)["total_tax"]
    t1 = _compute_full_tax(500_001, "old", 35, 0.0, 500_001)["total_tax"]
    assert t1 >= t0
    assert (t1 - t0) < 2.0   # was a ~13,000 cliff before the fix

@test
def test_no_cliff_at_new_87a_threshold():
    t0 = _compute_full_tax(1_200_000, "new", 35, 0.0, 1_200_000)["total_tax"]
    t1 = _compute_full_tax(1_200_001, "new", 35, 0.0, 1_200_001)["total_tax"]
    assert t1 >= t0
    assert (t1 - t0) < 2.0   # was a ~60,000 cliff before the fix


# ── Surcharge: rate selection ──

@test
def test_surcharge_rate_zero_below_50l():
    r = _compute_full_tax(4_999_999, "old", 35, 0.0, 4_999_999)
    assert r["surcharge_rate"] == 0.0
    assert r["surcharge"] == 0.0

@test
def test_surcharge_rates_old_regime():
    cases = [(5_500_000, 0.10), (15_000_000, 0.15), (25_000_000, 0.25), (60_000_000, 0.37)]
    for inc, rate in cases:
        r = _compute_full_tax(inc, "old", 35, 0.0, inc)
        assert approx(r["surcharge_rate"], rate), f"income={inc}: rate {r['surcharge_rate']} != {rate}"

@test
def test_surcharge_rates_new_regime_capped_25():
    # new regime: no 37% slab even above 5Cr
    r = _compute_full_tax(60_000_000, "new", 35, 0.0, 60_000_000)
    assert approx(r["surcharge_rate"], 0.25)


# ── Surcharge marginal relief: no decrease across any threshold ──

@test
def test_surcharge_marginal_relief_monotonic_old():
    boundaries = [5_000_000, 10_000_000, 20_000_000, 50_000_000]
    for b in boundaries:
        prev = None
        for inc in range(b - 2, b + 3):
            t = _compute_full_tax(inc, "old", 35, 0.0, inc)["total_tax"]
            if prev is not None:
                assert t >= prev - 1e-6, f"DECREASE at boundary {b}, income={inc}: {prev} -> {t}"
            prev = t

@test
def test_surcharge_marginal_relief_monotonic_new():
    boundaries = [5_000_000, 10_000_000, 20_000_000]
    for b in boundaries:
        prev = None
        for inc in range(b - 2, b + 3):
            t = _compute_full_tax(inc, "new", 35, 0.0, inc)["total_tax"]
            if prev is not None:
                assert t >= prev - 1e-6, f"DECREASE at boundary {b}, income={inc}: {prev} -> {t}"
            prev = t

@test
def test_surcharge_marginal_relief_exact_value_at_50l_plus_1():
    # At exactly 50,00,001 (old regime), tax+surcharge should equal
    # slab_tax_at(50,00,000) + 1 (the statutory cap), since rate_below=0% here.
    r = _compute_full_tax(5_000_001, "old", 35, 0.0, 5_000_001)
    slab_at_threshold = _slab_tax(5_000_000, _OLD_GENERAL)
    assert approx(r["tax_plus_surcharge"], slab_at_threshold + 1, tol=0.02)

@test
def test_surcharge_marginal_relief_exact_value_at_1cr_plus_1():
    # At 1,00,00,001 (old regime), rate_below=10% — target must include
    # that pre-existing 10% surcharge, not assume zero.
    r = _compute_full_tax(10_000_001, "old", 35, 0.0, 10_000_001)
    slab_at_threshold = _slab_tax(10_000_000, _OLD_GENERAL)
    target = slab_at_threshold * 1.10 + 1
    assert approx(r["tax_plus_surcharge"], target, tol=0.02)


# ── Capital gains special rates ──

@test
def test_stcg_111a_rate_20pct():
    cg = {"stcg_111a_net": 100_000, "ltcg_112a_net": 0, "ltcg_other_net": 0}
    assert approx(_special_rate_tax(cg), 20_000)

@test
def test_ltcg_112a_exemption_and_rate():
    # 300000 gain, 125000 exempt, 175000 * 12.5%
    cg = {"stcg_111a_net": 0, "ltcg_112a_net": 300_000, "ltcg_other_net": 0}
    assert approx(_special_rate_tax(cg), 175_000 * 0.125)

@test
def test_ltcg_112a_below_exemption_zero_tax():
    cg = {"stcg_111a_net": 0, "ltcg_112a_net": 100_000, "ltcg_other_net": 0}
    assert _special_rate_tax(cg) == 0.0

@test
def test_ltcg_other_rate_12_5pct():
    cg = {"stcg_111a_net": 0, "ltcg_112a_net": 0, "ltcg_other_net": 200_000}
    assert approx(_special_rate_tax(cg), 25_000)

@test
def test_cg_surcharge_capped_at_15pct():
    # At an income where slab surcharge would be 25%, CG surcharge stays at 15%
    cg = {"stcg_111a_net": 1_000_000, "ltcg_112a_net": 0, "ltcg_other_net": 0}
    spec_tax = _special_rate_tax(cg)  # 200,000
    r = _compute_full_tax(25_000_000, "old", 35, spec_tax, 26_000_000)
    assert approx(r["surcharge_rate"], 0.25)  # slab surcharge rate is 25%
    # CG portion of surcharge = spec_tax * 15% = 30,000
    # We can't read sur_cg directly, but total surcharge - slab surcharge should equal it.
    # Recompute slab surcharge alone (zero spec_tax):
    r0 = _compute_full_tax(25_000_000, "old", 35, 0.0, 26_000_000)
    cg_surcharge = r["surcharge"] - r0["surcharge"]
    assert approx(cg_surcharge, spec_tax * 0.15, tol=1.0)


# ═══════════════════════════════════════════════════════════════
#  2. INCOME-HEADS UNIT TESTS
# ═══════════════════════════════════════════════════════════════

@test
def test_hra_exemption_metro_least_of_three():
    # HRA=250000, basic=750000 (50%=375000), rent-10%basic=240000-75000=165000
    # least = 165000
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000,
        hra_received=250_000, actual_rent_paid=240_000, city_tier="metro"))
    sal = _compute_salary(user, "old")
    assert approx(sal["hra_exemption"], 165_000)

@test
def test_hra_exemption_non_metro_40pct():
    # basic=500000, 40%=200000, HRA=250000, rent-10%basic=180000-50000=130000
    # least(250000, 200000, 130000) = 130000
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
        hra_received=250_000, actual_rent_paid=180_000, city_tier="non_metro"))
    sal = _compute_salary(user, "old")
    assert approx(sal["hra_exemption"], 130_000)

@test
def test_hra_exemption_zero_when_no_rent():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
        hra_received=250_000, actual_rent_paid=0, city_tier="metro"))
    sal = _compute_salary(user, "old")
    assert sal["hra_exemption"] == 0.0

@test
def test_hra_exemption_zero_under_new_regime():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
        hra_received=250_000, actual_rent_paid=180_000, city_tier="metro"))
    sal = _compute_salary(user, "new")
    assert sal["hra_exemption"] == 0.0
    assert sal["standard_deduction"] == 75_000

@test
def test_professional_tax_old_only():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
        professional_tax=2400))
    sal_old = _compute_salary(user, "old")
    sal_new = _compute_salary(user, "new")
    assert sal_old["professional_tax"] == 2400
    assert sal_new["professional_tax"] == 0.0
    assert approx(sal_old["net_salary_income"], 1_000_000 - 50_000 - 2400)
    assert approx(sal_new["net_salary_income"], 1_000_000 - 75_000)

@test
def test_lta_old_only():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
        lta_claimed=30_000))
    sal_old = _compute_salary(user, "old")
    sal_new = _compute_salary(user, "new")
    assert sal_old["lta_exemption"] == 30_000
    assert sal_new["lta_exemption"] == 0.0


# ── House property ──

@test
def test_sop_interest_cap_old_regime():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        house_property=HousePropertyInput(property_type="self_occupied", home_loan_interest=300_000))
    hp = _compute_house_property(user, "old")
    assert hp["interest_on_loan_24b"] == 200_000
    assert hp["excess_interest_disallowed"] == 100_000
    assert hp["net_house_property_income"] == -200_000

@test
def test_sop_interest_disallowed_new_regime():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        house_property=HousePropertyInput(property_type="self_occupied", home_loan_interest=150_000))
    hp = _compute_house_property(user, "new")
    assert hp["interest_on_loan_24b"] == 0.0
    assert hp["net_house_property_income"] == 0.0
    assert hp["excess_interest_disallowed"] == 150_000

@test
def test_let_out_repair_deduction_both_regimes():
    # Sec 24(a) 30% repair deduction allowed in BOTH regimes for let-out property
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        house_property=HousePropertyInput(property_type="let_out", annual_rent_received=300_000,
            home_loan_interest=50_000))
    hp_old = _compute_house_property(user, "old")
    hp_new = _compute_house_property(user, "new")
    expected_repair = 300_000 * 0.30
    assert approx(hp_old["repair_deduction_30pct"], expected_repair)
    assert approx(hp_new["repair_deduction_30pct"], expected_repair)
    expected_net = 300_000 - expected_repair - 50_000
    assert approx(hp_old["net_house_property_income"], expected_net)
    assert approx(hp_new["net_house_property_income"], expected_net)

@test
def test_let_out_loss_setoff_cap_old_regime():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        house_property=HousePropertyInput(property_type="let_out", annual_rent_received=100_000,
            home_loan_interest=500_000))
    hp = _compute_house_property(user, "old")
    # net before cap = 100000 - 30000(repair) - 500000 = -430000
    # capped at -200000, excess 230000 disallowed
    assert approx(hp["net_house_property_income"], -200_000)
    assert approx(hp["excess_interest_disallowed"], 230_000)

@test
def test_let_out_loss_no_setoff_new_regime():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        house_property=HousePropertyInput(property_type="let_out", annual_rent_received=100_000,
            home_loan_interest=500_000))
    hp = _compute_house_property(user, "new")
    assert hp["net_house_property_income"] == 0.0
    assert hp["excess_interest_disallowed"] > 0


# ── Capital gains set-off hierarchy ──

@test
def test_stcl_setoff_against_stcg_111a_first():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        capital_gains=CapitalGainsInput(stcg_111a=100_000, stcl_equity=40_000))
    cg = _compute_capital_gains(user)
    assert approx(cg["stcg_111a_net"], 60_000)

@test
def test_stcl_residual_setoff_against_ltcg():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        capital_gains=CapitalGainsInput(ltcg_112a=300_000, stcl_equity=50_000))
    cg = _compute_capital_gains(user)
    assert approx(cg["ltcg_112a_net"], 250_000)
    assert approx(cg["ltcg_112a_taxable"], 125_000)  # 250000-125000 exemption

@test
def test_ltcl_setoff_against_ltcg_only_not_stcg():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        capital_gains=CapitalGainsInput(stcg_111a=100_000, ltcg_112a=200_000, ltcl=50_000))
    cg = _compute_capital_gains(user)
    assert approx(cg["stcg_111a_net"], 100_000)   # untouched by LTCL
    assert approx(cg["ltcg_112a_net"], 150_000)   # 200000 - 50000

@test
def test_carry_forward_when_losses_exceed_gains():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        capital_gains=CapitalGainsInput(stcg_111a=10_000, stcl_equity=50_000))
    cg = _compute_capital_gains(user)
    assert cg["stcg_111a_net"] == 0.0
    assert approx(cg["carry_forward_stcl"], 40_000)


# ═══════════════════════════════════════════════════════════════
#  3. DEDUCTIONS UNIT TESTS
# ═══════════════════════════════════════════════════════════════

@test
def test_80c_pool_cap():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(epf=80_000, ppf=80_000, elss=50_000))
    ded = _compute_deductions(user, False, "old")
    assert approx(ded["raw_80c_pool"], 210_000)
    assert approx(ded["capped_80c"], 150_000)

@test
def test_80c_home_loan_principal_auto_added():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(epf=50_000))
    ded = _compute_deductions(user, False, "old", home_loan_principal=40_000)
    assert approx(ded["raw_80c_pool"], 90_000)

@test
def test_80d_self_and_parents_separate_limits():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(health_insurance_self=30_000, health_insurance_parents=60_000,
            parents_senior=True))
    ded = _compute_deductions(user, False, "old")
    # self: min(30000,25000)=25000 (non-senior); parents: min(60000,50000)=50000 (senior parents)
    assert approx(ded["deduction_80d"], 75_000)

@test
def test_80d_senior_self_limit_50k():
    user = UserInput(age=62, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(health_insurance_self=45_000))
    ded = _compute_deductions(user, True, "old")
    assert approx(ded["deduction_80d"], 45_000)  # within 50000 senior cap

@test
def test_80ccd1b_cap_50k():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(nps_self=70_000))
    ded = _compute_deductions(user, False, "old")
    assert ded["deduction_80ccd_1b"] == 50_000

@test
def test_80e_no_cap():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(education_loan_interest=250_000))
    ded = _compute_deductions(user, False, "old")
    assert ded["deduction_80e"] == 250_000

@test
def test_80g_100_and_50_pct():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(donations_100pct=10_000, donations_50pct=20_000))
    ded = _compute_deductions(user, False, "old")
    assert approx(ded["deduction_80g"], 10_000 + 10_000)  # 100% + 50%*20000

@test
def test_80tta_vs_80ttb():
    user_young = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(savings_interest_deduction=60_000))
    user_senior = UserInput(age=65, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(savings_interest_deduction=60_000))
    ded_young = _compute_deductions(user_young, False, "old")
    ded_senior = _compute_deductions(user_senior, True, "old")
    assert ded_young["deduction_80tta_ttb"] == 10_000   # 80TTA cap
    assert ded_senior["deduction_80tta_ttb"] == 50_000  # 80TTB cap

@test
def test_80u_normal_vs_severe():
    user_normal = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(self_disability=True, disability_severe=False))
    user_severe = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        deductions=DeductionsInput(self_disability=True, disability_severe=True))
    assert _compute_deductions(user_normal, False, "old")["deduction_80u"] == 75_000
    assert _compute_deductions(user_severe, False, "old")["deduction_80u"] == 125_000

@test
def test_new_regime_only_80ccd2():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
        employer_nps_contribution=40_000),
        deductions=DeductionsInput(epf=50_000, health_insurance_self=25_000))
    ded = _compute_deductions(user, False, "new")
    assert ded["capped_80c"] == 0.0
    assert ded["deduction_80d"] == 0.0
    assert ded["deduction_80ccd_2"] == 40_000  # within 14% of 500000=70000
    assert ded["total_chapter_via"] == 0.0
    assert ded["new_regime_deductions"] == 40_000


# ═══════════════════════════════════════════════════════════════
#  4. INTEGRATION TESTS — full compute_itr() on representative profiles
# ═══════════════════════════════════════════════════════════════

@test
def test_integration_ev_loan_profile_recommends_old():
    """The flagship bug-fix test: HRA + home loan profile must now
    recommend OLD regime (was incorrectly 'new' before the gti_new fix)."""
    user = UserInput(age=32, mode="estimate",
        salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000,
            hra_received=250_000, actual_rent_paid=240_000, city_tier="metro", professional_tax=2400),
        house_property=HousePropertyInput(property_type="self_occupied",
            home_loan_interest=180_000, home_loan_principal=60_000),
        other_income=OtherIncomeInput(fd_interest=30_000, savings_account_interest=15_000),
        deductions=DeductionsInput(epf=54_000, ppf=50_000, elss=46_000,
            health_insurance_self=25_000, nps_self=50_000),
        taxes_paid=TaxPaidInput(tds_salary=120_000))
    r = compute_itr(user)
    assert approx(r.income_heads.gross_total_income, 1_147_600)
    assert approx(r.income_heads.gross_total_income_new_regime, 1_470_000)
    assert approx(r.regime_comparison.old.total_tax, 100_900.80)
    assert approx(r.regime_comparison.new.total_tax, 104_520.00)
    assert r.recommended_regime == "old"

@test
def test_integration_rent_no_hra_recommends_new():
    user = UserInput(age=28, mode="estimate",
        salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
            hra_received=0, actual_rent_paid=180_000, city_tier="non_metro", professional_tax=2400),
        deductions=DeductionsInput(epf=36_000, elss=50_000, health_insurance_self=20_000),
        taxes_paid=TaxPaidInput(tds_salary=80_000))
    r = compute_itr(user)
    assert r.recommended_regime == "new"
    assert r.regime_comparison.new.total_tax == 0.0
    # New regime GTI should be LOWER than old (no HRA to lose, but higher std deduction)
    assert r.income_heads.gross_total_income_new_regime < r.income_heads.gross_total_income

@test
def test_integration_senior_profile():
    user = UserInput(age=67, mode="estimate",
        salary=SalaryInput(gross_salary=600_000, basic_salary=600_000),
        other_income=OtherIncomeInput(fd_interest=120_000, savings_account_interest=40_000),
        deductions=DeductionsInput(health_insurance_self=50_000, savings_interest_deduction=160_000),
        taxes_paid=TaxPaidInput(tds_other=12_000))
    r = compute_itr(user)
    assert approx(r.regime_comparison.old.total_tax, 33_280)
    assert r.regime_comparison.new.total_tax == 0.0
    assert r.recommended_regime == "new"
    # senior gets 80TTB (50000 cap) not 80TTA
    assert r.deductions.deduction_80tta_ttb == 50_000

@test
def test_integration_high_income_surcharge_and_ccd2():
    user = UserInput(age=44, mode="estimate",
        salary=SalaryInput(gross_salary=4_000_000, basic_salary=2_000_000,
            city_tier="metro", professional_tax=2400, employer_nps_contribution=200_000),
        house_property=HousePropertyInput(property_type="self_occupied",
            home_loan_interest=200_000, home_loan_principal=80_000),
        other_income=OtherIncomeInput(fd_interest=80_000, dividend_income=50_000),
        deductions=DeductionsInput(epf=50_000, ppf=50_000, elss=50_000,
            health_insurance_self=25_000, health_insurance_parents=50_000,
            parents_senior=True, nps_self=50_000),
        taxes_paid=TaxPaidInput(tds_salary=800_000))
    r = compute_itr(user)
    # 80CCD2 old: 10% of 2000000=200000, contributed=200000 -> capped at 200000 (no excess)
    assert approx(r.deductions.deduction_80ccd_2, 200_000)
    # 80CCD2 new: 14% of 2000000=280000, contributed=200000 -> 200000 (not capped)
    assert approx(r.income_heads.gross_total_income_new_regime
                  - r.income_heads.gross_total_income, 177_400, tol=1.0)
    assert r.recommended_regime == "new"
    assert r.regime_comparison.old.surcharge_rate == 0.0  # below 50L
    assert r.regime_comparison.new.surcharge_rate == 0.0

@test
def test_integration_zero_income():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=0, basic_salary=0))
    r = compute_itr(user)
    assert r.regime_comparison.old.total_tax == 0.0
    assert r.regime_comparison.new.total_tax == 0.0
    assert r.income_heads.gross_total_income == 0.0

@test
def test_integration_capital_gains_full_pipeline():
    user = UserInput(age=35, mode="estimate",
        salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000),
        capital_gains=CapitalGainsInput(stcg_111a=200_000, ltcg_112a=300_000, stcl_equity=50_000),
        taxes_paid=TaxPaidInput(tds_salary=100_000))
    r = compute_itr(user)
    cg_after = r.income_heads
    # stcl 50000 first reduces stcg_111a: 200000-50000=150000
    assert approx(cg_after.stcg_111a_net, 150_000)
    assert approx(cg_after.ltcg_112a_net, 300_000)  # untouched
    # special rate tax = 150000*20% + (300000-125000)*12.5%
    expected_spec_tax = 150_000 * 0.20 + 175_000 * 0.125
    assert approx(r.regime_comparison.old.special_rate_tax, expected_spec_tax)
    assert approx(r.regime_comparison.new.special_rate_tax, expected_spec_tax)


# ═══════════════════════════════════════════════════════════════
#  5. REGIME-COMPARISON / BREAKEVEN TESTS
# ═══════════════════════════════════════════════════════════════

@test
def test_breakeven_matches_new_tax():
    """At the breakeven deduction level, old-regime tax must equal new-regime tax."""
    user = UserInput(age=32, mode="estimate",
        salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000,
            hra_received=250_000, actual_rent_paid=240_000, city_tier="metro", professional_tax=2400),
        house_property=HousePropertyInput(property_type="self_occupied",
            home_loan_interest=180_000, home_loan_principal=60_000),
        other_income=OtherIncomeInput(fd_interest=30_000, savings_account_interest=15_000),
        deductions=DeductionsInput(epf=54_000, ppf=50_000, elss=46_000,
            health_insurance_self=25_000, nps_self=50_000),
        taxes_paid=TaxPaidInput(tds_salary=120_000))
    r = compute_itr(user)
    rc = r.regime_comparison
    cg = _compute_capital_gains(user)
    spec_cg = cg["stcg_111a_net"] + cg["ltcg_112a_net"] + cg["ltcg_other_net"]
    spec_tax = _special_rate_tax(cg)
    gti_old = r.income_heads.gross_total_income
    be = rc.breakeven_deductions
    taxable_at_be = max(0.0, gti_old - be - spec_cg + cg["stcg_other_slab"])
    sb_at_be = max(0.0, gti_old - be)
    old_tax_at_be = _compute_full_tax(taxable_at_be, "old", user.age, spec_tax, sb_at_be)["total_tax"]
    assert approx(old_tax_at_be, rc.new.total_tax, tol=0.5)

@test
def test_recommended_regime_flips_with_increasing_deductions():
    """Increasing old-regime deductions should eventually flip recommendation
    from new to old (monotonic: old_tax decreases as deductions increase)."""
    def make_user(epf):
        return UserInput(age=32, mode="estimate",
            salary=SalaryInput(gross_salary=1_300_000, basic_salary=650_000),
            deductions=DeductionsInput(epf=epf))
    r_low = compute_itr(make_user(0))
    r_high = compute_itr(make_user(150_000))
    assert r_low.regime_comparison.old.total_tax > r_high.regime_comparison.old.total_tax
    assert r_low.regime_comparison.new.total_tax == r_high.regime_comparison.new.total_tax

@test
def test_gti_old_and_gti_new_independent():
    """gti_new must NOT be derivable as a simple constant offset from gti_old
    across different profiles — it depends independently on HRA/LTA/proftax/HP."""
    # Profile A: large HRA -> gti_new should be HIGHER than gti_old
    user_a = UserInput(age=30, salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000,
        hra_received=200_000, actual_rent_paid=200_000, city_tier="metro"))
    r_a = compute_itr(user_a)
    assert r_a.income_heads.gross_total_income_new_regime > r_a.income_heads.gross_total_income

    # Profile B: no HRA, no HP -> gti_new should be LOWER than gti_old (by 25000, NEW_SD-OLD_SD)
    user_b = UserInput(age=30, salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000))
    r_b = compute_itr(user_b)
    assert approx(r_b.income_heads.gross_total_income - r_b.income_heads.gross_total_income_new_regime, 25_000)


# ═══════════════════════════════════════════════════════════════
#  6. INVARIANT SWEEPS
# ═══════════════════════════════════════════════════════════════

@test
def test_monotonicity_old_regime_full_sweep():
    prev = None
    for inc in range(0, 20_000_001, 50_000):
        t = _compute_full_tax(inc, "old", 35, 0.0, inc)["total_tax"]
        if prev is not None:
            assert t >= prev - 1e-6, f"tax decreased at income={inc}"
        prev = t

@test
def test_monotonicity_new_regime_full_sweep():
    prev = None
    for inc in range(0, 20_000_001, 50_000):
        t = _compute_full_tax(inc, "new", 35, 0.0, inc)["total_tax"]
        if prev is not None:
            assert t >= prev - 1e-6, f"tax decreased at income={inc}"
        prev = t

@test
def test_monotonicity_around_every_threshold_fine_grained():
    for regime, boundaries in [("old", [500_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000]),
                                ("new", [1_200_000, 5_000_000, 10_000_000, 20_000_000])]:
        for b in boundaries:
            prev = None
            for inc in range(b - 3, b + 4):
                t = _compute_full_tax(inc, regime, 35, 0.0, inc)["total_tax"]
                if prev is not None:
                    assert t >= prev - 1e-6, f"{regime} regime: tax decreased near {b} at income={inc}"
                prev = t

@test
def test_super_senior_slabs_used_for_age_80_plus():
    r80 = _compute_full_tax(600_000, "old", 80, 0.0, 600_000)
    r60 = _compute_full_tax(600_000, "old", 65, 0.0, 600_000)
    r30 = _compute_full_tax(600_000, "old", 30, 0.0, 600_000)
    # super senior pays least (0 up to 5L), senior next, general most
    assert r80["slab_tax"] < r60["slab_tax"] < r30["slab_tax"]


# ═══════════════════════════════════════════════════════════════
#  7. RISK-FLAG TESTS
# ═══════════════════════════════════════════════════════════════

@test
def test_flag_estimate_mode():
    user = UserInput(age=30, mode="estimate", salary=SalaryInput(gross_salary=500_000, basic_salary=300_000))
    r = compute_itr(user)
    assert "ESTIMATE_MODE_WARNING" in [f.code for f in r.risk_flags]

@test
def test_flag_assessment_year_note():
    user = UserInput(age=30, assessment_year="2025-26", salary=SalaryInput(gross_salary=500_000, basic_salary=300_000))
    r = compute_itr(user)
    assert "ASSESSMENT_YEAR_NOTE" in [f.code for f in r.risk_flags]
    user2 = UserInput(age=30, salary=SalaryInput(gross_salary=500_000, basic_salary=300_000))
    r2 = compute_itr(user2)
    assert "ASSESSMENT_YEAR_NOTE" not in [f.code for f in r2.risk_flags]

@test
def test_flag_80c_overshot():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000),
        deductions=DeductionsInput(epf=100_000, ppf=100_000))
    r = compute_itr(user)
    assert "80C_OVERSHOT" in [f.code for f in r.risk_flags]

@test
def test_flag_home_loan_interest_cap():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000),
        house_property=HousePropertyInput(property_type="self_occupied", home_loan_interest=300_000))
    r = compute_itr(user)
    assert "HOME_LOAN_INTEREST_CAP" in [f.code for f in r.risk_flags]

@test
def test_flag_capital_gains_present_and_missing_statement():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        capital_gains=CapitalGainsInput(stcg_111a=50_000))
    r = compute_itr(user)
    codes = [f.code for f in r.risk_flags]
    assert "CAPITAL_GAINS_PRESENT" in codes
    assert "MISSING_CG_STATEMENT" in codes

@test
def test_flag_ltcg_exemption_applied():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        capital_gains=CapitalGainsInput(ltcg_112a=200_000))
    r = compute_itr(user)
    assert "LTCG_EXEMPTION_APPLIED" in [f.code for f in r.risk_flags]

@test
def test_flag_missing_documents():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000))
    r = compute_itr(user)
    codes = [f.code for f in r.risk_flags]
    assert "MISSING_FORM16" in codes
    assert "MISSING_AIS" in codes
    assert "MISSING_26AS" in codes

@test
def test_flag_documents_present_no_missing_flags():
    user = UserInput(age=30, mode="exact", salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        documents=DocumentFlags(has_form16=True, has_ais=True, has_form26as=True))
    r = compute_itr(user)
    codes = [f.code for f in r.risk_flags]
    assert "MISSING_FORM16" not in codes
    assert "MISSING_AIS" not in codes
    assert "MISSING_26AS" not in codes
    assert r.confidence.filing_ready is True

@test
def test_flag_multi_employer():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
        multiple_employers=True))
    r = compute_itr(user)
    assert "MULTI_EMPLOYER" in [f.code for f in r.risk_flags]

@test
def test_flag_new_regime_income_higher_and_lower():
    # higher case
    user_h = UserInput(age=30, salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000,
        hra_received=200_000, actual_rent_paid=200_000, city_tier="metro"))
    r_h = compute_itr(user_h)
    assert "NEW_REGIME_INCOME_HIGHER" in [f.code for f in r_h.risk_flags]
    # lower case
    user_l = UserInput(age=30, salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000))
    r_l = compute_itr(user_l)
    assert "NEW_REGIME_INCOME_LOWER" in [f.code for f in r_l.risk_flags]

@test
def test_flag_employer_nps_cap_info():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000,
        employer_nps_contribution=50_000))
    r = compute_itr(user)
    assert "EMPLOYER_NPS_CAP_INFO" in [f.code for f in r.risk_flags]

@test
def test_flag_advance_tax_check():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000))
    r = compute_itr(user)
    assert "ADVANCE_TAX_CHECK" in [f.code for f in r.risk_flags]


# ═══════════════════════════════════════════════════════════════
#  8. SCOPE / VALIDATION TESTS
# ═══════════════════════════════════════════════════════════════

@test
def test_nri_raises_value_error():
    user = UserInput(age=30, residential_status="nri", salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000))
    try:
        compute_itr(user)
        assert False, "expected ValueError"
    except ValueError:
        pass

@test
def test_minor_raises_value_error():
    user = UserInput(age=16, salary=SalaryInput(gross_salary=100_000, basic_salary=50_000))
    try:
        compute_itr(user)
        assert False, "expected ValueError"
    except ValueError:
        pass

@test
def test_itr_form_selection():
    user_no_cg = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000))
    user_cg = UserInput(age=30, salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        capital_gains=CapitalGainsInput(stcg_111a=10_000))
    from engine import _build_profile
    assert _build_profile(user_no_cg)["itr_form"] == "ITR-1"
    assert _build_profile(user_cg)["itr_form"] == "ITR-2"

@test
def test_itr1_upgraded_above_50l_gross():
    user = UserInput(age=30, salary=SalaryInput(gross_salary=55_00_000, basic_salary=25_00_000))
    from engine import _build_profile
    assert _build_profile(user)["itr_form"] == "ITR-2"

@test
def test_net_payable_property_uses_recommended_regime():
    user = UserInput(age=30, mode="estimate", salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        taxes_paid=TaxPaidInput(tds_salary=100_000))
    r = compute_itr(user)
    rc = r.regime_comparison
    expected = rc.old.net_payable if rc.recommended_regime == "old" else rc.new.net_payable
    assert r.net_payable == expected


# ═══════════════════════════════════════════════════════════════
#  RUNNER
# ═══════════════════════════════════════════════════════════════

def main():
    verbose = "-v" in sys.argv
    passed, failed = 0, 0
    for fn in _tests:
        name = fn.__name__
        try:
            fn()
            passed += 1
            if verbose:
                print(f"  PASS  {name}")
        except AssertionError as e:
            failed += 1
            _failures.append((name, str(e), None))
            print(f"  FAIL  {name}: {e}")
        except Exception as e:
            failed += 1
            tb = traceback.format_exc()
            _failures.append((name, str(e), tb))
            print(f"  ERROR {name}: {e}")

    print()
    print("=" * 60)
    print(f"  {passed} passed, {failed} failed, {len(_tests)} total")
    print("=" * 60)
    if failed:
        print("\nFailure details:")
        for name, msg, tb in _failures:
            print(f"\n--- {name} ---")
            if tb:
                print(tb)
            else:
                print(f"AssertionError: {msg}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
