"""
layer2.py — Layer 2: LLM-Powered Deduction Discovery
======================================================
Wraps Layer 1 output with an intelligent deduction discovery pipeline
powered by the Anthropic API (claude-sonnet-4-20250514).

Public API — two-step flow matching the website:

    STEP 1: Get questions
        from layer2 import get_questions
        analysis = get_questions(user, layer1_result)
        # Send analysis.questions to the website UI

    STEP 2: Submit answers, get resolved deductions
        from layer2 import resolve
        answers = [QuestionAnswer(...), ...]
        layer2_result = resolve(user, layer1_result, analysis, answers)

    ONE-SHOT (scripting / testing):
        from layer2 import run_pipeline
        analysis, result = run_pipeline(user, layer1_result, answers_dict)

Requires:
    pip install anthropic
    export ANTHROPIC_API_KEY=sk-ant-...
"""

from __future__ import annotations
import json
import os
import time
from typing import Optional

from models import (
    UserInput, ITRResult, FullITRResult,
    Question, QuestionAnswer, ResolvedDeduction,
    OptimisationSuggestion, Layer2Result,
)

try:
    import anthropic as _anthropic
    _CLIENT = _anthropic.Anthropic()
    _AVAILABLE = True
except Exception:
    _CLIENT = None
    _AVAILABLE = False

_MODEL      = "claude-sonnet-4-20250514"
_MAX_TOKENS = 6000


# ═══════════════════════════════════════════════════════════════
#  SECTION 1: PROFILE SERIALISER
#  Converts ITRResult + UserInput into readable text for the LLM.
#  Human-readable format mirrors what a CA sees in a client meeting.
# ═══════════════════════════════════════════════════════════════

def _inr(n: float) -> str:
    a = abs(n)
    s = (f"₹{a/1e7:.2f}Cr" if a >= 1e7 else f"₹{a/1e5:.2f}L" if a >= 1e5 else f"₹{a:,.0f}")
    return f"-{s}" if n < 0 else s

