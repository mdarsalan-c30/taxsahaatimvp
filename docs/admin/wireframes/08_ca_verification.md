# Wireframe 8 — CA verification queue

Workstream WS-D / B2B lane (Phase 1B build, B2B prep). A gated queue: no CA gets B2B access until
verified. Manual checklist with approve/reject and a full audit trail. Multi-tenant from day one.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Partners ▸ Verification queue                          [ Search firm / ICAI ]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filter:  ( Pending )  Verified  Rejected  Suspended                           │
│  ┌──────────────┬──────────────┬───────────┬──────────┬────────────────────┐  │
│  │ Firm         │ Applicant    │ ICAI no.  │ City     │ Submitted          │  │
│  ├──────────────┼──────────────┼───────────┼──────────┼────────────────────┤  │
│  │ Sharma & Co  │ R. Sharma    │ 4412xx    │ Jaipur   │ 06-12  [ Review ▸ ]│  │
│  │ TaxFirst LLP │ N. Gupta     │ 5590xx    │ Delhi    │ 06-13  [ Review ▸ ]│  │
│  └──────────────┴──────────────┴───────────┴──────────┴────────────────────┘  │
│                                                                                │
│  REVIEW PANEL (selected)                                                       │
│  Firm: Sharma & Co   Applicant: R. Sharma   ICAI: 4412xx   City: Jaipur        │
│  Checklist:                                                                    │
│   ☐ ICAI membership active                                                     │
│   ☐ Name matches membership record                                            │
│   ☐ No prior fraud flag                                                        │
│  Documents:  [ membership.pdf ]  [ id.pdf ]                                    │
│  Decision:  ( Approve )  Reject   Reason [ ……………………………… ]                       │
│                                            [ Save decision (writes audit) ]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

Annotations
- Each application is a `tenants` row in `pending` status; approval flips status to `verified` and unlocks B2B access for that tenant only.
- Every decision writes an `audit_logs` row (approver, timestamp, reason).
- Firm A can never see Firm B; all B2B records carry `tenant_id`.
- ICAI API integration is future; Phase 1B is a manual checklist.
