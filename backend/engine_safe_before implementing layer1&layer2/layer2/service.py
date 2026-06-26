"""
service.py — Python Tax Engine entry point (CLI mode)
========================================================
This is the "Python Tax Engine" box in the architecture diagram. The Next.js
API backend invokes it as a LOCAL SCRIPT via subprocess, passing JSON on
stdin and reading JSON from stdout. (For an HTTP-API deployment instead of
per-request subprocess spawning, see api.py — same logic, FastAPI wrapper.)

Usage (from Next.js, via child_process)
----------------------------------------
    const { spawn } = require('child_process');
    const proc = spawn('python3', ['service.py', 'layer1']);
    proc.stdin.write(JSON.stringify(userInputJson));
    proc.stdin.end();
    let output = '';
    proc.stdout.on('data', (chunk) => output += chunk);
    proc.on('close', () => {
        const result = JSON.parse(output);   // ITRResult JSON
        // ... save result.income_heads / regime_comparison etc. to Postgres
    });

Commands
--------
    python3 service.py layer1
        stdin  : UserInput JSON
        stdout : {"ok": true, "result": <ITRResult JSON>}
                 or {"ok": false, "error": "..."}

    python3 service.py layer2-questions
        stdin  : {"user": <UserInput JSON>, "layer1_result": <ITRResult JSON>}
        Note: layer1_result is informational only — it is NOT re-validated;
        the engine recomputes Layer 1 internally from `user` to ensure the
        questions are based on consistent figures.
        stdout : {"ok": true, "profile_summary": "...", "questions": [...],
                   "ruled_out": [...], "total_potential_saving": ...}

    python3 service.py layer2-resolve
        stdin  : {"user": <UserInput JSON>, "questions": [...],
                   "answers": [<QuestionAnswer JSON>, ...],
                   "profile_summary": "..."}
        stdout : {"ok": true, "result": <Layer2Result JSON>}

    python3 service.py full
        stdin  : {"user": <UserInput JSON>,
                   "answers_dict": {"q1": {"answered": true, ...}, ...} | null}
        stdout : {"ok": true, "result": <FullITRResult JSON>}

Every command prints a SINGLE line of JSON to stdout and exits 0 on success.
On error, prints {"ok": false, "error": "..."} to stdout and exits 1 — the
Next.js side should always check the "ok" field rather than relying solely
on the exit code (some platforms swallow non-zero exits from spawned
processes inconsistently).

Zero new Python dependencies beyond what layer2.py already needs
(pip install anthropic).
"""

from __future__ import annotations
import sys
import json

from engine import compute_itr
from layer2 import get_questions, resolve, compute_full
from models import ITRResult
from serializers import (
    user_input_from_dict, itr_result_to_dict,
    questions_from_dict, question_answer_from_dict, question_to_dict,
    layer2_result_to_dict, full_result_to_dict,
)


def _read_stdin_json() -> dict:
    raw = sys.stdin.read()
    return json.loads(raw) if raw.strip() else {}


def _emit_ok(**kwargs):
    print(json.dumps({"ok": True, **kwargs}, ensure_ascii=False))


def _emit_error(msg: str):
    print(json.dumps({"ok": False, "error": msg}, ensure_ascii=False))


def cmd_layer1():
    payload = _read_stdin_json()
    user = user_input_from_dict(payload)
    result = compute_itr(user)
    _emit_ok(result=itr_result_to_dict(result))


def cmd_layer2_questions():
    payload = _read_stdin_json()
    user = user_input_from_dict(payload["user"])
    # Recompute Layer 1 internally for consistency
    result: ITRResult = compute_itr(user)
    summary, questions, ruled_out, potential = get_questions(user, result)
    _emit_ok(
        profile_summary=summary,
        questions=[question_to_dict(q) for q in questions],
        ruled_out=ruled_out,
        total_potential_saving=potential,
    )


def cmd_layer2_resolve():
    payload = _read_stdin_json()
    user = user_input_from_dict(payload["user"])
    result: ITRResult = compute_itr(user)
    questions = questions_from_dict(payload.get("questions", []))
    answers = [question_answer_from_dict(a) for a in payload.get("answers", [])]
    profile_summary = payload.get("profile_summary", "")
    l2 = resolve(user, result, questions, answers, profile_summary=profile_summary)
    _emit_ok(result=layer2_result_to_dict(l2))


def cmd_full():
    payload = _read_stdin_json()
    user = user_input_from_dict(payload["user"])
    answers_dict = payload.get("answers_dict")
    full = compute_full(user, answers_dict=answers_dict)
    _emit_ok(result=full_result_to_dict(full))


COMMANDS = {
    "layer1": cmd_layer1,
    "layer2-questions": cmd_layer2_questions,
    "layer2-resolve": cmd_layer2_resolve,
    "full": cmd_full,
}


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        _emit_error(f"Usage: python3 service.py <{'|'.join(COMMANDS)}>  (JSON on stdin)")
        sys.exit(1)
    try:
        COMMANDS[sys.argv[1]]()
    except ValueError as e:
        # out-of-scope inputs (NRI, minor) -> clean error, not a stack trace
        _emit_error(str(e))
        sys.exit(1)
    except Exception as e:
        _emit_error(f"{type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
