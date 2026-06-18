# Wireframe 6 — CRM contact detail

Workstream WS-C. Primary user Ayush. One contact's full picture: timeline, notes, tasks, support,
and a support-only manual companion unlock. Never shows the raw uploaded PDF.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← CRM   Contact sess_d4              Stage: Checkout      [ Manual unlock ▸ ]   │
├───────────────────────────────────────────┬────────────────────────────────────┤
│  TIMELINE (from session_events)           │  PROPERTIES                        │
│  06-14 11:02  paywall_view                │  session_id  sess_d4               │
│  06-14 10:58  regime_compare_completion   │  email       a***@gmail.com        │
│  06-14 10:40  form16_upload               │  ITR form    ITR-1                 │
│  06-14 10:31  import_started              │  plan         ai_smart (intended)  │
│  06-14 10:30  landing_cta_click           │  progress     62%                  │
│                                           │  last seen    3m ago               │
│  NOTES (internal only)          [ + Note ]│  compute      ₹16,516 refund (est) │
│  Ayush · 06-14  user stuck on AIS step    │                                    │
│                                           │  SUPPORT (linked tickets)          │
│  TASKS                          [ + Task ]│  #214 parse error  open  →         │
│  ☐ Call back re: parse failure  due today │                                    │
└───────────────────────────────────────────┴────────────────────────────────────┘
```

Annotations
- Email is masked by default; revealing it (and PAN last-4, if ever stored) requires the right role and writes an audit row.
- Compute summary is the engine output only — never the source document (24h retention still applies to files).
- Manual unlock is a support action: it writes a `companion_grants` row with source = admin and an `audit_logs` entry.
- Notes are `crm_notes`, tasks are `crm_tasks`, both internal and never user-visible.
