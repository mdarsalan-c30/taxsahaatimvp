"""150 combination tests for ITR-3 routing (business with books)."""

from __future__ import annotations

import pytest

from orchestrator import compute_itr
from fixtures import generate_itr3_fixtures, assert_result_sanity

FIXTURES = generate_itr3_fixtures(150)


@pytest.mark.parametrize("case_idx", range(150))
def test_itr3_combination(case_idx: int):
    user = FIXTURES[case_idx]
    result = compute_itr(user)
    assert_result_sanity(result, expected_form="ITR-3")
    assert result.business_income.section_used == "books"
    assert result.business_income.net_business_income >= 0
