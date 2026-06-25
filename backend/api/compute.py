"""
Vercel Python serverless handler for tax compute (P0-4 / Phase 2).
POST JSON UserInput → JSON ITRResult. Used when Node cannot spawn python3.
"""
from __future__ import annotations

import json
import sys
import traceback
from dataclasses import asdict, is_dataclass
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

ENGINE_DIR = Path(__file__).resolve().parent.parent / "engine"
sys.path.insert(0, str(ENGINE_DIR))

from models import (  # noqa: E402
    BusinessInput,
    CapitalGainsInput,
    DeductionsInput,
    DocumentFlags,
    HousePropertyInput,
    OtherIncomeInput,
    ProfileFlags,
    SalaryInput,
    TaxPaidInput,
    UserInput,
)
from orchestrator import build_layer2_handoff, compute_itr  # noqa: E402


def _build(cls, data: dict | None) -> Any:
    if not data:
        if cls is SalaryInput:
            return SalaryInput(gross_salary=0.0, basic_salary=0.0)
        return cls()
    field_names = {f.name for f in cls.__dataclass_fields__.values()}  # type: ignore[attr-defined]
    return cls(**{k: v for k, v in data.items() if k in field_names})


def dict_to_user_input(data: dict) -> UserInput:
    return UserInput(
        age=int(data["age"]),
        residential_status=data.get("residential_status", "resident"),
        assessment_year=data.get("assessment_year", "2025-26"),
        mode=data.get("mode", "estimate"),
        late_filing=data.get("late_filing", False),
        salary=_build(SalaryInput, data.get("salary")),
        house_property=_build(HousePropertyInput, data.get("house_property")),
        other_income=_build(OtherIncomeInput, data.get("other_income")),
        capital_gains=_build(CapitalGainsInput, data.get("capital_gains")),
        deductions=_build(DeductionsInput, data.get("deductions")),
        taxes_paid=_build(TaxPaidInput, data.get("taxes_paid")),
        business=_build(BusinessInput, data.get("business")),
        profile_flags=_build(ProfileFlags, data.get("profile_flags")),
        documents=_build(DocumentFlags, data.get("documents")),
    )


def serialize(obj: Any) -> Any:
    if is_dataclass(obj) and not isinstance(obj, type):
        return {k: serialize(v) for k, v in asdict(obj).items()}
    if isinstance(obj, list):
        return [serialize(i) for i in obj]
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    return obj


def run_compute(payload: dict) -> tuple[int, dict]:
    try:
        user = dict_to_user_input(payload)
        result = compute_itr(user)
        return 200, {
            "ok": True,
            "result": serialize(result),
            "handoff": build_layer2_handoff(result, user),
        }
    except Exception as exc:
        return 422, {
            "ok": False,
            "error": str(exc),
            "trace": traceback.format_exc(),
        }


class handler(BaseHTTPRequestHandler):  # noqa: N801 — Vercel Python convention
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send(400, {"ok": False, "error": "Invalid JSON"})
            return

        if not isinstance(payload, dict) or "age" not in payload:
            self._send(400, {"ok": False, "error": "age is required (number)"})
            return

        status, data = run_compute(payload)
        self._send(status, data)

    def _send(self, status: int, data: dict) -> None:
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
