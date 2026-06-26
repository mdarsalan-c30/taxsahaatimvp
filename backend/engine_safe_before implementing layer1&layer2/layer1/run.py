"""
run.py — ITR Engine: End-to-end Test Runner
=============================================
Tests and demonstrates the full Layer 1 + Layer 2 pipeline.

Usage:
    cd itr_v2
    export ANTHROPIC_API_KEY=sk-ant-...

    python run.py                          # all profiles, both layers
    python run.py --profile ev_loan        # single profile
    python run.py --layer1-only            # skip Layer 2 LLM calls
    python run.py --verbose                # show full LLM I/O
    python run.py --json                   # dump FullITRResult as JSON

Available profiles: ev_loan, rent_no_hra, senior, high_income
"""

import sys, os, json, argparse, dataclasses
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import (
    UserInput, SalaryInput, HousePropertyInput, OtherIncomeInput,
    CapitalGainsInput, DeductionsInput, TaxPaidInput, DocumentFlags,
)
from engine import compute_itr
from layer2 import compute_full, get_questions, run_pipeline


# ─────────────────────────────────────────────
#  SERIALISATION HELPER
# ─────────────────────────────────────────────

def to_dict(obj):
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {k: to_dict(v) for k, v in dataclasses.asdict(obj).items()}
    if isinstance(obj, list):
        return [to_dict(i) for i in obj]
    return obj

def inr(n):
    a = abs(n)
    s = f"₹{a/1e5:.2f}L" if a >= 1e5 else f"₹{a:,.0f}"
    return f"-{s}" if n < 0 else s


# ─────────────────────────────────────────────
#  TEST PROFILES
# ─────────────────────────────────────────────

PROFILES = {

    "ev_loan": {
        "desc": "₹15L salaried · metro · home loan · potential EV loan",
        "user": UserInput(
            age=32, mode="estimate",
            salary=SalaryInput(gross_salary=1_500_000, basic_salary=750_000,
                hra_received=250_000, actual_rent_paid=240_000, city_tier="metro",
                professional_tax=2_400),
            house_property=HousePropertyInput(property_type="self_occupied",
                home_loan_interest=180_000, home_loan_principal=60_000),
            other_income=OtherIncomeInput(fd_interest=30_000, savings_account_interest=15_000),
            deductions=DeductionsInput(epf=54_000, ppf=50_000, elss=46_000,
                health_insurance_self=25_000, nps_self=50_000),
            taxes_paid=TaxPaidInput(tds_salary=120_000),
        ),
        "answers": {
            "q1": {"answered": True,  "answer_yes": True, "answer_amount": 48_000},
            "q2": {"answered": True,  "answer_yes": False},
            "q3": {"answered": False},
        },
    },

    "rent_no_hra": {
        "desc": "₹10L salaried · no HRA · pays rent · 80GG candidate",
        "user": UserInput(
            age=28, mode="estimate",
            salary=SalaryInput(gross_salary=1_000_000, basic_salary=500_000,
                hra_received=0, actual_rent_paid=180_000, city_tier="non_metro",
                professional_tax=2_400),
            deductions=DeductionsInput(epf=36_000, elss=50_000, health_insurance_self=20_000),
            taxes_paid=TaxPaidInput(tds_salary=80_000),
        ),
        "answers": {
            "q1": {"answered": True,  "answer_yes": True, "answer_amount": 180_000},
            "q2": {"answered": True,  "answer_yes": False},
            "q3": {"answered": False},
        },
    },

    "senior": {
        "desc": "Age 67 · pension + FD · 80TTB · 80DDB probe",
        "user": UserInput(
            age=67, mode="estimate",
            salary=SalaryInput(gross_salary=600_000, basic_salary=600_000),
            other_income=OtherIncomeInput(fd_interest=120_000, savings_account_interest=40_000),
            deductions=DeductionsInput(health_insurance_self=50_000,
                savings_interest_deduction=160_000),
            taxes_paid=TaxPaidInput(tds_other=12_000),
        ),
        "answers": {
            "q1": {"answered": True,  "answer_yes": True, "answer_amount": 55_000},
            "q2": {"answered": False},
        },
    },

    "high_income": {
        "desc": "₹40L · metro · surcharge · disabled dependent",
        "user": UserInput(
            age=44, mode="estimate",
            salary=SalaryInput(gross_salary=4_000_000, basic_salary=2_000_000,
                city_tier="metro", professional_tax=2_400,
                employer_nps_contribution=200_000),
            house_property=HousePropertyInput(property_type="self_occupied",
                home_loan_interest=200_000, home_loan_principal=80_000),
            other_income=OtherIncomeInput(fd_interest=80_000, dividend_income=50_000),
            deductions=DeductionsInput(epf=50_000, ppf=50_000, elss=50_000,
                health_insurance_self=25_000, health_insurance_parents=50_000,
                parents_senior=True, nps_self=50_000),
            taxes_paid=TaxPaidInput(tds_salary=800_000),
        ),
        "answers": {
            "q1": {"answered": True,  "answer_yes": True,  "answer_amount": 0},
            "q2": {"answered": True,  "answer_yes": False},
            "q3": {"answered": False},
        },
    },
}


# ─────────────────────────────────────────────
#  PRINT HELPERS
# ─────────────────────────────────────────────

def sep(c="─", w=64): print(c * w)

