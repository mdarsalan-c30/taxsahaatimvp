"""
api.py — Python Tax Engine entry point (persistent HTTP API mode)
=====================================================================
Alternative to service.py for the "Python Tax Engine" box in the
architecture diagram. Use this if you'd rather run the engine as a
long-lived process (avoids per-request Python startup cost) that the
Next.js API backend calls over HTTP instead of spawning a subprocess.

Run:
    pip install fastapi uvicorn --break-system-packages
    uvicorn api:app --host 0.0.0.0 --port 8000

From Next.js:
    const res = await fetch('http://localhost:8000/layer1', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(userInputJson),
    });
    const result = await res.json();   // ITRResult JSON

Endpoints
---------
    GET  /health
    POST /layer1            body: UserInput JSON          -> ITRResult JSON
    POST /layer2/questions  body: {"user": ...}            -> Stage-1 output
    POST /layer2/resolve    body: {"user", "questions",
                                    "answers", "profile_summary"} -> Layer2Result JSON
    POST /full               body: {"user", "answers_dict"} -> FullITRResult JSON

All four POST handlers reuse the exact same engine/layer2/serializers
functions as service.py — this file is purely a transport-layer wrapper.
On ValueError (out-of-scope input) returns HTTP 422 with the message.
"""

from __future__ import annotations
from typing import Any

try:
    from fastapi import FastAPI, HTTPException
except ImportError as e:
    raise ImportError(
        "api.py requires fastapi + pydantic + uvicorn.\n"
        "Install with: pip install fastapi uvicorn --break-system-packages\n"
        "(Not needed if you're using service.py / CLI mode instead.)"
    ) from e

from engine import compute_itr
from layer2 import get_questions, resolve, compute_full
from serializers import (
    user_input_from_dict, itr_result_to_dict,
    questions_from_dict, question_answer_from_dict, question_to_dict,
    layer2_result_to_dict, full_result_to_dict,
)

app = FastAPI(title="ITR Tax Engine", version="3.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "itr-tax-engine", "version": "3.0",
            "rules": "FY2025-26 / AY2026-27"}


@app.post("/layer1")
def layer1(body: dict):
    try:
        user = user_input_from_dict(body)
        result = compute_itr(user)
        return itr_result_to_dict(result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/layer2/questions")
def layer2_questions(body: dict):
    try:
        user = user_input_from_dict(body["user"])
        result = compute_itr(user)
        summary, questions, ruled_out, potential = get_questions(user, result)
        return {
            "profile_summary": summary,
            "questions": [question_to_dict(q) for q in questions],
            "ruled_out": ruled_out,
            "total_potential_saving": potential,
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/layer2/resolve")
def layer2_resolve(body: dict):
    try:
        user = user_input_from_dict(body["user"])
        result = compute_itr(user)
        questions = questions_from_dict(body.get("questions", []))
        answers = [question_answer_from_dict(a) for a in body.get("answers", [])]
        profile_summary = body.get("profile_summary", "")
        l2 = resolve(user, result, questions, answers, profile_summary=profile_summary)
        return layer2_result_to_dict(l2)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/full")
def full(body: dict):
    try:
        user = user_input_from_dict(body["user"])
        answers_dict = body.get("answers_dict")
        result = compute_full(user, answers_dict=answers_dict)
        return full_result_to_dict(result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
