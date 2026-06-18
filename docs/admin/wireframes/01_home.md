# Wireframe 1 — Home (command center)

Workstream WS-A. Must pass the Ayush test: traffic, paid, revenue, and top three actions visible
in under 60 seconds with no scrolling for the KPI row and inbox.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TaxSaathi Admin        [Today | 7d ▼]   [B2C + B2B ▼]      Nikhil ▼   🔔 3     │
├──────────┬─────────────────────────────────────────────────────────────────────┤
│ Home  ●  │  KPI ROW (each card: value, delta vs prior period, click → list)     │
│ ── B2C   │  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐        │
│ CRM      │  │Traffic ││Starts  ││Paid    ││Revenue ││Compan. ││Issues  │        │
│ Coupons  │  │ 2,841  ││  412   ││   38   ││ ₹18.4k ││  61%   ││   7    │        │
│ Payments │  │ +12%   ││ +4%    ││ +9%    ││ +15%   ││ -2%    ││ +3     │        │
│ Pricing  │  └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘        │
│ Analytics│                                                                       │
│ Sessions │  ┌───────────────────────────────┐  ┌──────────────────────────────┐ │
│ Support  │  │ FUNNEL (7d)                   │  │ ACTION INBOX                 │ │
│ ── B2B   │  │ Landing  ████████████ 100%    │  │ ▸ 3 CA verifications     →    │ │
│ Partners │  │ Started  ████████░░░░  62%    │  │ ▸ 2 DPDP deletions       →    │ │
│ Billing  │  │ Checkout ███░░░░░░░░░  28%    │  │ ▸ 5 parse failures (24h) →    │ │
│ ── Plat  │  │ Paid     ██░░░░░░░░░░  12%    │  │ ▸ 1 low CA wallet        →    │ │
│ Compliance│ │ Companion █░░░░░░░░░░   8%    │  │                              │ │
│ Settings │  └───────────────────────────────┘  └──────────────────────────────┘ │
│          │  ┌──────────────────────────────────────────────────────────────┐    │
│          │  │ REVENUE — B2C vs B2B (30d)            [+ New coupon] [Export]  │    │
│          │  │   ▁▂▃▅▆▇▆▅▆▇  (two-series bar/line)                           │    │
│          │  └──────────────────────────────────────────────────────────────┘    │
└──────────┴─────────────────────────────────────────────────────────────────────┘
```

Annotations
- Each KPI card respects the Today / 7d toggle and shows a delta vs the prior period.
- Clicking a card navigates to the matching list filtered to the same range (Paid → Payments, Issues → Sessions filtered to failures).
- Action inbox items are generated from system state, not entered manually. Each row links to its queue.
- If PostHog is unconfigured, the funnel panel shows a setup banner and KPI cards fall back to counts from `session_events`.
- Revenue chart is a lightweight SVG/CSS series (no charting dependency in Phase 1).
