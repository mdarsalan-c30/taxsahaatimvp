# Admin Design Guidelines

**Product:** LastMinute ITR / TaxSaathi Admin
**Version:** 1.0 · June 2026
**Status:** Stage 0 deliverable (Research → Design → Build → Deploy program)
**Companion docs:** [`ADMIN_PORTAL_MASTER_PLAN.md`](ADMIN_PORTAL_MASTER_PLAN.md) (functional spec), [`benchmarks/`](benchmarks/) (industry references)

---

## 1. Purpose

This document is the single reference a designer or engineer follows when building any admin
screen. It converts the functional spec in the master plan into concrete, MECE design rules tied
to business outcomes. If a screen violates a rule here, the rule wins unless the CEO overrides it.

The north star is the **Ayush test**: the ops hire opens the laptop on Monday morning and, in
under 60 seconds and without asking engineering, can answer:

1. How much traffic and how many filing starts did we get?
2. How many paid (Razorpay + coupon)? What revenue?
3. What are the top three things I must act on today?

---

## 2. MECE workstreams

The admin surface is divided into five mutually exclusive, collectively exhaustive workstreams.
Every screen belongs to exactly one.

| WS | Scope | Screens |
|----|-------|---------|
| **WS-A — Command center** | At-a-glance health and the action queue | Home |
| **WS-B — Revenue ops** | Money in and money out | Pricing, Coupons, Payments |
| **WS-C — Growth & CRM** | Who is in the funnel and what to do about them | CRM pipeline, Contact detail, Analytics |
| **WS-D — Trust & compliance** | Legal, privacy, data lifecycle | Compliance (DPDP + retention), Sessions, Audit log |
| **WS-E — Platform CMS** | Editable product content | Content, Companion CMS |

B2B (CA partners) is a lane that overlays WS-B, WS-C, and WS-D; it is not a sixth workstream.

---

## 3. Design principles (non-negotiable)

1. **Ayush test first.** The Home screen must pass the 60-second test on a laptop screen with no scrolling for the KPI row and inbox.
2. **Action over analytics.** Every number that can be acted on links to a filtered list or an inbox item. A chart with no drill-down is a poster, not a tool.
3. **Flat information architecture.** Maximum 12 sidebar items, maximum two levels deep. No mega-menus.
4. **Privacy by default.** Lists show pseudonymous identifiers (`session_id`, masked email). PAN is never shown beyond last-4, and last-4 only appears in a detail view gated by role. See WS-D.
5. **Audit everything sensitive.** Coupon create/revoke, refund, price publish, CA verify, and data deletion always write an `audit_logs` row with before/after. No silent privileged mutations.
6. **CRM is pipeline + inbox, not Salesforce.** Optimize for tax-season velocity: see the stage, see the next action, act. No campaign builder, no custom-object designer.
7. **Honesty in copy.** Admin tooling must never enable a feature that contradicts "we guide, you file." No admin action may submit a return to the Income Tax Department.
8. **Graceful when unconfigured.** If PostHog, Razorpay, or the database is not set up, the screen degrades to a clear setup banner — it never crashes or shows fake data.

---

## 4. KPI catalog

Home KPI cards map directly to the McKinsey charter metrics (M1–M6) and to instrumentation that
already exists in [`frontend/lib/analytics/events.ts`](../../frontend/lib/analytics/events.ts).

| Home card | Charter metric | Definition | Primary source |
|-----------|----------------|------------|----------------|
| Traffic | — | Sessions, Form 16 CTA clicks | PostHog / Vercel Analytics |
| Starts | M5 (funnel) | Distinct sessions with `import_started` | `session_events` |
| Paid conversions | M1 (time-to-file proxy) | `payment_success` + coupon redemptions | `payments`, `coupon_redemptions` |
| Revenue | business | ₹ B2C (Razorpay) + ₹ B2B (wallet debits) | `payments`, `tenant_filings` |
| Companion completion | M3 | `companion_wizard_completed` ÷ `companion_footprint_step_viewed` | `session_events` (PostHog) |
| Active issues | ops | Parse failures (24h) + open support tickets | `documents`, `support_tickets` |

**Field-error rate (M2)** is a secondary metric shown on the Analytics screen, not Home:

```
field_error_rate =
  distinct users with >=1 companion_field_confusion
  / distinct users with >=1 companion_footprint_step_viewed
```

Every KPI card supports a Today / 7-day toggle and links to the relevant list when clicked.

---

## 5. CRM pipeline stages (canonical)

