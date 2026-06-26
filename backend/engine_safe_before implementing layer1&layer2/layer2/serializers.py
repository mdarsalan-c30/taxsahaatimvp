"""
serializers.py — JSON <-> dataclass conversion
=================================================
Converts between the dataclasses in models.py and plain dicts/JSON, so the
Python engine can be called from a Next.js backend (either as a subprocess
via service.py, or over HTTP via api.py) and respond with clean JSON.

Public API
----------
    user_input_from_dict(d)        -> UserInput
    itr_result_to_dict(r)          -> dict   (JSON-safe)
    question_to_dict(q)            -> dict
    questions_from_dict(d)         -> list[Question]   (round-trip Stage-1 output)
    question_answer_from_dict(d)   -> QuestionAnswer
    layer2_result_to_dict(r)       -> dict   (JSON-safe)
    full_result_to_dict(r)         -> dict   (JSON-safe)

All `*_to_dict` functions use dataclasses.asdict() under the hood, which
already produces JSON-safe output (floats, strings, bools, nested dicts/lists)
for every dataclass in models.py — no custom encoders needed for output.

The `*_from_dict` functions exist because dataclasses.asdict() is one-way;
reconstructing nested dataclasses from a plain dict requires explicit
field-by-field construction (this is what's implemented below).
"""

from __future__ import annotations
import dataclasses
from typing import Any

from models import (
    UserInput, SalaryInput, HousePropertyInput, OtherIncomeInput,
    CapitalGainsInput, DeductionsInput, TaxPaidInput, DocumentFlags,
    ITRResult, Layer2Result, Question, QuestionAnswer, FullITRResult,
)


# ═══════════════════════════════════════════════════════════════
#  GENERIC OUTPUT HELPER
# ═══════════════════════════════════════════════════════════════

def _to_dict(obj: Any) -> Any:
    """Recursively convert dataclasses (incl. nested lists) to plain dicts."""
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {k: _to_dict(v) for k, v in dataclasses.asdict(obj).items()}
    if isinstance(obj, list):
        return [_to_dict(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _to_dict(v) for k, v in obj.items()}
    return obj


# ═══════════════════════════════════════════════════════════════
#  INPUT: dict -> UserInput
# ═══════════════════════════════════════════════════════════════

def _build(cls, d: dict | None):
    """Construct a dataclass `cls` from dict `d`, ignoring unknown keys and
    falling back to field defaults for missing keys."""
    if d is None:
        d = {}
    valid_fields = {f.name for f in dataclasses.fields(cls)}
    kwargs = {k: v for k, v in d.items() if k in valid_fields}
    return cls(**kwargs)


def user_input_from_dict(d: dict) -> UserInput:
    """
    Build a UserInput from a plain dict (as received from a Next.js API
    route's request body). Nested objects (salary, house_property, etc.)
    are optional — omitted ones use field defaults from models.py.

    Example input shape:
        {
          "age": 32,
          "salary": {"gross_salary": 1500000, "basic_salary": 750000, ...},
          "house_property": {"property_type": "self_occupied", ...},
          "deductions": {"epf": 54000, ...},
          "taxes_paid": {"tds_salary": 120000},
          "documents": {"has_form16": true, ...}
        }
    """
    d = dict(d)  # don't mutate caller's dict
    top_level_fields = {f.name for f in dataclasses.fields(UserInput)}

    salary = _build(SalaryInput, d.get("salary"))
    house_property = _build(HousePropertyInput, d.get("house_property"))
    other_income = _build(OtherIncomeInput, d.get("other_income"))
    capital_gains = _build(CapitalGainsInput, d.get("capital_gains"))
    deductions = _build(DeductionsInput, d.get("deductions"))
    taxes_paid = _build(TaxPaidInput, d.get("taxes_paid"))
    documents = _build(DocumentFlags, d.get("documents"))

    kwargs = {k: v for k, v in d.items()
              if k in top_level_fields and k not in
              ("salary", "house_property", "other_income", "capital_gains",
               "deductions", "taxes_paid", "documents")}

    return UserInput(
        salary=salary, house_property=house_property, other_income=other_income,
        capital_gains=capital_gains, deductions=deductions, taxes_paid=taxes_paid,
        documents=documents, **kwargs,
    )


def question_answer_from_dict(d: dict) -> QuestionAnswer:
    return _build(QuestionAnswer, d)


def questions_from_dict(items: list[dict]) -> list[Question]:
    return [_build(Question, item) for item in items]


# ═══════════════════════════════════════════════════════════════
#  OUTPUT: dataclass -> dict
# ═══════════════════════════════════════════════════════════════

def itr_result_to_dict(r: ITRResult) -> dict:
    d = _to_dict(r)
    # add convenience fields (properties aren't included by dataclasses.asdict)
    d["recommended_regime"] = r.recommended_regime
    d["net_payable"] = r.net_payable
    return d


def question_to_dict(q: Question) -> dict:
    return _to_dict(q)


def layer2_result_to_dict(r: Layer2Result) -> dict:
    return _to_dict(r)


def full_result_to_dict(r: FullITRResult) -> dict:
    d = {
        "layer1": itr_result_to_dict(r.layer1),
        "layer2": layer2_result_to_dict(r.layer2) if r.layer2 else None,
        "recommended_regime": r.recommended_regime,
        "final_tax": r.final_tax,
        "total_saving_found": r.total_saving_found,
    }
    return d
