"""150 combination tests for ITR-1 routing (salaried profiles)."""

from __future__ import annotations

import pytest

from orchestrator import compute_itr
from fixtures import generate_itr1_fixtures, assert_result_sanity

FIXTURES = generate_itr1_fixtures(150)


@pytest.mark.parametrize("case_idx", range(150))
def test_itr1_combination(case_idx: int):
    user = FIXTURES[case_idx]
    result = compute_itr(user)
    assert_result_sanity(result, expected_form="ITR-1")