These stage definitions are the contract between the analytics events and the CRM board. The
admin CRM derives a contact's stage from the latest qualifying event; ops can add notes and tasks
but cannot manually move a contact backwards past an automatic transition.

### 5.1 B2C pipeline (session-centric)

| Stage | Enter condition (event) | Ops action |
|-------|-------------------------|------------|
| Lead | `landing_cta_click` | None (passive) |
| Started | `import_started` | None |
| Active | any wizard step after import | Watch for stalls |
| Checkout | `paywall_view` | Offer coupon if stalled |
| Won | `payment_success` or coupon redemption | Confirm companion unlocked |
| Companion | `companion_wizard_completed` | Request review/feedback |
| Support | support ticket opened | Resolve and close |

### 5.2 B2B pipeline (partner-centric, Phase 2)

| Stage | Enter condition | Ops action |
|-------|-----------------|------------|
| Prospect | application submitted | Acknowledge |
| Review | documents submitted | Run verification checklist |
| Verified | ICAI membership confirmed | Enable B2B access |
| Onboarded | first client added | Help with first filing |
| Active | >=1 filing in 30 days | Upsell volume tier |
| Churn | inactive 60 days | Re-engage |

---

## 6. Roles and permissions (summary)

Full matrix is in master plan §10. Design rule: the UI hides actions a role cannot perform and
the server independently rejects them (`requireRole`). Never rely on hidden buttons alone.

| Role | Can do |
|------|--------|
| CEO (`ceo`) | Everything |
| Ops (`ops`) | Dashboard, coupons, CRM, CA verify, data deletion; **cannot** refund or change pricing |
| Engineering (`engineering`) | Dashboard, engine audit, companion CMS; no money actions |
| Content (`content`) | Content CMS only |
| CA Firm Admin (`ca_admin`) | Own firm only (Phase 2) |

Sensitive actions (refund, pricing publish, firm suspend) require a re-authentication / 2FA step.

---

## 7. Visual system

- **Shell:** neutral slate sidebar, white content area (Stripe / Linear pattern). Reuse the
  consumer app's CSS variables from [`frontend/app/globals.css`](../../frontend/app/globals.css)
  (`--sidebar`, `--card`, `--primary`, `--chart-1..5`).
- **Typography:** the consumer scale in [`frontend/lib/design/layout.ts`](../../frontend/lib/design/layout.ts).
- **Components:** extend the existing shadcn primitives in `frontend/components/ui/`
  (`card`, `tabs`, `button`, `badge`, `input`). Add `table`, `dialog`, and a lightweight chart
  primitive. Charts are built with plain SVG/CSS bars to avoid heavy dependencies until a
  charting library is justified.
- **Density:** tables and the inbox are information-dense; the Home KPI row is airy. Tablet-first
  (Ayush's laptop); mobile is read-only KPI glance.
- **Color semantics:** `--chart-2` (green) = healthy/won, `--chart-3` (amber) = attention,
  `--destructive` (red) = failure/blocked, `--primary` (blue) = neutral/active.

---

## 8. Screen acceptance checklist

Before any admin screen ships it must satisfy:

- [ ] Belongs to exactly one workstream (§2)
- [ ] Every actionable number drills into a list or inbox item (§3.2)
- [ ] No PAN beyond role-gated last-4 (§3.4)
- [ ] All privileged mutations write an audit row (§3.5)
- [ ] Degrades to a setup banner if its data source is unconfigured (§3.8)
- [ ] Role-gated on both client and server (§6)
- [ ] Loads in under 3 seconds on a tablet

---

## 9. Open decisions and adopted defaults

The master plan §13 lists ten open decisions. For build velocity this program adopts the
following defaults; the CEO can override any during review.

| # | Decision | Adopted default |
|---|----------|-----------------|
| 1 | Database vendor | Neon Postgres (file/in-memory store until provisioned) |
| 2 | Admin auth | Built-in HMAC-signed session now; Clerk as production upgrade |
| 3 | Admin hosting | `/admin` route in the same Next.js app |
| 4 | B2B beta | Invite-only application queue |
| 5 | Wallet minimum top-up | Deferred to Phase 2 |
| 6 | CA verification | Manual checklist; ICAI API later |
| 7 | PostHog | Embed dashboards on Analytics; native KPI cards on Home |
| 8 | Companion CMS | Continue JSON in git for Phase 1; admin editor Phase 2B |
| 9 | Chrome extension passkey | Deferred (Phase 3) |
| 10 | Daily dashboard owner | Ayush daily; CEO weekly |
