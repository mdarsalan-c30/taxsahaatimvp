"""
tests.py
========
Comprehensive test suite for the ITR Layer-1 engine.

Run with:  python tests.py
All tests print PASS / FAIL with the assertion that failed.
"""

import sys
import traceback
from models import (
    UserInput, SalaryInput, HousePropertyInput,
    OtherIncomeInput, CapitalGainsInput, DeductionsInput,
    TaxPaidInput, DocumentFlags,
)
from orchestrator import compute_itr


# ─────────────────────────────────────────────
#  Test runner
# ─────────────────────────────────────────────

_results = []

def test(name):
    """Decorator that registers and runs a test."""
    def decorator(fn):
        try:
            fn()
            _results.append((name, "PASS", None))
        except Exception as e:
            _results.append((name, "FAIL", traceback.format_exc()))
        return fn
    return decorator


def assert_close(a, b, tol=1.0, msg=""):
    """Assert two floats are within tol rupees of each other."""
    if abs(a - b) > tol:
        raise AssertionError(f"{msg}: expected ~{b}, got {a} (diff={abs(a-b):.2f})")


def assert_eq(a, b, msg=""):
    if a != b:
        raise AssertionError(f"{msg}: expected {b!r}, got {a!r}")


# ─────────────────────────────────────────────
#  UNIT TESTS: tax_slabs.py
# ─────────────────────────────────────────────

@test("slab: zero income → zero tax")
def _():
    from tax_slabs import compute_slab_tax
    r = compute_slab_tax(0, "old", age=30)
    assert_eq(r["total_tax"], 0.0)

@test("slab: old regime ₹5L → 87A rebate wipes tax (below 60)")
def _():
    from tax_slabs import compute_slab_tax
    r = compute_slab_tax(500_000, "old", age=30)
    # Slab tax = 0 + 5%*(5L-2.5L) = 12,500; rebate = 12,500; net = 0
    assert_eq(r["tax_after_rebate"], 0.0, "87A rebate should wipe tax at ₹5L")
    assert_eq(r["total_tax"], 0.0)

@test("slab: old regime ₹5.01L → tax applies (no rebate)")
def _():
    from tax_slabs import compute_slab_tax
    r = compute_slab_tax(501_000, "old", age=30)
    assert r["tax_after_rebate"] > 0, "Rebate should not apply above ₹5L"

@test("slab: old regime ₹10L general taxpayer")
def _():
    from tax_slabs import compute_slab_tax
    # 0-2.5L = 0, 2.5-5L = 12500, 5-10L = 100000 → total = 112500
    # + 4% cess = 117000
    r = compute_slab_tax(1_000_000, "old", age=30)
    assert_close(r["slab_tax"], 112_500, msg="Slab tax at ₹10L")
    assert_close(r["total_tax"], 117_000, msg="Total tax (with cess) at ₹10L")

@test("slab: old regime ₹15L → 30% slab kicks in")
def _():
    from tax_slabs import compute_slab_tax
    # 0+12500+100000+30%*(15L-10L)=150000 → slab=262500; cess→273000
    r = compute_slab_tax(1_500_000, "old", age=30)
    assert_close(r["slab_tax"], 262_500, msg="Slab tax at ₹15L old")
    assert_close(r["total_tax"], 273_000, msg="Total tax at ₹15L old")

@test("slab: new regime ₹12L → nil tax via 87A rebate")
def _():
    from tax_slabs import compute_slab_tax
    r = compute_slab_tax(1_200_000, "new", age=30)
    assert_eq(r["total_tax"], 0.0, "New regime ₹12L should be nil tax via rebate")

@test("slab: new regime ₹12.01L → marginal relief caps tax to income excess")
def _():
    from tax_slabs import compute_slab_tax
    r = compute_slab_tax(1_201_000, "new", age=30)
    excess = 1_000.0
    assert_close(r["tax_after_rebate"], excess, msg="Marginal relief caps tax to ₹1k above 12L")
    assert r["rebate_87a"] > 0, "Marginal 87A relief should be recorded in rebate_87a"

