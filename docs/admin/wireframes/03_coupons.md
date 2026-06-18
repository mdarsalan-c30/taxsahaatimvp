# Wireframe 3 — Coupons

Workstream WS-B. Primary user Ayush. Lets ops grant free or discounted companion access without
a code deploy. A valid coupon at checkout skips Razorpay and grants a companion session.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Coupons                                   [ Search code ]   [ + New coupon ]   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filter:  ( Active )  Expired   Exhausted   All        Lane: B2C | B2B | both  │
│  ┌────────────┬──────────┬───────┬─────────┬───────────┬────────┬───────────┐ │
│  │ Code       │ Plan     │ Lane  │ Used    │ Max       │ Expires│ Actions   │ │
│  ├────────────┼──────────┼───────┼─────────┼───────────┼────────┼───────────┤ │
│  │ LAUNCH50   │ ai_smart │ b2c   │ 12      │ 100       │ 30 Jun │ Revoke ▸  │ │
│  │ INFLU-RHEA │ any      │ b2c   │ 3       │ 25        │ 15 Jul │ Revoke ▸  │ │
│  │ CA-BETA    │ any      │ b2b   │ 0       │ 50        │ 31 Aug │ Revoke ▸  │ │
│  └────────────┴──────────┴───────┴─────────┴───────────┴────────┴───────────┘ │
│                                                                  [ Export CSV ]│
│                                                                                │
│  NEW COUPON (slide-over)                                                       │
│  Code        [ LAUNCH50            ]   (auto-uppercase, unique)                │
│  Plan scope  ( any ▼ )                 Lane ( b2c ▼ )                          │
│  Max uses    [ 100 ]                   Expiry [ 30 days ▼ ] (default)          │
│  Discount    ( Full unlock ▼ )  or  [ ₹___ off ]                              │
│                                            [ Cancel ]   [ Create coupon ]      │
│                                                                                │
│  REDEMPTIONS (drill-down for selected coupon)                                  │
│  session_xx91  2026-06-14 11:02  ip_hash 4f… (companion granted)               │
│  session_ab34  2026-06-14 09:40  ip_hash 8c…                                   │
│  ⚠ fraud flag: 6 redemptions from ip_hash 4f… in 1h                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

Annotations
- Create writes `coupons` + an `audit_logs` row (creator captured).
- Redemption at checkout writes `coupon_redemptions` (session_id, ip_hash, ts) and a `companion_grants` row with source = coupon; Razorpay is skipped.
- Fraud heuristic: flag when one ip_hash exceeds N redemptions in a window.
- Revoke is one click and immediate; it cannot be undone (new coupon required).
