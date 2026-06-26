"""Pytest path setup for engine tests."""

import sys
from pathlib import Path

ENGINE_DIR = Path(__file__).resolve().parent.parent
TESTS_DIR = Path(__file__).resolve().parent
for p in (str(ENGINE_DIR), str(TESTS_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)