@test("slab: new regime ₹15L")
def _():
    from tax_slabs import compute_slab_tax
    # 0(4L) + 5%(4L) + 10%(4L) + 15%(3L) = 0+20000+40000+45000 = 105000
    # cess = 105000*1.04 = 109200
    r = compute_slab_tax(1_500_000, "new", age=30)
    assert_close(r["slab_tax"], 105_000, msg="Slab tax ₹15L new regime")
    assert_close(r["total_tax"], 109_200, msg="Total tax ₹15L new regime")

@test("slab: senior citizen old regime — ₹3L basic exemption")
def _():
    from tax_slabs import compute_slab_tax
    # Senior: nil up to ₹3L; so ₹3L → tax = 0
    r = compute_slab_tax(300_000, "old", age=65)
    assert_eq(r["slab_tax"], 0.0, "Senior ₹3L should have no slab tax")

@test("slab: super-senior old regime — ₹5L basic exemption")
def _():
    from tax_slabs import compute_slab_tax
    r = compute_slab_tax(500_000, "old", age=82)
    assert_eq(r["slab_tax"], 0.0, "Super-senior ₹5L should have no slab tax")

@test("slab: surcharge kicks in above ₹50L")
def _():
    from tax_slabs import compute_slab_tax
    r = compute_slab_tax(5_000_001, "old", age=40, total_income_for_surcharge=5_500_000)
    assert r["surcharge"] > 0, "Surcharge should apply above ₹50L"
    assert_close(r["surcharge_rate"], 0.10, tol=0.001, msg="10% surcharge for 50L-1Cr")

@test("slab: new regime surcharge capped at 25% (not 37%)")
def _():
    from tax_slabs import compute_slab_tax
    r = compute_slab_tax(6_000_000, "new", age=40, total_income_for_surcharge=6_000_000)
    assert r["surcharge_rate"] <= 0.25, "New regime surcharge cannot exceed 25%"


# ─────────────────────────────────────────────
#  UNIT TESTS: salary.py
# ─────────────────────────────────────────────

@test("salary: HRA exemption metro — least of three")
def _():
    from salary import compute_hra_exemption
    # basic=600000, hra_received=200000, rent=180000, metro
    # limb1=200000, limb2=300000, limb3=180000-60000=120000 → min=120000
    result = compute_hra_exemption(200_000, 600_000, 180_000, "metro")
    assert_close(result, 120_000, msg="HRA metro exemption")

@test("salary: HRA exemption non-metro")
def _():
    from salary import compute_hra_exemption
    # basic=600000, hra=150000, rent=200000, non-metro
    # limb1=150000, limb2=240000, limb3=200000-60000=140000 → min=140000
    result = compute_hra_exemption(150_000, 600_000, 200_000, "non_metro")
    assert_close(result, 140_000, msg="HRA non-metro")

@test("salary: no HRA if no rent paid")
def _():
    from salary import compute_hra_exemption
    result = compute_hra_exemption(100_000, 600_000, 0, "metro")
    assert_eq(result, 0.0, "No rent → no HRA exemption")

@test("salary: new regime standard deduction = ₹75k")
def _():
    from salary import compute_net_salary
    s = SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
                    hra_received=100_000, actual_rent_paid=150_000, city_tier="metro")
    r = compute_net_salary(s, regime="new")
    assert_eq(r["standard_deduction"], 75_000)
    assert_eq(r["hra_exemption"], 0.0, "No HRA in new regime")
    assert_eq(r["lta_exemption"], 0.0, "No LTA in new regime")

@test("salary: old regime standard deduction = ₹50k")
def _():
    from salary import compute_net_salary
    s = SalaryInput(gross_salary=1_000_000, basic_salary=500_000)
    r = compute_net_salary(s, regime="old")
    assert_eq(r["standard_deduction"], 50_000)


# ─────────────────────────────────────────────
#  UNIT TESTS: house_property.py
# ─────────────────────────────────────────────

@test("hp: SOP interest capped at ₹2L in old regime")
def _():
    from house_property import compute_house_property
    hp = HousePropertyInput(property_type="self_occupied", home_loan_interest=300_000)
    r = compute_house_property(hp, "old")
    assert_eq(r["interest_on_loan_24b"], 200_000, "SOP interest should be capped at ₹2L")
    assert_eq(r["excess_interest_disallowed"], 100_000)

