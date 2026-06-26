"""
fixtures.py — shared fixture generators for 150-case matrix tests.
"""

from __future__ import annotations

import random

from models import (
    UserInput,
    SalaryInput,
    HousePropertyInput,
    OtherIncomeInput,
    DeductionsInput,
    TaxPaidInput,
    DocumentFlags,
    BusinessInput,
    ProfileFlags,
)

SEED_ITR1 = 1001
SEED_ITR3 = 3003
SEED_ITR4 = 4004

INCOME_BAND_RANGES = {
    1: (200_000, 500_000),
    2: (500_001, 1_000_000),
    3: (1_000_001, 2_500_000),
    4: (2_500_001, 4_900_000),
    5: (5_100_000, 8_000_000),
}

AGE_BANDS = {
    "a": (25, 35),
    "b": (60, 64),
    "c": (65, 79),
    "d": (80, 85),
}


def _salary_for_band(band: int, rng: random.Random) -> tuple[float, float]:
    lo, hi = INCOME_BAND_RANGES.get(band, (500_000, 1_000_000))
    gross = rng.randint(lo, hi)
    basic = round(gross * rng.uniform(0.35, 0.55), 0)
    return float(gross), float(basic)


def _deductions_for_case(rng: random.Random, is_senior: bool) -> DeductionsInput:
    epf = rng.choice([0, 30_000, 50_000, 80_000])
    ppf = rng.choice([0, 20_000, 50_000])
    elss = rng.choice([0, 25_000, 50_000])
    nps = rng.choice([0, 25_000, 50_000])
    hi_self = rng.choice([0, 15_000, 25_000, 40_000])
    hi_parents = rng.choice([0, 15_000, 25_000]) if rng.random() > 0.5 else 0
    return DeductionsInput(
        epf=epf,
        ppf=ppf,
        elss=elss,
        nps_self=nps,
        health_insurance_self=hi_self,
        health_insurance_parents=hi_parents,
        parents_senior=rng.random() > 0.6,
        savings_interest_deduction=rng.choice([0, 5_000, 10_000]),
    )


def generate_itr1_fixtures(n: int = 150, seed: int = SEED_ITR1) -> list[UserInput]:
    rng = random.Random(seed)
    fixtures: list[UserInput] = []
    bands = [1, 2, 3, 4]
    ages = list(AGE_BANDS.keys())

    for i in range(n):
        band = bands[i % len(bands)]
        age_key = ages[i % len(ages)]
        age_lo, age_hi = AGE_BANDS[age_key]
        age = rng.randint(age_lo, age_hi)
        gross, basic = _salary_for_band(band, rng)

        has_fd = rng.random() > 0.4
        has_hra = rng.random() > 0.5
        has_hp = rng.random() > 0.7

        fixtures.append(UserInput(
            age=age,
            mode=rng.choice(["estimate", "exact"]),
            salary=SalaryInput(
                gross_salary=gross,
                basic_salary=basic,
                hra_received=150_000 if has_hra else 0,
                actual_rent_paid=180_000 if has_hra else 0,
                city_tier=rng.choice(["metro", "non_metro"]),
                professional_tax=rng.choice([0, 2_400]),
                employer_nps_contribution=rng.choice([0, 30_000, 60_000]),
            ),
            house_property=HousePropertyInput(
                property_type=rng.choice(["none", "self_occupied"]) if has_hp else "none",
                home_loan_interest=rng.choice([0, 100_000, 200_000]) if has_hp else 0,
            ),
            other_income=OtherIncomeInput(
                fd_interest=rng.randint(5_000, 50_000) if has_fd else 0,
                savings_account_interest=rng.randint(1_000, 15_000),
                dividend_income=rng.choice([0, 5_000, 20_000]),
            ),
            deductions=_deductions_for_case(rng, age >= 60),
            taxes_paid=TaxPaidInput(
                tds_salary=round(gross * rng.uniform(0.05, 0.15), 0),
                tds_other=rng.randint(0, 5_000),
            ),
            profile_flags=ProfileFlags(
                income_band=band,  # type: ignore[arg-type]
                business_type_code="x" if not has_fd else "y",
            ),
            documents=DocumentFlags(
                has_form16=rng.random() > 0.3,
                has_ais=rng.random() > 0.5,
                has_form26as=rng.random() > 0.5,
            ),
        ))
    return fixtures


