"""
capital_gains.py
================
Capital gains set-off and net taxable gain computation.

Set-off hierarchy (Sec 70–74)
------------------------------
1. STCG loss can be set off against any STCG or LTCG.
2. LTCG loss can be set off against LTCG only.
3. Unabsorbed losses carry forward for 8 assessment years.

For the salaried engine we apply the set-off within the same year.
Brought-forward losses are tracked separately and applied before current-year computation.

Special rate items
------------------
- STCG 111A (equity/eq-MF, listed): 20% flat  (post Jul-2024)
- LTCG 112A (equity/eq-MF, listed): 12.5% flat on gains > ₹1,25,000 (post Jul-2024)
- LTCG other (debt, property etc.): 20% with indexation → engine takes pre-computed gain
- STCG other (debt MF etc.): slab rate → flows into normal taxable income
"""

from __future__ import annotations
from models import CapitalGainsInput

LTCG_112A_EXEMPTION = 125_000   # ₹1.25 lakh post Jul-2024


def compute_capital_gains(cg: CapitalGainsInput) -> dict:
    """
    Apply set-off rules and return net taxable amounts for each bucket.
    """
    stcg_111a = max(0.0, cg.stcg_111a)
    ltcg_112a = max(0.0, cg.ltcg_112a)
    stcg_other = max(0.0, cg.stcg_other)    # slab rate
    ltcg_other = max(0.0, cg.ltcg_other)    # 20% flat
    stcl = max(0.0, cg.stcl_equity)         # loss (positive number)
    ltcl = max(0.0, cg.ltcl)               # loss (positive number)

    # ── Step 1: Set off STCL against STCG ──
    # Priority: 111A first, then other STCG
    stcl_remaining = stcl
    stcg_111a_net = max(0.0, stcg_111a - stcl_remaining)
    stcl_remaining = max(0.0, stcl_remaining - stcg_111a)

    stcg_other_net = max(0.0, stcg_other - stcl_remaining)
    stcl_remaining = max(0.0, stcl_remaining - stcg_other)

    # ── Step 2: Residual STCL set off against LTCG ──
    ltcg_112a_net = max(0.0, ltcg_112a - stcl_remaining)
    stcl_remaining = max(0.0, stcl_remaining - ltcg_112a)

    ltcg_other_net = max(0.0, ltcg_other - stcl_remaining)
    stcl_remaining = max(0.0, stcl_remaining - ltcg_other)

    # ── Step 3: Set off LTCL against LTCG only ──
    ltcl_remaining = ltcl
    ltcg_112a_absorb = min(ltcl_remaining, ltcg_112a_net)
    ltcg_112a_net = max(0.0, ltcg_112a_net - ltcg_112a_absorb)
    ltcl_remaining = max(0.0, ltcl_remaining - ltcg_112a_absorb)

    ltcg_other_absorb = min(ltcl_remaining, ltcg_other_net)
    ltcg_other_net = max(0.0, ltcg_other_net - ltcg_other_absorb)
    ltcl_remaining = max(0.0, ltcl_remaining - ltcg_other_absorb)

    # ── Step 4: Apply LTCG 112A basic exemption ──
    ltcg_112a_taxable = max(0.0, ltcg_112a_net - LTCG_112A_EXEMPTION)

    carry_forward_stcl = round(stcl_remaining, 2)
    carry_forward_ltcl = round(ltcl_remaining, 2)

    return {
        "stcg_111a_net": round(stcg_111a_net, 2),           # taxed at 20%
        "ltcg_112a_net": round(ltcg_112a_net, 2),           # gross (before exemption)
        "ltcg_112a_taxable": round(ltcg_112a_taxable, 2),   # after exemption → taxed at 12.5%
        "ltcg_other_net": round(ltcg_other_net, 2),         # taxed at 20%
        "stcg_other_slab": round(stcg_other_net, 2),        # added to normal taxable income
        "carry_forward_stcl": carry_forward_stcl,
        "carry_forward_ltcl": carry_forward_ltcl,
        "ltcg_112a_exemption_used": round(min(ltcg_112a_net, LTCG_112A_EXEMPTION), 2),
    }