def _serialise(user: UserInput, result: ITRResult) -> str:
    ih  = result.income_heads
    d   = result.deductions
    rc  = result.regime_comparison
    s   = user.salary
    hp  = user.house_property
    oi  = user.other_income
    cg  = user.capital_gains
    ded = user.deductions
    tp  = user.taxes_paid

    def yn(v): return "Yes" if v else "No"

    lines = [
        "═══ TAXPAYER PROFILE — FY 2025-26 / AY 2026-27 ═══",
        f"Age: {user.age}  |  Status: {user.residential_status.upper()}  |  Mode: {user.mode}",
        "",
        "── Salary ──",
        f"Gross salary       : {_inr(s.gross_salary)}",
        f"Basic salary       : {_inr(s.basic_salary)}",
        f"HRA received       : {_inr(s.hra_received)}",
        f"Rent paid (annual) : {_inr(s.actual_rent_paid)}",
        f"City tier          : {s.city_tier}",
        f"Professional tax   : {_inr(s.professional_tax)}",
        f"Multiple employers : {yn(s.multiple_employers)}",
        f"Employer NPS       : {_inr(s.employer_nps_contribution)}",
        "",
        "── House Property ──",
        f"Type               : {hp.property_type}",
        f"Annual rent recd   : {_inr(hp.annual_rent_received)}",
        f"Home loan interest : {_inr(hp.home_loan_interest)}",
        f"Home loan principal: {_inr(hp.home_loan_principal)}",
        "",
        "── Other Income ──",
        f"FD interest        : {_inr(oi.fd_interest)}",
        f"Savings interest   : {_inr(oi.savings_account_interest)}",
        f"Dividend income    : {_inr(oi.dividend_income)}",
        "",
        "── Capital Gains ──",
        f"STCG 111A (equity) : {_inr(cg.stcg_111a)}",
        f"LTCG 112A (equity) : {_inr(cg.ltcg_112a)}",
        f"STCG other (slab)  : {_inr(cg.stcg_other)}",
        f"LTCG other (20%)   : {_inr(cg.ltcg_other)}",
        f"STCG loss          : {_inr(cg.stcl_equity)}",
        f"LTCG loss          : {_inr(cg.ltcl)}",
        "",
        "── Deductions Declared ──",
        f"EPF / PPF / ELSS   : {_inr(ded.epf)} / {_inr(ded.ppf)} / {_inr(ded.elss)}",
        f"LIC / NSC          : {_inr(ded.lic_premium)} / {_inr(ded.nsc)}",
        f"Other 80C          : {_inr(ded.other_80c)}",
        f"80C pool (raw/cap) : {_inr(d.raw_80c_pool)} / {_inr(d.capped_80c)}",
        f"Health ins self    : {_inr(ded.health_insurance_self)}",
        f"Health ins parents : {_inr(ded.health_insurance_parents)}"
            + (" (parents senior)" if ded.parents_senior else ""),
        f"NPS self 80CCD(1B) : {_inr(ded.nps_self)}",
        f"Edu loan interest  : {_inr(ded.education_loan_interest)}",
        f"Donations 100%/50% : {_inr(ded.donations_100pct)} / {_inr(ded.donations_50pct)}",
        f"Savings int. ded.  : {_inr(ded.savings_interest_deduction)}",
        f"Self disability    : {yn(ded.self_disability)}"
            + (" — severe" if ded.disability_severe else ""),
        f"Total Chapter VI-A : {_inr(d.total_chapter_via)}",
        "",
        "── Taxes Paid ──",
        f"TDS salary / other : {_inr(tp.tds_salary)} / {_inr(tp.tds_other)}",
        f"Advance tax / SAT  : {_inr(tp.advance_tax_paid)} / {_inr(tp.self_assessment_tax_paid)}",
        "",
        "═══ LAYER 1 RESULT ═══",
        f"Gross total income : {_inr(ih.gross_total_income)}",
        f"Net salary income  : {_inr(ih.net_salary_income)}  (HRA: {_inr(ih.hra_exemption)})",
        f"House property     : {_inr(ih.net_house_property_income)}  (int: {_inr(ih.interest_on_loan_24b)})",
        "",
        "OLD REGIME",
        f"  Taxable income   : {_inr(rc.old.taxable_income)}",
        f"  Total tax        : {_inr(rc.old.total_tax)}",
        f"  Net payable      : {_inr(rc.old.net_payable)}",
        f"  Effective rate   : {rc.old_effective_rate:.2f}%",
        "",
        "NEW REGIME",
        f"  Taxable income   : {_inr(rc.new.taxable_income)}",
        f"  Total tax        : {_inr(rc.new.total_tax)}",
        f"  Net payable      : {_inr(rc.new.net_payable)}",
        f"  Effective rate   : {rc.new_effective_rate:.2f}%",
        "",
        f"RECOMMENDED        : {rc.recommended_regime.upper()}",
        f"TAX SAVING         : {_inr(rc.tax_saving)}",
        f"BREAKEVEN DED.     : {_inr(rc.breakeven_deductions)}",
        f"DEDUCTIONS LOST    : {_inr(rc.deductions_lost_in_new)} (new regime)",
        "",
        "── Risk Flags ──",
    ]
    for flag in result.risk_flags:
        lines.append(f"  [{flag.severity.upper()}] {flag.code}: {flag.message}")
    if not result.risk_flags:
        lines.append("  None")
    return "\n".join(lines)

def _serialise_answers(questions: list[Question], answers: list[QuestionAnswer]) -> str:
    amap = {a.question_id: a for a in answers}
    lines = ["═══ QUESTIONS AND ANSWERS ═══", ""]
    for q in questions:
        a = amap.get(q.question_id)
        lines.append(f"[{q.question_id}] {q.section} — {q.deduction_name}")
        lines.append(f"  Q: {q.question}")
        if not a or not a.answered:
            lines.append("  A: SKIPPED")
        elif q.answer_type == "yes_no":
            lines.append(f"  A: {'YES' if a.answer_yes else 'NO'}")
        elif q.answer_type == "amount":
            lines.append(f"  A: {_inr(a.answer_amount or 0)}")
        elif q.answer_type == "yes_no_with_amount":
            lines.append(f"  A: {'YES — ' + _inr(a.answer_amount or 0) if a.answer_yes else 'NO'}")
        elif q.answer_type == "multiple_choice":
            lines.append(f"  A: {a.answer_choice}")
        lines.append("")
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════
#  SECTION 2: LLM PROMPTS
# ═══════════════════════════════════════════════════════════════

