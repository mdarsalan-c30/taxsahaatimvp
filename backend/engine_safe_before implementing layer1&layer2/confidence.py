"""
confidence.py
=============
Scores the completeness of the return and decides whether CA escalation
is recommended.

Scoring
-------
Each document contributes a weight to the completeness score.
Mode = exact → documents are required for filing-ready status.
Mode = estimate → always not filing-ready regardless of docs.
"""

from __future__ import annotations
from models import UserInput, ConfidenceResult

_DOC_WEIGHTS = {
    "has_form16": 35,           # primary salary document — highest weight
    "has_ais": 20,
    "has_form26as": 20,
    "has_bank_interest_cert": 10,
    "has_home_loan_cert": 10,   # only relevant if home loan present
    "has_capital_gains_statement": 5,  # only relevant if CG present
}

# Which docs are always required vs conditional
_ALWAYS_REQUIRED = {"has_form16", "has_ais", "has_form26as"}

_CA_TRIGGERS = {
    "income_above_50l": "Total income above ₹50 lakh (surcharge applicable)",
    "multiple_employers": "Multiple Form 16s require reconciliation",
    "capital_gains_complex": "Capital gains with losses or carry-forward",
    "large_cg": "Capital gains above ₹10 lakh",
    "home_loan_interest_cap_breach": "Home loan interest exceeds SOP cap",
    "high_savings_interest": "High interest income (possible missed TDS)",
}


def compute_confidence(user: UserInput, profile, gti: float) -> ConfidenceResult:
    docs = user.document_flags_dict()  # we'll compute this inline
    missing: list[str] = []
    ca_reasons: list[str] = []

    # ── Document completeness ──
    has_cg = any([
        user.capital_gains.stcg_111a, user.capital_gains.ltcg_112a,
        user.capital_gains.stcg_other, user.capital_gains.ltcg_other,
    ])
    has_home_loan = user.house_property.home_loan_interest > 0

    # Determine relevant docs
    relevant_docs = set(_ALWAYS_REQUIRED)
    if user.other_income.fd_interest > 0 or user.other_income.savings_account_interest > 0:
        relevant_docs.add("has_bank_interest_cert")
    if has_home_loan:
        relevant_docs.add("has_home_loan_cert")
    if has_cg:
        relevant_docs.add("has_capital_gains_statement")

    # Score
    total_weight = sum(_DOC_WEIGHTS[d] for d in relevant_docs)
    earned_weight = 0

    doc_flags = user.documents
    flag_map = {
        "has_form16": doc_flags.has_form16,
        "has_ais": doc_flags.has_ais,
        "has_form26as": doc_flags.has_form26as,
        "has_bank_interest_cert": doc_flags.has_bank_interest_cert,
        "has_home_loan_cert": doc_flags.has_home_loan_cert,
        "has_capital_gains_statement": doc_flags.has_capital_gains_statement,
    }

    for doc in relevant_docs:
        if flag_map.get(doc, False):
            earned_weight += _DOC_WEIGHTS[doc]
        else:
            missing.append(_doc_display_name(doc))

    completeness = round(earned_weight / total_weight * 100, 1) if total_weight > 0 else 100.0

    # Filing-ready: exact mode + all required docs present + no missing always-required docs
    always_missing = [d for d in _ALWAYS_REQUIRED if not flag_map.get(d, False)]
    filing_ready = (
        user.mode == "exact"
        and len(always_missing) == 0
        and len(missing) == 0
    )

    # ── CA escalation ──
    if gti > 50_00_000:
        ca_reasons.append(_CA_TRIGGERS["income_above_50l"])
    if user.salary.multiple_employers:
        ca_reasons.append(_CA_TRIGGERS["multiple_employers"])
    if (user.capital_gains.stcl_equity > 0 or user.capital_gains.ltcl > 0):
        ca_reasons.append(_CA_TRIGGERS["capital_gains_complex"])
    if (user.capital_gains.ltcg_112a + user.capital_gains.ltcg_other) > 10_00_000:
        ca_reasons.append(_CA_TRIGGERS["large_cg"])
    if user.house_property.home_loan_interest > 200_000:
        ca_reasons.append(_CA_TRIGGERS["home_loan_interest_cap_breach"])
    if profile.expert_required or profile.itr_form == "ITR-3":
        ca_reasons.append("ITR-3 business return — books and audit may apply")

    return ConfidenceResult(
        completeness_score=completeness,
        filing_ready=filing_ready,
        missing_documents=missing,
        ca_escalation_recommended=len(ca_reasons) > 0,
        ca_escalation_reasons=ca_reasons,
        is_estimate_mode=user.mode == "estimate",
    )


def _doc_display_name(key: str) -> str:
    names = {
        "has_form16": "Form 16 (Part A + B)",
        "has_ais": "Annual Information Statement (AIS)",
        "has_form26as": "Form 26AS",
        "has_bank_interest_cert": "Bank interest certificate",
        "has_home_loan_cert": "Home loan interest certificate",
        "has_capital_gains_statement": "Capital gains / broker statement",
    }
    return names.get(key, key)