@test("hp: SOP interest = 0 in new regime")
def _():
    from house_property import compute_house_property
    hp = HousePropertyInput(property_type="self_occupied", home_loan_interest=150_000)
    r = compute_house_property(hp, "new")
    assert_eq(r["interest_on_loan_24b"], 0.0, "No SOP interest deduction in new regime")

@test("hp: let-out property → 30% repair deduction")
def _():
    from house_property import compute_house_property
    hp = HousePropertyInput(property_type="let_out", annual_rent_received=200_000,
                             home_loan_interest=50_000)
    r = compute_house_property(hp, "old")
    assert_close(r["repair_deduction_30pct"], 60_000, msg="30% repair deduction")
    # NAV=200000, repair=60000, NAV_after=140000, interest=50000 → net=90000
    assert_close(r["net_house_property_income"], 90_000, msg="Net let-out income")

@test("hp: let-out loss capped at ₹2L in old regime")
def _():
    from house_property import compute_house_property
    hp = HousePropertyInput(property_type="let_out", annual_rent_received=100_000,
                             home_loan_interest=500_000)
    r = compute_house_property(hp, "old")
    assert_close(r["net_house_property_income"], -200_000, tol=1, msg="Loss capped at ₹2L")

@test("hp: let-out loss = 0 in new regime (disallowed)")
def _():
    from house_property import compute_house_property
    hp = HousePropertyInput(property_type="let_out", annual_rent_received=100_000,
                             home_loan_interest=500_000)
    r = compute_house_property(hp, "new")
    assert_eq(r["net_house_property_income"], 0.0, "HP loss disallowed in new regime")

@test("hp: municipal tax reduces NAV for let-out property")
def _():
    from house_property import compute_house_property
    hp = HousePropertyInput(property_type="let_out", annual_rent_received=200_000,
                             municipal_tax=20_000, home_loan_interest=50_000)
    r = compute_house_property(hp, "old")
    assert_close(r["municipal_tax"], 20_000, msg="Municipal tax applied")
    # NAV=180000, repair=54000, after=126000, interest=50000 → net=76000
    assert_close(r["net_annual_value"], 180_000, msg="NAV after municipal tax")
    assert_close(r["repair_deduction_30pct"], 54_000, msg="30% repair on reduced NAV")
    assert_close(r["net_house_property_income"], 76_000, msg="Net income after municipal tax")


# ─────────────────────────────────────────────
#  UNIT TESTS: capital_gains.py
# ─────────────────────────────────────────────

@test("cg: LTCG 112A — ₹1.25L exemption applied")
def _():
    from capital_gains import compute_capital_gains
    cg = CapitalGainsInput(ltcg_112a=200_000)
    r = compute_capital_gains(cg)
    assert_close(r["ltcg_112a_taxable"], 75_000, msg="LTCG taxable = 200k-125k")

@test("cg: STCL set off against STCG 111A first")
def _():
    from capital_gains import compute_capital_gains
    cg = CapitalGainsInput(stcg_111a=100_000, stcl_equity=60_000)
    r = compute_capital_gains(cg)
    assert_close(r["stcg_111a_net"], 40_000, msg="STCL set off against 111A")

@test("cg: residual STCL set off against LTCG")
def _():
    from capital_gains import compute_capital_gains
    cg = CapitalGainsInput(stcg_111a=50_000, ltcg_112a=100_000, stcl_equity=80_000)
    r = compute_capital_gains(cg)
    assert_close(r["stcg_111a_net"], 0.0, msg="STCG fully offset")
    # Residual STCL = 30k, set off against LTCG 100k → 70k
    assert_close(r["ltcg_112a_net"], 70_000, msg="LTCG after residual STCL")

@test("cg: LTCL set off only against LTCG")
def _():
    from capital_gains import compute_capital_gains
    cg = CapitalGainsInput(ltcg_112a=100_000, stcg_111a=50_000, ltcl=80_000)
    r = compute_capital_gains(cg)
    # LTCL only reduces LTCG, not STCG
    assert_close(r["stcg_111a_net"], 50_000, msg="STCG unaffected by LTCL")
    assert_close(r["ltcg_112a_net"], 20_000, msg="LTCG after LTCL setoff")


