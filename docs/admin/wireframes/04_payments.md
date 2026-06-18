# Wireframe 4 — Payments

Workstream WS-B. CEO view (refund is CEO-only). Stripe-style table with Razorpay IDs on every row.
Coupon unlocks appear as ₹0 rows with source = coupon so conversion and revenue stay consistent.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Payments                         [ Date range ▼ ]  Plan ▼  Source ▼  [Export]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Revenue (range): ₹18,420   ·   Paid orders: 38   ·   Coupon unlocks: 12       │
│  ┌────────────┬──────────┬────────┬─────────┬────────────────┬──────────────┐  │
│  │ When       │ Plan     │ Amount │ Status  │ Razorpay order │ Source       │  │
│  ├────────────┼──────────┼────────┼─────────┼────────────────┼──────────────┤  │
│  │ 06-14 11:02│ ai_smart │ ₹349   │ paid    │ order_NkP…     │ razorpay     │  │
│  │ 06-14 10:55│ ai_smart │ ₹0     │ granted │ —              │ coupon LAUN… │  │
│  │ 06-14 09:40│ diy      │ ₹499   │ paid    │ order_NkM…     │ razorpay     │  │
│  │ 06-13 18:21│ ai_smart │ ₹349   │ refunded│ order_NjX…     │ razorpay     │  │
│  └────────────┴──────────┴────────┴─────────┴────────────────┴──────────────┘  │
│                                                                                │
│  ROW DETAIL (selected)                                                         │
│  Order order_NkP…  ·  pay_NkP…  ·  session_xx91                                │
│  Timeline: created → authorized → captured → companion granted                 │
│                                            [ Refund (CEO, requires 2FA) ▸ ]    │
│                                                                                │
│  REFUND MODAL                                                                  │
│  Amount ₹349   Reason [ required …………… ]        [ Cancel ] [ Confirm refund ]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

Annotations
- Rows come from the `payments` table, populated by the payment verify hook and coupon redemptions.
- Refund is CEO-only, requires a reason, and writes an `audit_logs` row; the Razorpay refund API call is Phase 1A-optional (link out if API not wired).
- Status pill colors: paid/granted = green, refunded = amber, failed = red.
- Export CSV honors the current filters.
