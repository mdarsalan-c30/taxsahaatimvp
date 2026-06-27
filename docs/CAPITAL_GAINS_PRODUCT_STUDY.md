# Capital Gains Product Study

## Overview
Capital Gains (Schedule CG) is highly complex and requires careful planning before implementation. This document outlines the roadmap for handling various asset classes.

## Asset Classes

### 1. Equity Shares & Listed Securities
- **User Situation:** Sold stocks on NSE/BSE.
- **Documents Required:** P&L Statement from Broker (Zerodha, Groww, Upstox), AIS.
- **Tax Treatment:** 
  - STCG (Sec 111A): 20% tax on gains (recent budget change).
  - LTCG (Sec 112A): 12.5% tax on gains exceeding ₹1.25 Lakh.
- **ITR Form Impact:** Moves user from ITR-1 to ITR-2.
- **Engine Logic:** Needs FIFO calculation (First-In, First-Out), Grandfathering clause (31 Jan 2018).
- **Risk Warning:** Mismatch with AIS can trigger a notice.
- **MVP or Later:** Later (Phase 5).

### 2. Mutual Funds (Equity vs Debt)
- **User Situation:** Redeemed mutual fund units.
- **Documents Required:** CAMS/KFintech Consolidated Account Statement (CAS).
- **Tax Treatment:**
  - Equity MFs: Same as Listed Securities.
  - Debt MFs: Taxed at slab rates (no indexation benefit post 2023).
- **MVP or Later:** Later (Phase 5).

### 3. Property Sale
- **User Situation:** Sold a house, land, or commercial property.
- **Documents Required:** Sale Deed, Purchase Deed, Stamp Duty Value, Improvement bills.
- **Tax Treatment:** LTCG taxed at 12.5% (without indexation) or 20% (with indexation for old properties). Exemptions under Sec 54, 54EC, 54F available.
- **Risk Warning:** Highly scrutinized by IT department. Stamp duty value vs Sale consideration mismatch triggers Sec 50C.
- **MVP or Later:** Post-MVP.

### 4. Crypto / Virtual Digital Assets (VDA)
- **Tax Treatment:** Flat 30% tax + Cess. No deduction allowed except cost of acquisition. Cannot be set off against other income.

## Carry Forward of Losses
- STCL can be set off against STCG and LTCG.
- LTCL can ONLY be set off against LTCG.
- Unabsorbed losses can be carried forward for 8 years (requires filing before the due date).
