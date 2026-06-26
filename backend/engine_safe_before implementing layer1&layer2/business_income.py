"""
business_income.py
==================
Computes business/profession income for ITR-3 (regular books) and ITR-4 (presumptive).

Sections implemented
--------------------
44AD  : Presumptive income for small business — 8% of turnover (6% if digital receipts)
        Turnover threshold: ₹2 crore. Cash receipts > 5% of turnover → not eligible.
44ADA : Presumptive income for specified profession — 50% of gross receipts
        Receipt threshold: ₹50 lakh. Cash receipts > 5% → not eligible.
Books : ITR-3 — actual profit = gross receipts − expenses (caller supplies values).
"""

from __future__ import annotations

from models import BusinessInput

TURNOVER_LIMIT_44AD = 2_00_00_000
RECEIPTS_LIMIT_44ADA = 50_00_000
RATE_44AD_DEFAULT = 0.08
RATE_44AD_DIGITAL = 0.06
RATE_44ADA = 0.50
CASH_RECEIPT_DISQUALIFY_PCT = 0.05


def _cash_disqualifies(biz: BusinessInput) -> bool:
    return biz.cash_receipts_pct > CASH_RECEIPT_DISQUALIFY_PCT


def compute_business_income(biz: BusinessInput) -> dict:
    """
    Returns dict matching BusinessIncomeResult fields.
    """
    if biz.business_type == "none":
        return {
            "presumptive_44ad": 0.0,
            "presumptive_44ada": 0.0,
            "books_profit": 0.0,
            "net_business_income": 0.0,
            "section_used": "",
            "presumptive_eligible": False,
        }

    if biz.business_type == "regular_books":
        profit = max(0.0, biz.actual_gross_receipts - biz.actual_expenses)
        return {
            "presumptive_44ad": 0.0,
            "presumptive_44ada": 0.0,
            "books_profit": round(profit, 2),
            "net_business_income": round(profit, 2),
            "section_used": "books",
            "presumptive_eligible": False,
        }

    if biz.business_type == "presumptive_business":
        eligible = biz.turnover <= TURNOVER_LIMIT_44AD and not _cash_disqualifies(biz)
        if not eligible:
            return {
                "presumptive_44ad": 0.0,
                "presumptive_44ada": 0.0,
                "books_profit": 0.0,
                "net_business_income": 0.0,
                "section_used": "",
                "presumptive_eligible": False,
            }
        digital_pct = min(1.0, max(0.0, biz.digital_turnover_pct))
        digital_part = biz.turnover * digital_pct * RATE_44AD_DIGITAL
        non_digital_part = biz.turnover * (1 - digital_pct) * RATE_44AD_DEFAULT
        income = round(digital_part + non_digital_part, 2)
        return {
            "presumptive_44ad": income,
            "presumptive_44ada": 0.0,
            "books_profit": 0.0,
            "net_business_income": income,
            "section_used": "44AD",
            "presumptive_eligible": True,
        }

    if biz.business_type == "presumptive_profession":
        receipts = biz.gross_professional_receipts
        eligible = receipts <= RECEIPTS_LIMIT_44ADA and not _cash_disqualifies(biz)
        if not eligible:
            return {
                "presumptive_44ad": 0.0,
                "presumptive_44ada": 0.0,
                "books_profit": 0.0,
                "net_business_income": 0.0,
                "section_used": "",
                "presumptive_eligible": False,
            }
        income = round(receipts * RATE_44ADA, 2)
        return {
            "presumptive_44ad": 0.0,
            "presumptive_44ada": income,
            "books_profit": 0.0,
            "net_business_income": income,
            "section_used": "44ADA",
            "presumptive_eligible": True,
        }

    return {
        "presumptive_44ad": 0.0,
        "presumptive_44ada": 0.0,
        "books_profit": 0.0,
        "net_business_income": 0.0,
        "section_used": "",
        "presumptive_eligible": False,
    }