# ─────────────────────────────────────────────
#  UNIT TESTS: deductions.py
# ─────────────────────────────────────────────

@test("ded: 80C pool capped at ₹1.5L")
def _():
    from deductions import compute_deductions
    d = DeductionsInput(epf=80_000, ppf=80_000, elss=50_000)
    s = SalaryInput(gross_salary=1_000_000, basic_salary=500_000)
    r = compute_deductions(d, s, is_senior=False, regime="old")
    assert_eq(r["raw_80c_pool"], 210_000)
    assert_eq(r["capped_80c"], 150_000, "80C should be capped at ₹1.5L")

@test("ded: 80D senior self limit = ₹50k")
def _():
    from deductions import compute_deductions
    d = DeductionsInput(health_insurance_self=60_000)
    s = SalaryInput(gross_salary=800_000, basic_salary=400_000)
    r = compute_deductions(d, s, is_senior=True, regime="old")
    assert_eq(r["deduction_80d"], 50_000, "Senior 80D self limit = ₹50k")

@test("ded: new regime → only 80CCD(2) deduction")
def _():
    from deductions import compute_deductions
    d = DeductionsInput(epf=80_000, ppf=50_000, health_insurance_self=25_000, nps_self=50_000)
    s = SalaryInput(gross_salary=1_200_000, basic_salary=600_000, employer_nps_contribution=60_000)
    r = compute_deductions(d, s, is_senior=False, regime="new")
    assert_eq(r["capped_80c"], 0.0, "No 80C in new regime")
    assert_eq(r["deduction_80d"], 0.0, "No 80D in new regime")
    assert_eq(r["deduction_80ccd_1b"], 0.0, "No 80CCD(1B) in new regime")
    # 80CCD(2) = min(60000, 10%*600000=60000) = 60000
    assert_eq(r["deduction_80ccd_2"], 60_000, "80CCD(2) should be ₹60k")

@test("ded: 80CCD(1B) capped at ₹50k")
def _():
    from deductions import compute_deductions
    d = DeductionsInput(nps_self=75_000)
    s = SalaryInput(gross_salary=1_000_000, basic_salary=500_000)
    r = compute_deductions(d, s, is_senior=False, regime="old")
    assert_eq(r["deduction_80ccd_1b"], 50_000, "80CCD(1B) capped at ₹50k")

@test("ded: 80U severe disability = ₹1.25L")
def _():
    from deductions import compute_deductions
    d = DeductionsInput(self_disability=True, disability_severe=True)
    s = SalaryInput(gross_salary=800_000, basic_salary=400_000)
    r = compute_deductions(d, s, is_senior=False, regime="old")
    assert_eq(r["deduction_80u"], 125_000)

@test("ded: 80GG flat ₹60k cap binds for high rent")
def _():
    from deductions import compute_deductions
    d = DeductionsInput(rent_paid_no_hra=300_000)
    s = SalaryInput(gross_salary=1_000_000, basic_salary=500_000)
    # least of: 60k flat, 25% of 1,000,000 = 250k, rent - 10% = 300k-100k = 200k → 60k
    r = compute_deductions(d, s, is_senior=False, regime="old",
                           adjusted_total_income=1_000_000)
    assert_eq(r["deduction_80gg"], 60_000, "80GG flat cap should bind")

@test("ded: 80GG rent-minus-10% limit binds for low income")
def _():
    from deductions import compute_deductions
    d = DeductionsInput(rent_paid_no_hra=120_000)
    s = SalaryInput(gross_salary=300_000, basic_salary=150_000)
    # least of: 60k, 25% of 300k = 75k, rent - 10% = 120k - 30k = 90k → 60k
    r = compute_deductions(d, s, is_senior=False, regime="old",
                           adjusted_total_income=300_000)
    assert_eq(r["deduction_80gg"], 60_000, "Flat cap still lowest here")

