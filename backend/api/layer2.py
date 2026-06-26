"""
Vercel Python serverless handler for Layer 2 AI CA Brain.
POST JSON layer2_handoff → Markdown string of AI advice.
"""
from __future__ import annotations

import json
import sys
import traceback
from http.server import BaseHTTPRequestHandler
from pathlib import Path

ENGINE_DIR = Path(__file__).resolve().parent.parent / "engine"
sys.path.insert(0, str(ENGINE_DIR))

from layer2_ai import analyze_tax_with_ai  # noqa: E402


class handler(BaseHTTPRequestHandler):  # noqa: N801 — Vercel Python convention
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send(400, {"ok": False, "error": "Invalid JSON"})
            return

        if not isinstance(payload, dict) or "assessment_year" not in payload:
            self._send(400, {"ok": False, "error": "Missing valid layer2_handoff payload"})
            return

        try:
            advice = analyze_tax_with_ai(payload)
            self._send(200, {"ok": True, "advice": advice})
        except Exception as exc:
            self._send(500, {
                "ok": False,
                "error": str(exc),
                "trace": traceback.format_exc(),
            })

    def _send(self, status: int, data: dict) -> None:
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
