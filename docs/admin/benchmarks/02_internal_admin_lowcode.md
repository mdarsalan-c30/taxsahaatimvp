# Benchmark 2 — Internal admin and low-code tools

**Scope:** Retool, Linear, Metabase / PostHog embedded analytics.
**Question answered:** What to copy, what to avoid, and the TaxSaathi-specific constraint.

---

## Retool (internal CRUD + audit)

**What to copy**
- Every list is search + filter + export CSV. This is the default contract for all our list pages.
- Mutations are explicit forms with confirmation, and there is a visible record of who did what.
- Role-based component visibility: editors see edit controls, viewers do not.

**What to avoid**
- Retool's drag-and-drop builder encourages sprawl and inconsistent UX. We hand-build a small, consistent component set instead, so screens feel like one product.
- Cost and vendor lock-in for a tool ops uses daily.

**TaxSaathi constraint**
- Our audit log is a compliance asset (DPDP), not just a nicety. It must capture before/after for sensitive mutations, not only "row edited."

---

## Linear (inbox / action queue)

**What to copy**
- The triage inbox: a single prioritized list of things needing action, each with a one-click resolve path. This is the model for the Home action inbox.
- Keyboard-fast navigation and tight information density for power users (Ayush daily).
- Status as a first-class, colored, filterable property.

**What to avoid**
- Linear's project/cycle hierarchy is overkill. Our "issues" are operational (parse failures, deletion requests, verifications), not engineering tickets with sprints.

**TaxSaathi constraint**
- Inbox items are generated from system state (failed parses, open DPDP requests, pending CA verifications, low CA wallet), not manually created. The inbox is a view over data, not a task database of its own.

---

## Metabase / PostHog (embedded analytics)

**What to copy**
- Do not rebuild funnel visualization in Phase 1. PostHog already receives our funnel and companion events; embed its dashboards on the Analytics screen.
- Saved questions / dashboards that ops can open without writing queries.

**What to avoid**
- Forcing ops to write SQL or build charts. Pre-build the three dashboards they need (funnel, companion, traffic) and embed them read-only.

**TaxSaathi constraint**
- PostHog is optional in our stack (`NEXT_PUBLIC_POSTHOG_KEY`). When it is absent, the Analytics screen shows a setup banner and the Home KPI cards fall back to counts computed from our own `session_events` store. No screen may assume PostHog exists.

---

## Net takeaways for our build

1. Every list page: search + filter + export CSV.
2. Home action inbox follows Linear's triage model, generated from system state.
3. Embed PostHog for funnel/companion analytics; do not rebuild it in Phase 1.
4. Audit log captures before/after for compliance, not just an action label.
5. Degrade gracefully when PostHog is not configured.