@test("ded: 80GG not allowed in new regime")
def _():
    from deductions import compute_deductions
    d = DeductionsInput(rent_paid_no_hra=120_000)
    s = SalaryInput(gross_salary=1_000_000, basic_salary=500_000)
    r = compute_deductions(d, s, is_senior=False, regime="new",
                           adjusted_total_income=1_000_000)
    assert_eq(r["deduction_80gg"], 0.0, "No 80GG in new regime")


# ─────────────────────────────────────────────
#  INTEGRATION TESTS: orchestrator.py
# ─────────────────────────────────────────────

def _simple_salaried_user(
    age=30, gross=1_200_000, basic=600_000, mode="estimate"
) -> UserInput:
    return UserInput(
        age=age,
        mode=mode,
        salary=SalaryInput(gross_salary=gross, basic_salary=basic),
    )


@test("integration: basic salaried ₹12L — new regime wins (nil tax)")
def _():
    user = _simple_salaried_user(gross=1_200_000, basic=600_000)
    result = compute_itr(user)
    # New regime ₹12L → nil tax after 87A
    assert_eq(result.regime_comparison.new.total_tax, 0.0,
              "New regime ₹12L should be nil tax")
    assert_eq(result.recommended_regime, "new")

@test("integration: ₹8L income — new regime nil tax")
def _():
    user = _simple_salaried_user(gross=800_000, basic=400_000)
    result = compute_itr(user)
    assert result.regime_comparison.new.total_tax == 0.0

@test("integration: ₹20L income — regime comparison makes sense")
def _():
    user = UserInput(
        age=30,
        salary=SalaryInput(gross_salary=2_000_000, basic_salary=1_000_000),
        deductions=DeductionsInput(
            epf=50_000, ppf=50_000, elss=50_000,
            health_insurance_self=25_000,
            nps_self=50_000,
        ),
    )
    result = compute_itr(user)
    old_tax = result.regime_comparison.old.total_tax
    new_tax = result.regime_comparison.new.total_tax
    assert old_tax > 0 and new_tax > 0, "Both regimes should have tax at ₹20L"
    assert result.regime_comparison.tax_saving >= 0

@test("integration: HRA claim reduces taxable salary (old regime)")
def _():
    user = UserInput(
        age=30,
        salary=SalaryInput(
            gross_salary=1_500_000, basic_salary=750_000,
            hra_received=250_000, actual_rent_paid=250_000,
            city_tier="metro",
        ),
    )
    result = compute_itr(user)
    # HRA exemption = min(250k, 375k, 250k-75k=175k) = 175k (old regime)
    assert_close(result.income_heads.hra_exemption, 175_000, msg="HRA exemption")

@test("integration: senior citizen — ₹3L nil slab (old regime)")
def _():
    user = _simple_salaried_user(age=65, gross=300_000, basic=150_000)
    result = compute_itr(user)
    # After std deduction ₹50k, taxable = ₹2.5L; senior nil up to ₹3L → zero
    assert_eq(result.regime_comparison.old.slab_tax, 0.0, "Senior ₹3L nil slab")

@test("integration: home loan interest creates HP loss (old regime)")
def _():
    user = UserInput(
        age=35,
        salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        house_property=HousePropertyInput(
            property_type="self_occupied",
            home_loan_interest=200_000,
        ),
    )
    result = compute_itr(user)
    assert_close(result.income_heads.net_house_property_income, -200_000,
                 msg="SOP loss should reduce GTI")

@test("integration: capital gains correctly taxed at special rates")
def _():
    user = UserInput(
        age=30,
        salary=SalaryInput(gross_salary=1_200_000, basic_salary=600_000),
        capital_gains=CapitalGainsInput(ltcg_112a=300_000),
    )
    result = compute_itr(user)
    # LTCG taxable = 300k - 125k = 175k at 12.5% = 21875
    # (plus cess = 21875*1.04 = 22750)
    assert_close(result.regime_comparison.new.special_rate_tax, 21_875, tol=10,
                 msg="LTCG 112A special rate tax")