_STAGE1_SYSTEM = """You are an expert Indian Chartered Accountant reviewing a taxpayer profile for FY 2025-26 (AY 2026-27).

Your job: identify which ADDITIONAL deductions the taxpayer may be missing (beyond what Layer 1 already computed) and generate ONLY the targeted questions needed to confirm or rule them out.

Layer 1 already handles — DO NOT ask about these again:
80C (EPF/PPF/ELSS/LIC/NSC/principal/fees), 80CCD(1B) NPS, 80CCD(2) employer NPS, 80D health insurance, 24(b) home loan interest, 80TTA/80TTB savings interest, 80E education loan, 80G donations, 80U self disability, standard deduction, HRA.

Deductions YOU probe for (only where plausible):
- 80EEB: EV loan interest (max ₹1.5L). Applies only to loans SANCTIONED between 1-Apr-2019 and 31-Mar-2023 from a bank/NBFC for an electric vehicle — the deduction continues for the loan tenure even though new loans no longer qualify. Ask whether they have such an ONGOING EV loan from that window, not whether they bought an EV this year.
- 80EEA: Affordable housing extra interest (max ₹1.5L). Applies only to loans SANCTIONED between 1-Apr-2019 and 31-Mar-2022, stamp duty value ≤ ₹45L, first home buyer only — the window for new loans has closed, but the deduction continues year-on-year for qualifying ongoing loans. Ask about an ONGOING loan from that window.
- 80EE: First-home extra interest (max ₹50k). Loan < ₹35L, property < ₹50L, loan between 1-Apr-2016 and 31-Mar-2017.
- 80GG: Rent without HRA (ask ONLY if hra_received = 0 AND rent is being paid). Amount = min(₹5k/month, 25% income, rent − 10% income).
- 80DD: Dependent with disability (₹75k / ₹1.25L severe). Distinct from 80U which is self.
- 80DDB: Specified disease treatment (₹40k general / ₹1L senior). Cancer, neurological, AIDS, renal failure, haematological.
- 89(1): Arrear salary relief. Ask if salary arrears from a prior year were received this year.
- 10(14): Children education allowance (₹100/child/month, max 2), hostel (₹300/child/month). Ask if employer pays these.
- 17(2): Employer-provided phone/internet/books perquisite exemption. Ask if employer reimburses these.

INTELLIGENT EXCLUSION — silently exclude without asking:
- Age ≥ 60: exclude 80EEB, 80EEA, 80EE (unlikely at this life stage)
- Age < 25: exclude 80DD/80DDB (unlikely dependents)
- has_hra_received > 0: exclude 80GG entirely
- property_type = let_out or has_home_loan and NOT first home signals: exclude 80EEA/80EE
- Income < ₹7L and new regime recommended with nil tax: note that old-regime deductions won't help unless they flip the regime; only ask if max_saving_estimate is significant enough to flip
- Already new regime with nil tax: for each question note whether it could actually change the recommendation

REGIME AWARENESS:
- If new regime is recommended with nil tax: most deductions only help in old regime. State this clearly in regime_note and only ask if the deduction is large enough to potentially flip the regime recommendation (i.e. saving > current old regime tax burden).
- If old regime recommended: all valid deductions matter.

Return ONLY valid JSON — no markdown, no prose:
{
  "profile_summary": "<2-3 sentence CA-style read of this taxpayer and focus areas>",
  "ruled_out": [{"section": "80GG", "reason": "HRA received — 80GG not applicable"}],
  "questions": [
    {
      "question_id": "q1",
      "section": "80EEB",
      "deduction_name": "EV loan interest",
      "question": "Have you taken a loan to purchase an electric vehicle (EV)?",
      "why_asking": "EV loan interest is deductible up to ₹1,50,000 under Sec 80EEB",
      "max_saving_estimate": 45000,
      "answer_type": "yes_no_with_amount",
      "follow_up_if_yes": "What is the annual interest paid on the EV loan?",
      "options": null,
      "regime_note": "Only available in old regime. At your income level, may not change regime recommendation."
    }
  ]
}
Sort questions by max_saving_estimate descending. Maximum 7 questions. Fewer is better."""

