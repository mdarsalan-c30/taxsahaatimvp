# Wireframe 5 — CRM pipeline

Workstream WS-C. Primary user Ayush. Two tabs (B2C, B2B). Stages are derived automatically from
analytics events (design guidelines §5); ops adds notes and tasks on top.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ CRM                                   ( B2C )  B2B        [ Search contact ]    │
├──────────────────────────────────────────────────────────────────────────────┤
│  PIPELINE (count per stage, click a card → contact detail)                     │
│  ┌────────┬────────┬────────┬─────────┬───────┬──────────┬─────────┐           │
│  │ Lead   │Started │Active  │Checkout │ Won   │Companion │Support  │           │
│  │  840   │  412   │  190   │  118    │  38   │   23     │   6     │           │
│  ├────────┼────────┼────────┼─────────┼───────┼──────────┼─────────┤           │
│  │sess_a1 │sess_b2 │sess_c3 │sess_d4  │sess_e5│sess_f6   │sess_g7  │           │
│  │sess_a8 │sess_b9 │sess_c0 │sess_d1  │sess_e2│sess_f3   │         │           │
│  │  …     │  …     │  …     │  …      │  …    │  …       │         │           │
│  └────────┴────────┴────────┴─────────┴───────┴──────────┴─────────┘           │
│                                                                                │
│  MY TASKS (assigned to me)                                          [ + Task ] │
│  ☐ Call back sess_d4 re: parse failure         due today                       │
│  ☐ Send LAUNCH50 to sess_d1                     due today                       │
│  ☑ Confirm companion unlock sess_e5             done                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

Annotations
- A contact card shows the pseudonymous `session_id` and a masked email if one was captured.
- Stage is read from the latest qualifying `session_event`; ops cannot drag a contact backwards past an automatic transition.
- B2B tab swaps stages to Prospect → Review → Verified → Onboarded → Active → Churn and cards show firm name + city.
- Tasks live in `crm_tasks` and are the human layer; the pipeline itself is a view over events.
