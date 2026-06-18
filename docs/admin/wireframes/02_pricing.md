# Wireframe 2 — Pricing & offers

Workstream WS-B. CEO only. The single source of truth for plan prices and the launch offer;
marketing card and checkout amount must never drift because both read the same config.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Pricing & offers                                            CEO only           │
├──────────────────────────────────────────────────────────────────────────────┤
│  PLANS (editable)                                                              │
│  ┌──────────┬────────────┬─────────────┬──────────────┬────────────────────┐  │
│  │ Plan     │ Base price │ Offer price │ Offer ends   │ Status             │  │
│  ├──────────┼────────────┼─────────────┼──────────────┼────────────────────┤  │
│  │ Free     │ ₹0         │ —           │ —            │ Live               │  │
│  │ DIY      │ [ ₹499  ]  │ —           │ —            │ Live               │  │
│  │ AI Smart │ [ ₹799  ]  │ [ ₹349  ]   │ [31 Jul 26 ] │ Live · offer active│  │
│  │ CA Review│ [ ₹2,499]  │ —           │ —            │ Coming soon        │  │
│  └──────────┴────────────┴─────────────┴──────────────┴────────────────────┘  │
│                                                                                │
│  PREVIEW (reads draft config)                                                  │
│  ┌─────────────── Marketing card ───────────────┐  ┌──── Checkout amount ───┐ │
│  │ AI Smart   ₹349  (was ₹799)  Launch offer    │  │ AI Smart → Razorpay     │ │
│  │ "...you file on incometax.gov.in yourself"   │  │ order amount: ₹349      │ │
│  └──────────────────────────────────────────────┘  └─────────────────────────┘ │
│                                                                                │
│  [ Discard draft ]                         [ Publish change (requires 2FA) ]   │
│                                                                                │
│  REVISION HISTORY                                                              │
│  2026-06-15  CEO  AI Smart offer ₹399 → ₹349                                   │
│  2026-06-01  CEO  DIY ₹449 → ₹499                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Annotations
- Editing a field creates a draft; nothing is live until Publish.
- Publish writes a `pricing_revisions` audit snapshot and an `audit_logs` row, and revalidates the marketing/checkout caches so the change propagates within ~60s.
- Preview renders both the marketing card and the derived Razorpay order amount from the draft, proving they agree.
- Compliance: the marketing copy preview always carries the "you file yourself" line; it cannot be removed here.