_STAGE2_SYSTEM = """You are an Indian tax eligibility verifier for FY 2025-26 / AY 2026-27.

Given a taxpayer profile and their answers to deduction questions, you must:
1. Verify eligibility conditions for each confirmed deduction
2. Compute exact deduction amount (apply statutory caps)
3. Calculate old and new regime tax impact
4. Cite exact section and subsection
5. Generate optimisation suggestions for headroom and missed opportunities

DEDUCTION CAPS:
80EEB: ₹1,50,000  |  80EE: ₹50,000  |  80EEA: ₹1,50,000 (additional over 24b)
80GG: min(₹5k/month, 25% adj. total income, rent − 10% adj. income)
80DD: ₹75,000 normal / ₹1,25,000 severe  |  80DDB: ₹40,000 (₹1,00,000 senior)
10(14) children edu: ₹100/child/month max 2  |  hostel: ₹300/child/month max 2

TAX IMPACT CALCULATION:
Use the marginal rate at the taxpayer's old-regime taxable income:
5–10L → 20.8% (20% + 4% cess)  |  10L+ → 31.2% (30% + 4% cess)  |  50L+ include surcharge
New regime: most Chapter VI-A deductions do not apply — tax impact = 0.

OPTIMISATION SUGGESTIONS — always generate for:
1. 80C headroom: if raw_80c_pool < ₹1,50,000 → suggest remaining headroom instruments
2. 80CCD(1B): if nps_self < ₹50,000 in old regime → note unused headroom
3. 80D headroom: if declared < limit for self or parents
4. Regime flip: if confirmed new deductions push old below new tax → flag explicitly
5. 80GG: if no HRA and no rent declared → note if applicable
6. Advance tax: if net payable > ₹10,000 with no advance tax paid

Return ONLY valid JSON — no markdown, no prose:
{
  "resolved_deductions": [
    {
      "section": "80EEB",
      "deduction_name": "EV loan interest",
      "confirmed": true,
      "declared_amount": 48000,
      "capped_at": 150000,
      "final_deduction": 48000,
      "old_regime_tax_impact": -14976,
      "new_regime_tax_impact": 0,
      "citation": "Section 80EEB(1), Income Tax Act 1961, inserted by Finance Act 2019",
      "conditions_verified": ["Loan for EV purchase", "Amount within ₹1.5L cap"],
      "conditions_unverified": ["Loan sanction date — must fall in 1-Apr-2019 to 31-Mar-2023 (deduction continues for tenure of an ongoing loan from that window)"],
      "conditions_failed": [],
      "note": "Saves ₹14,976 in old regime. New regime remains recommended at current income.",
      "regime_changes_recommendation": false
    }
  ],
  "optimisation_suggestions": [
    {
      "category": "80C headroom",
      "section": "80C",
      "observation": "80C pool ₹2,10,000 but cap is ₹1,50,000 — ₹60,000 wasted.",
      "suggestion": "Redirect ₹50,000 excess to 80CCD(1B) NPS for an additional deduction outside the 80C cap.",
      "estimated_saving": 15600,
      "priority": "high"
    }
  ],
  "revised_old_regime_tax": 85924,
  "revised_new_regime_tax": 0,
  "revised_recommended_regime": "new",
  "additional_saving_found": 14976,
  "ca_review_still_recommended": false,
  "summary": "<2-3 sentence plain-English summary of what was found>"
}"""


# ═══════════════════════════════════════════════════════════════
#  SECTION 3: LLM CALLER
# ═══════════════════════════════════════════════════════════════

def _call_llm(system: str, user_msg: str, retries: int = 2) -> str:
    if not _AVAILABLE:
        raise RuntimeError(
            "anthropic package not installed or ANTHROPIC_API_KEY not set.\n"
            "Run: pip install anthropic && export ANTHROPIC_API_KEY=sk-ant-..."
        )
    for attempt in range(retries + 1):
        try:
            resp = _CLIENT.messages.create(
                model=_MODEL, max_tokens=_MAX_TOKENS,
                system=system,
                messages=[{"role": "user", "content": user_msg}]
            )
            return resp.content[0].text
        except Exception as e:
            if attempt < retries:
                print(f"[Layer2] Attempt {attempt+1} failed: {e}. Retrying...")
                time.sleep(2 ** attempt)
            else:
                raise