def print_l1(r):
    sep("═")
    print("LAYER 1 RESULT")
    sep("═")
    rc = r.regime_comparison
    print(f"  GTI               : {inr(r.income_heads.gross_total_income)}")
    print(f"  Old regime tax    : {inr(rc.old.total_tax)}")
    print(f"  New regime tax    : {inr(rc.new.total_tax)}")
    print(f"  Recommended       : {rc.recommended_regime.upper()}")
    print(f"  Tax saving        : {inr(rc.tax_saving)}")
    print(f"  Breakeven ded.    : {inr(rc.breakeven_deductions)}")
    print(f"  Net payable       : {inr(r.net_payable)}")
    print(f"  Completeness      : {r.confidence.completeness_score}%")
    if r.risk_flags:
        print(f"  Risk flags        : {', '.join(f.code for f in r.risk_flags)}")
    print()

def print_questions(summary, questions, ruled_out, potential):
    sep("═")
    print("LAYER 2 — STAGE 1: QUESTIONS")
    sep("═")
    print(f"  {summary}")
    print(f"  Total potential saving: {inr(potential)}")
    print()
    for q in questions:
        sep()
        print(f"  [{q.question_id}] {q.section} — {q.deduction_name}")
        print(f"  Q  : {q.question}")
        print(f"  Why: {q.why_asking}")
        print(f"  Max saving: {inr(q.max_saving_estimate)}  |  Type: {q.answer_type}")
        if q.follow_up_if_yes:
            print(f"  Follow-up: {q.follow_up_if_yes}")
        if q.regime_note:
            print(f"  ⚠ {q.regime_note}")
    if ruled_out:
        sep()
        print("  Ruled out silently:")
        for ro in ruled_out:
            print(f"    ✗ {ro.get('section', '?')}: {ro.get('reason', '')}")
    print()

def print_l2(l2, l1):
    if l2 is None:
        print("  [Layer 2 not run]")
        return
    sep("═")
    print("LAYER 2 — STAGE 2: RESOLVED DEDUCTIONS")
    sep("═")
    if not l2.resolved_deductions:
        print("  No new deductions confirmed.")
    for rd in l2.resolved_deductions:
        status = "✓ CONFIRMED" if rd.confirmed else "✗ NOT ELIGIBLE"
        print(f"\n  {status} — {rd.section}: {rd.deduction_name}")
        print(f"  Deduction    : {inr(rd.final_deduction)}")
        print(f"  Old tax Δ    : {inr(rd.old_regime_tax_impact)}")
        print(f"  Citation     : {rd.citation}")
        if rd.conditions_verified:
            print(f"  ✓ Verified   : {'; '.join(rd.conditions_verified)}")
        if rd.conditions_unverified:
            print(f"  ? Unverified : {'; '.join(rd.conditions_unverified)}")
        if rd.conditions_failed:
            print(f"  ✗ Failed     : {'; '.join(rd.conditions_failed)}")
        if rd.regime_changes_recommendation:
            print("  ⚡ THIS FLIPS THE REGIME RECOMMENDATION")
        print(f"  Note: {rd.note}")
    sep()
    print("  Optimisation suggestions:")
    if not l2.optimisation_suggestions:
        print("  None")
    for s in l2.optimisation_suggestions:
        print(f"\n  [{s.priority.upper()}] {s.category}")
        print(f"  {s.observation}")
        print(f"  → {s.suggestion}  (est. saving: {inr(s.estimated_saving)})")
    sep("═")
    print("REVISED TOTALS")
    sep("═")
    print(f"  Old regime tax (L1 → L2) : {inr(l1.regime_comparison.old.total_tax)} → {inr(l2.revised_old_regime_tax)}")
    print(f"  New regime tax           : {inr(l2.revised_new_regime_tax)}")
    print(f"  Recommended regime       : {l2.revised_recommended_regime.upper()}")
    print(f"  Additional saving found  : {inr(l2.additional_saving_found)}")
    print(f"  Questions asked/answered : {l2.questions_asked} / {l2.questions_answered}")
    print(f"  Deductions confirmed     : {l2.deductions_confirmed}")
    print(f"  CA review still needed   : {'Yes' if l2.ca_review_still_recommended else 'No'}")
    print()


# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="ITR Engine — Full Pipeline Test")
    parser.add_argument("--profile",      type=str, default=None,
                        help=f"Profile to run. Options: {list(PROFILES.keys())}")
    parser.add_argument("--layer1-only",  action="store_true",
                        help="Skip Layer 2 LLM calls (no API key needed).")
    parser.add_argument("--verbose",      action="store_true",
                        help="Show full LLM input/output.")
    parser.add_argument("--json",         action="store_true",
                        help="Dump FullITRResult as JSON.")
    args = parser.parse_args()

    profiles = {args.profile: PROFILES[args.profile]} if args.profile else PROFILES

    if args.profile and args.profile not in PROFILES:
        print(f"Unknown profile '{args.profile}'. Options: {list(PROFILES.keys())}")
        sys.exit(1)

    for name, cfg in profiles.items():
        print()
        sep("═")
        print(f"PROFILE: {name.upper()}")
        print(f"  {cfg['desc']}")
        sep("═")

        print("\n[L1] Computing tax...", end=" ", flush=True)
        try:
            l1 = compute_itr(cfg["user"])
            print("done.")
        except ValueError as e:
            print(f"\n  Out of scope: {e}")
            continue

        print_l1(l1)

        if args.layer1_only:
            continue

        answers_dict = cfg.get("answers")
        stage1, l2 = run_pipeline(cfg["user"], l1, answers_dict, verbose=args.verbose)
        summary, questions, ruled_out, potential = stage1

        print_questions(summary, questions, ruled_out, potential)
        print_l2(l2, l1)

        if args.json and l2 is not None:
            full = type("Full", (), {"layer1": l1, "layer2": l2})()
            print("\n── FullITRResult JSON ──")
            print(json.dumps({"layer1": to_dict(l1), "layer2": to_dict(l2)},
                             indent=2, ensure_ascii=False))

    sep("═")
    print("Done.")


if __name__ == "__main__":
    main()
