# Benchmark 1 — Fintech ops dashboards

**Scope:** Stripe Dashboard, Razorpay Dashboard, ClearTax / Quicko public UX.
**Question answered:** What to copy, what to avoid, and the TaxSaathi-specific constraint.

---

## Stripe Dashboard

**What to copy**
- Single payments table as the spine: each row is amount, status, customer, date, with a colored status pill. Click expands a full timeline (created → authorized → captured → refunded).
- Refunds are a guarded modal with a required reason, never an inline button.
- Revenue is shown as a line over time with a clear comparison to the prior period.
- "Test mode" is unmistakable (banner + color), so no one confuses sandbox with live money.

**What to avoid**
- Stripe's settings surface is enormous; do not replicate dozens of nested config pages. Keep settings to team, roles, and integration keys.

**TaxSaathi constraint**
- We do not hold a wallet of customer funds; payments are one-shot plan unlocks. So the timeline is short (order → paid → companion granted). Mirror Stripe's status pill and reason-gated refund, but skip subscriptions/invoices in Phase 1.

---

## Razorpay Dashboard

**What to copy**
- Order lifecycle is the mental model our payments already use (`order_*` → `pay_*`). Surface `razorpay_order_id` and `razorpay_payment_id` on every row so support can cross-reference Razorpay directly.
- Settlement and payout views separate "captured" from "settled to bank" — useful later for reconciliation.

**What to avoid**
- Razorpay's UI mixes many products (Payments, Route, Smart Collect). We only need Payments. Do not import that breadth.

**TaxSaathi constraint**
- Coupons can grant access with no Razorpay order at all. Our payments list must treat "coupon unlock" as a first-class row type (amount ₹0, source = coupon) so revenue math stays correct and conversions are not undercounted.

---

## ClearTax / Quicko (consumer tax)

**What to copy (for trust + pricing copy, not admin layout)**
- Clear plan tiering with a single recommended plan highlighted.
- Pricing pages that state exactly what each tier unlocks.

**What to avoid**
- They imply end-to-end e-filing. Our admin copy and any CMS-editable marketing text must never imply auto-file. This is a compliance gate, not a style preference.

**TaxSaathi constraint**
- The pricing admin must let the CEO change a price and a launch-offer end date and preview both the marketing card and the checkout amount, because those two surfaces must never drift (the Razorpay order amount is derived from the same source).

---

## Net takeaways for our build

1. Payments screen = Stripe-style table + reason-gated refund + Razorpay IDs on every row.
2. Treat coupon unlocks as ₹0 payment rows so conversion and revenue stay consistent.
3. Pricing admin previews both marketing and checkout from one source of truth.
4. Never ship admin copy that implies we file for the user.