def _parse_json(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


# ═══════════════════════════════════════════════════════════════
#  SECTION 4: STAGE PARSERS
# ═══════════════════════════════════════════════════════════════

def _parse_questions(raw: list[dict]) -> list[Question]:
    out = []
    for item in raw:
        try:
            out.append(Question(
                question_id=item["question_id"], section=item["section"],
                deduction_name=item["deduction_name"], question=item["question"],
                why_asking=item["why_asking"],
                max_saving_estimate=float(item.get("max_saving_estimate", 0)),
                answer_type=item["answer_type"],
                follow_up_if_yes=item.get("follow_up_if_yes"),
                options=item.get("options"), regime_note=item.get("regime_note")))
        except (KeyError, TypeError) as e:
            print(f"[Layer2] Skipping malformed question: {e}")
    return out

def _parse_resolved(raw: list[dict]) -> list[ResolvedDeduction]:
    out = []
    for item in raw:
        try:
            out.append(ResolvedDeduction(
                section=item["section"], deduction_name=item["deduction_name"],
                confirmed=bool(item["confirmed"]),
                declared_amount=float(item.get("declared_amount", 0)),
                capped_at=float(item["capped_at"]) if item.get("capped_at") else None,
                final_deduction=float(item.get("final_deduction", 0)),
                old_regime_tax_impact=float(item.get("old_regime_tax_impact", 0)),
                new_regime_tax_impact=float(item.get("new_regime_tax_impact", 0)),
                citation=item.get("citation", ""),
                conditions_verified=item.get("conditions_verified", []),
                conditions_unverified=item.get("conditions_unverified", []),
                conditions_failed=item.get("conditions_failed", []),
                note=item.get("note", ""),
                regime_changes_recommendation=bool(item.get("regime_changes_recommendation", False))))
        except (KeyError, TypeError) as e:
            print(f"[Layer2] Skipping malformed deduction: {e}")
    return out

def _parse_suggestions(raw: list[dict]) -> list[OptimisationSuggestion]:
    out = []
    for item in raw:
        try:
            out.append(OptimisationSuggestion(
                category=item.get("category", ""), section=item.get("section"),
                observation=item.get("observation", ""), suggestion=item.get("suggestion", ""),
                estimated_saving=float(item.get("estimated_saving", 0)),
                priority=item.get("priority", "medium")))
        except (KeyError, TypeError) as e:
            print(f"[Layer2] Skipping malformed suggestion: {e}")
    return out


# ═══════════════════════════════════════════════════════════════
#  SECTION 5: PUBLIC API
# ═══════════════════════════════════════════════════════════════

def get_questions(
    user: UserInput,
    result: ITRResult,
    verbose: bool = False,
) -> tuple[str, list[Question], list[dict], float]:
    """
    Stage 1: Analyse the profile and return targeted questions.

    Parameters
    ----------
    user    : UserInput passed to Layer 1.
    result  : ITRResult from compute_itr().
    verbose : Print LLM I/O if True.

    Returns
    -------
    (profile_summary, questions, ruled_out, total_potential_saving)

    Unpack as:
        summary, questions, ruled_out, potential = get_questions(user, result)
    """
    profile_text = _serialise(user, result)
    user_msg = ("Analyse this taxpayer profile and generate targeted questions "
                "for additional deductions.\n\n" + profile_text)
    if verbose:
        print("\n── Stage 1 user message ──")
        print(user_msg[:1500])
        print("─" * 60)
    raw = _call_llm(_STAGE1_SYSTEM, user_msg)
    if verbose:
        print("\n── Stage 1 LLM response ──")
        print(raw)
        print("─" * 60)
    parsed = _parse_json(raw)
    questions    = _parse_questions(parsed.get("questions", []))
    ruled_out    = parsed.get("ruled_out", [])
    summary      = parsed.get("profile_summary", "")
    potential    = sum(q.max_saving_estimate for q in questions)
    return summary, questions, ruled_out, potential


def resolve(
    user: UserInput,
    result: ITRResult,
    questions: list[Question],
    answers: list[QuestionAnswer],
    profile_summary: str = "",
    verbose: bool = False,
) -> Layer2Result:
    """
    Stage 2: Verify eligibility and compute final savings.

    Parameters
    ----------
    user          : UserInput.
    result        : ITRResult from compute_itr().
    questions     : Questions list from get_questions().
    answers       : User responses to each question.
    profile_summary : Summary string from get_questions().
    verbose       : Print LLM I/O if True.

    Returns
    -------
    Layer2Result with confirmed deductions, tax impacts, and suggestions.
    """
    profile_text = _serialise(user, result)
    answers_text = _serialise_answers(questions, answers)
    user_msg = ("Verify eligibility for confirmed deductions and generate "
                "optimisation suggestions.\n\n" + profile_text + "\n\n" + answers_text)
    if verbose:
        print("\n── Stage 2 user message ──")
        print(user_msg[:2000])
        print("─" * 60)
    raw = _call_llm(_STAGE2_SYSTEM, user_msg)
    if verbose:
        print("\n── Stage 2 LLM response ──")
        print(raw)
        print("─" * 60)
    parsed    = _parse_json(raw)
    resolved  = _parse_resolved(parsed.get("resolved_deductions", []))
    sugg      = _parse_suggestions(parsed.get("optimisation_suggestions", []))
    old_tax   = float(parsed.get("revised_old_regime_tax", result.regime_comparison.old.total_tax))
    new_tax   = float(parsed.get("revised_new_regime_tax", result.regime_comparison.new.total_tax))
    rec       = parsed.get("revised_recommended_regime", result.recommended_regime)
    extra     = float(parsed.get("additional_saving_found", 0))
    ca        = bool(parsed.get("ca_review_still_recommended", result.confidence.ca_escalation_recommended))
    return Layer2Result(
        profile_summary=profile_summary,
        questions=questions, ruled_out=[],
        total_potential_saving=sum(q.max_saving_estimate for q in questions),
        answers=answers, resolved_deductions=resolved, optimisation_suggestions=sugg,
        revised_old_regime_tax=old_tax, revised_new_regime_tax=new_tax,
        revised_recommended_regime=rec, additional_saving_found=extra,
        questions_asked=len(questions),
        questions_answered=sum(1 for a in answers if a.answered),
        deductions_confirmed=sum(1 for r in resolved if r.confirmed),
        ca_review_still_recommended=ca, llm_model_used=_MODEL)


def run_pipeline(
    user: UserInput,
    result: ITRResult,
    answers_dict: Optional[dict] = None,
    verbose: bool = False,
) -> tuple[tuple, Optional[Layer2Result]]:
    """
    One-shot pipeline: Stage 1 + Stage 2.

    answers_dict format:
        {
            "q1": {"answered": True, "answer_yes": True, "answer_amount": 48000},
            "q2": {"answered": True, "answer_yes": False},
            "q3": {"answered": False},
        }

    Returns
    -------
    ((summary, questions, ruled_out, potential), Layer2Result or None)
    """
    print("[Layer2] Stage 1 — profile analysis...")
    stage1 = get_questions(user, result, verbose=verbose)
    summary, questions, ruled_out, potential = stage1
    print(f"[Layer2] {len(questions)} questions generated. Potential saving: {_inr(potential)}")
    if answers_dict is None:
        return stage1, None
    answers = []
    for q in questions:
        d = answers_dict.get(q.question_id, {})
        answers.append(QuestionAnswer(
            question_id=q.question_id, section=q.section,
            answered=d.get("answered", False),
            answer_yes=d.get("answer_yes"), answer_amount=d.get("answer_amount"),
            answer_choice=d.get("answer_choice")))
    print("[Layer2] Stage 2 — eligibility resolution...")
    l2 = resolve(user, result, questions, answers, summary, verbose=verbose)
    print(f"[Layer2] {l2.deductions_confirmed} deductions confirmed. "
          f"Additional saving: {_inr(l2.additional_saving_found)}")
    return stage1, l2


def compute_full(
    user: UserInput,
    answers_dict: Optional[dict] = None,
    verbose: bool = False,
) -> FullITRResult:
    """
    Run BOTH layers end-to-end and return a FullITRResult.

    Parameters
    ----------
    user         : UserInput — all income, deduction, and document data.
    answers_dict : Optional answers to Layer 2 questions (see run_pipeline).
    verbose      : Print debug info.

    Returns
    -------
    FullITRResult with layer1 (always populated) and layer2 (if answers provided).

    Example
    -------
        from engine import compute_itr
        from layer2 import compute_full
        from models import UserInput, SalaryInput

        user = UserInput(age=32, salary=SalaryInput(
            gross_salary=1_500_000, basic_salary=750_000))

        # Layer 1 only:
        full = compute_full(user)

        # Both layers:
        full = compute_full(user, answers_dict={
            "q1": {"answered": True, "answer_yes": True, "answer_amount": 48000},
            "q2": {"answered": True, "answer_yes": False},
        })

        print(full.recommended_regime)
        print(full.final_tax)
        print(full.total_saving_found)
    """
    from engine import compute_itr
    l1 = compute_itr(user)
    if answers_dict is None:
        return FullITRResult(layer1=l1, layer2=None)
    _, l2 = run_pipeline(user, l1, answers_dict, verbose=verbose)
    return FullITRResult(layer1=l1, layer2=l2)
