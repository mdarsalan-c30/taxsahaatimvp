# Benchmark 3 — CRM-lite for seasonal B2C plus partner B2B

**Scope:** HubSpot pipelines, Intercom support inbox, SaaS partner-onboarding queues.
**Question answered:** What to copy, what to avoid, and the TaxSaathi-specific constraint.

---

## HubSpot (pipeline + contact timeline)

**What to copy**
- A simple deal pipeline board with named stages and a count per stage. Drag is optional; the stage is what matters.
- The contact record as a timeline: every interaction in one chronological view.
- A small set of properties per contact, not a hundred custom fields.

**What to avoid**
- Marketing automation, sequences, and the custom-object designer. That is a different product and a different team.

**TaxSaathi constraint**
- Our B2C "contact" is a pseudonymous filing session, not a person we cold-email. Stages are derived automatically from analytics events (see design guidelines §5). Ops adds notes and follow-up tasks but does not manufacture leads.

---

## Intercom (support inbox)

**What to copy**
- One inbox of conversations, each assignable, taggable, and closable.
- Tags for routing (billing, parse, companion confusion).
- The conversation lives on the contact, so support history and pipeline stage are visible together.

**What to avoid**
- Building a live-chat product. Our support arrives via the existing feedback and chat endpoints; the admin is the agent side, not a new channel.

**TaxSaathi constraint**
- Support tickets must link back to a `session_id` so an agent can see the user's filing progress and compute summary (never the raw PDF) while replying.

---

## SaaS partner-onboarding queues

**What to copy**
- A verification queue with a checklist and an explicit approve/reject with reason.
- Status lifecycle: pending → verified → rejected → suspended.
- A gate: no partner gets product access until verified.

**What to avoid**
- Auto-approval. CA verification is a trust gate for the whole B2B lane.

**TaxSaathi constraint**
- Multi-tenancy from day one: every B2B record carries `tenant_id`, and Firm A must never see Firm B. The CRM B2B tab is the partner pipeline; the verification queue feeds its first two stages.

---

## Net takeaways for our build

1. Two pipelines, one `/crm` module: B2C (auto-staged from events) and B2B (partner lifecycle).
2. Contact = pseudonymous session for B2C; notes and tasks are the human layer on top.
3. Support inbox follows Intercom's agent model and links every ticket to a session.
4. CA verification is a gated queue; no B2B access before verified; tenant isolation is mandatory.
5. Keep it lite: pipeline + timeline + tasks + inbox. No campaigns, no automation, in Phase 1.