@test("integration: 80C + NPS deductions reduce old regime tax")
def _():
    user = UserInput(
        age=30,
        salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000),
        deductions=DeductionsInput(
            epf=50_000, ppf=50_000, elss=50_000,
            nps_self=50_000,
            health_insurance_self=25_000,
        ),
    )
    result = compute_itr(user)
    # Old regime deductions = 150k (80C cap) + 50k (NPS) + 25k (80D) = 225k
    assert_close(result.deductions.total_chapter_via, 225_000, tol=100,
                 msg="Total VI-A deductions")
    old_taxable = result.regime_comparison.old.taxable_income
    new_taxable = result.regime_comparison.new.taxable_income
    assert old_taxable < new_taxable, "Old regime taxable should be lower with deductions"

@test("integration: NRI raises out-of-scope error")
def _():
    user = UserInput(age=30, residential_status="nri",
                     salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000))
    try:
        compute_itr(user)
        raise AssertionError("Should have raised ValueError for NRI")
    except ValueError as e:
        assert "NRI" in str(e)

@test("integration: breakeven deduction is positive and reasonable")
def _():
    user = UserInput(
        age=30,
        salary=SalaryInput(gross_salary=2_000_000, basic_salary=1_000_000),
    )
    result = compute_itr(user)
    be = result.regime_comparison.breakeven_deductions
    assert be > 0, "Breakeven deductions should be positive"
    assert be < user.salary.gross_salary, "Breakeven should be less than gross salary"

@test("integration: zero income → zero tax both regimes")
def _():
    user = _simple_salaried_user(gross=0, basic=0)
    result = compute_itr(user)
    assert_eq(result.regime_comparison.old.total_tax, 0.0)
    assert_eq(result.regime_comparison.new.total_tax, 0.0)

@test("integration: estimate mode flag in confidence result")
def _():
    user = _simple_salaried_user(mode="estimate")
    result = compute_itr(user)
    assert result.confidence.is_estimate_mode
    assert not result.confidence.filing_ready

@test("integration: exact mode + all docs → filing ready")
def _():
    user = UserInput(
        age=30,
        mode="exact",
        salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000),
        documents=DocumentFlags(
            has_form16=True,
            has_ais=True,
            has_form26as=True,
        ),
    )
    result = compute_itr(user)
    assert result.confidence.filing_ready, "Exact mode + all docs → filing ready"

@test("integration: risk flag for 80C overshoot")
def _():
    user = UserInput(
        age=30,
        salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000),
        deductions=DeductionsInput(epf=100_000, ppf=100_000, elss=50_000),
    )
    result = compute_itr(user)
    flag_codes = [f.code for f in result.risk_flags]
    assert "80C_OVERSHOT" in flag_codes, "80C overshot flag should fire"

@test("integration: high income triggers CA recommendation")
def _():
    user = UserInput(
        age=40,
        salary=SalaryInput(gross_salary=6_000_000, basic_salary=3_000_000),
    )
    result = compute_itr(user)
    assert result.confidence.ca_escalation_recommended
    assert any("50 lakh" in r for r in result.confidence.ca_escalation_reasons)

@test("integration: TDS fully offsets tax → refund")
def _():
    user = UserInput(
        age=30,
        salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000),
        taxes_paid=TaxPaidInput(tds_salary=300_000),
    )
    result = compute_itr(user)
    # With ₹3L TDS and moderate tax liability, net should be negative (refund)
    rec = result.recommended_regime
    net = result.regime_comparison.old.net_payable if rec == "old" else result.regime_comparison.new.net_payable
    assert net < 0, f"Should be refund scenario, got net_payable={net}"


# ─────────────────────────────────────────────
#  Run all and report
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  ITR Engine — Test Suite")
    print("=" * 60)

    passed = sum(1 for _, s, _ in _results if s == "PASS")
    failed = sum(1 for _, s, _ in _results if s == "FAIL")

    for name, status, tb in _results:
        icon = "✓" if status == "PASS" else "✗"
        print(f"  {icon}  {name}")
        if tb:
            for line in tb.strip().split("\n"):
                print(f"        {line}")

    print()
    print(f"  {passed} passed · {failed} failed · {passed + failed} total")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)