def generate_itr4_fixtures(n: int = 150, seed: int = SEED_ITR4) -> list[UserInput]:
    rng = random.Random(seed)
    fixtures: list[UserInput] = []

    for i in range(n):
        band = (i % 4) + 1
        age = rng.randint(28, 55)
        is_profession = i % 2 == 0
        salary_gross = rng.choice([0, 300_000, 600_000])

        if is_profession:
            receipts = rng.randint(300_000, 4_800_000)
            biz = BusinessInput(
                business_type="presumptive_profession",
                gross_professional_receipts=float(receipts),
                profession_name=rng.choice(["doctor", "lawyer", "consultant", "architect"]),
                cash_receipts_pct=rng.choice([0, 0.02, 0.06]),
            )
        else:
            turnover = rng.randint(500_000, 1_900_000)
            biz = BusinessInput(
                business_type="presumptive_business",
                turnover=float(turnover),
                digital_turnover_pct=rng.uniform(0, 0.8),
                cash_receipts_pct=rng.choice([0, 0.03, 0.07]),
            )

        fixtures.append(UserInput(
            age=age,
            mode="estimate",
            salary=SalaryInput(
                gross_salary=float(salary_gross),
                basic_salary=float(salary_gross * 0.5),
            ),
            other_income=OtherIncomeInput(
                fd_interest=rng.randint(0, 30_000),
                savings_account_interest=rng.randint(0, 8_000),
            ),
            business=biz,
            deductions=_deductions_for_case(rng, False),
            profile_flags=ProfileFlags(
                income_band=band,  # type: ignore[arg-type]
                business_type_code="w",
            ),
        ))
    return fixtures


def generate_itr3_fixtures(n: int = 150, seed: int = SEED_ITR3) -> list[UserInput]:
    rng = random.Random(seed)
    fixtures: list[UserInput] = []

    for i in range(n):
        band = (i % 3) + 2
        age = rng.randint(30, 58)
        revenue = rng.randint(800_000, 5_000_000)
        expense_ratio = rng.uniform(0.3, 0.75)
        expenses = round(revenue * expense_ratio, 0)
        salary_side = rng.choice([0, 400_000, 800_000])

        fixtures.append(UserInput(
            age=age,
            mode=rng.choice(["estimate", "exact"]),
            salary=SalaryInput(
                gross_salary=float(salary_side),
                basic_salary=float(salary_side * 0.5),
            ),
            business=BusinessInput(
                business_type="regular_books",
                actual_gross_receipts=float(revenue),
                actual_expenses=float(expenses),
                profession_name=rng.choice(["trader", "manufacturer", "retailer", "contractor"]),
            ),
            other_income=OtherIncomeInput(
                fd_interest=rng.randint(0, 40_000),
            ),
            deductions=_deductions_for_case(rng, False),
            taxes_paid=TaxPaidInput(
                tds_other=rng.randint(0, 20_000),
                advance_tax_paid=rng.randint(0, 50_000),
            ),
            profile_flags=ProfileFlags(
                income_band=band,  # type: ignore[arg-type]
                business_type_code="v",
            ),
        ))
    return fixtures


def assert_result_sanity(result, expected_form: str | None = None) -> None:
    assert result.income_heads.gross_total_income >= 0
    assert result.regime_comparison.old.total_tax >= 0
    assert result.regime_comparison.new.total_tax >= 0
    assert 0 <= result.confidence.completeness_score <= 100
    assert result.recommended_regime in ("old", "new")
    assert result.regime_comparison.tax_saving >= 0

    rec = result.recommended_regime
    total_tax = (
        result.regime_comparison.old.total_tax
        if rec == "old"
        else result.regime_comparison.new.total_tax
    )
    tds = result.regime_comparison.old.tds_and_advance_tax
    net = (
        result.regime_comparison.old.net_payable
        if rec == "old"
        else result.regime_comparison.new.net_payable
    )
    assert abs(net - (total_tax - tds)) < 1.0

    if expected_form:
        assert result.profile.itr_form == expected_form

    for r in result.recommendations:
        assert r.risk in ("green", "yellow", "red")
        assert r.gov_section
