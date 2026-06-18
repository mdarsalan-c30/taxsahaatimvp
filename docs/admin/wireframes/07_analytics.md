# Wireframe 7 — Analytics

Workstream WS-C. Primary user Ayush. Embeds PostHog dashboards (funnel, companion, traffic) and
offers a weekly CSV export. Does not rebuild funnel visualization in Phase 1.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Analytics                              [ Date range ▼ ]        [ Export CSV ]   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Tabs:  ( Funnel )   Companion   Traffic                                        │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                          │ │
│  │   [ Embedded PostHog dashboard iframe ]                                  │ │
│  │                                                                          │ │
│  │   Funnel: landing_cta_click → import_started → paywall_view →            │ │
│  │           payment_success → companion_wizard_completed                   │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  SECONDARY METRIC                                                              │
│  Field-error rate (M2): 9.4%   = confusion users / footprint-viewed users      │
└──────────────────────────────────────────────────────────────────────────────┘

  IF POSTHOG NOT CONFIGURED:
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚠ PostHog is not configured.                                                  │
│  Set NEXT_PUBLIC_POSTHOG_KEY to embed dashboards. Until then, KPI counts are   │
│  computed from the session_events store.   [ Setup guide ▸ ]                    │
│  Native fallback: Starts 412 · Paid 38 · Companion complete 23                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

Annotations
- Embed URL comes from an env var (`NEXT_PUBLIC_POSTHOG_EMBED_FUNNEL`, etc.); when absent, show the setup banner and the native fallback counts.
- Field-error rate uses the formula in design guidelines §4, computed from `session_events`.
- Export CSV produces the weekly digest the CEO reviews.
