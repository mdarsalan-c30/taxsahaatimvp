"""150 combination tests for ITR-4 routing (presumptive business/profession)."""

from __future__ import annotations

import pytest

from orchestrator import compute_itr
from fixtures import generate_itr4_fixtures, assert_result_sanity

FIXTURES = generate_itr4_fixtures(150)


@pytest.mark.parametrize("case_idx", range(150))
def test_itr4_combination(case_idx: int):
    user = FIXTURES[case_idx]
    result = compute_itr(user)
    assert_result_sanity(result, expected_form="ITR-4")
    assert result.business_income.section_used in ("44AD", "44ADA", "")
