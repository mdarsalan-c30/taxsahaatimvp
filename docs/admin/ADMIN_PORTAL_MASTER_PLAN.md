# Backend Admin Portal — Master Plan

**Product:** LastMinute ITR / TaxSaathi  
**Version:** 1.0 · June 2026  
**Owner:** CEO (Nikhil Anand)  
**Status:** Planning brief → implementation spec (after approval)

---

## How to use this document

| Phase | Audience | Action |
|-------|----------|--------|
| **1 — Plan** | Consultant (McKinsey / EY / product agency) | Analyze platform, validate modules, propose DB/auth/vendor choices, produce timeline + cost |
| **2 — Build** | Engineering (Arsalan + team) + Ops (Ayush) | Implement modules in phased order using §8 roadmap |

**Out of scope for consultants in Phase 1:** writing production code.  
**In scope:** architecture, module specs, wireframes, data models, integration map, phased delivery plan.

**Live product references:**
- MVP (partner build): https://taxsahaatimvp-exkv.vercel.app/
- Production: https://lastminute-itr.vercel.app/
- Repo: https://github.com/mdarsalan-c30/taxsahaatimvp

---

## 1. North star

Build **one simple admin dashboard** that lets the CEO and ops team **run the entire platform without touching code** — for both:

- **B2C** — direct taxpayers (AI companion, pay to unlock portal guide)
- **B2B** — verified CA partners (same engine, per-client filing, platform fee ~₹200/return)

**Core promise (never violate in admin copy or features):**  
We **guide** users on incometax.gov.in. We **never auto-submit** returns.

---

## 2. Product context (what admin must support)

### 2.1 Business model

| Plan | B2C price | Unlocks |
|------|-----------|---------|
| Free | ₹0 | Estimate, ITR form pick, checklist |
| DIY | ₹499 | Form 16 import, wizard, companion guide |
| AI Smart | ₹349 launch / ₹799 | DIY + AIS mismatch, regime compare, deductions |
| CA Review | ₹2,499 | Coming soon — human sign-off |

**B2B:** Verified CA pays platform ~₹200/client filing (volume tiers TBD); CA bills their client separately.

### 2.2 Technical stack (as-built)

```
frontend/     Next.js 15, App Router, Zustand, Razorpay, PostHog (optional)
backend/      Python L1 tax engine (deterministic)
vercel.json   Monorepo deploy (frontend + Python compute)
```

**Critical gap today:** No central database. Admin plan **must** add one (Postgres / Supabase / Neon recommended) for coupons, tenants, audit logs, CMS, billing.

### 2.3 AI / engine layers

| Layer | Role | Admin need |
|-------|------|------------|
| L1 | Hardcoded Python engine (source of truth) | Version, audit samples, error rate |
| L2 | RAG + LLM (Gemini primary, Claude fallback) | Token usage, quality sampling |
| L3 | Portal companion (copy-ready field guide) | CMS for steps, confusion metrics |

**Rule:** L1 primary + external API as verification/fallback only — admin monitors fallback rate.

### 2.4 Key user journeys (instrument every step)

```
Landing → Import (Form 16) → Income → Deductions → Regime → Review
  → Checkout (plan + coupon) → Payment → Companion unlock → Portal wizard → Done
```

B2B adds: `CA login → Add client → Same filing flow (tenant-scoped) → Wallet debit`

### 2.5 Compliance (non-negotiable)

| Rule | Admin enforcement |
|------|-------------------|
| DPDP | "Delete my data" queue; deletion SLA |
| Document retention | Auto-delete uploads after **24 hours** |
| No long-term PAN storage | Pseudonymize in lists; encrypt at rest if stored |
| No guaranteed refund copy | CMS approval workflow for marketing text |
| No auto-file | No admin action may submit to ITD |

---

## 3. Design principle: one simple dashboard

Admin UX must pass the **Ayush test**: ops hire opens laptop Monday morning and answers these in **under 60 seconds** without asking engineering.

### 3.1 Home dashboard (default landing)

Single screen — **6 KPI cards + 2 charts + action inbox**.

**KPI cards (today / 7d toggle):**

| Card | Metric | Source |
|------|--------|--------|
| Traffic | Sessions, Form 16 CTA clicks | PostHog / Vercel Analytics |
| Signups / starts | Filing sessions started | App events |
| Paid conversions | Successful Razorpay + coupon unlocks | Payments DB |
| Revenue | ₹ B2C + ₹ B2B split | Razorpay + wallet |
| Companion completion | % who finish portal wizard | PostHog companion events |
| Active issues | Parse failures + open support tickets | Error pipeline |

**Charts:**
1. Funnel bar: Landing → Import → Checkout → Paid → Companion complete (7-day)
2. Revenue line: B2C vs B2B daily

**Action inbox (right column):**
- Pending CA verifications (count → click to queue)
- Open DPDP deletion requests
- Failed Form 16 parses (last 24h)
- Low wallet balance CA firms (< 10 credits)

**Navigation (left sidebar — keep flat, max 12 items):**

```
Home
── B2C ──
Coupons · Payments · Users · Feedback
── B2B ──
CA Partners · Client Cases · B2B Billing
── Platform ──
Content · Companion CMS · Engine · AI Monitor
── System ──
Compliance · Team · Audit Log · Settings
```

No nested menus deeper than 2 levels. Every list page: search + filter + export CSV.

---

## 4. Module catalog — B2C

### 4.1 Coupons & promotional access — **P0**

**Why:** CEO must grant free companion access for beta, influencers, and support — without code deploy.

| Feature | Detail |
|---------|--------|
| Create coupon | Code, plan scope, max uses, expiry (default 30 days), B2C/B2B/both |
| Redeem flow | Valid code at checkout → skip Razorpay → grant companion session |
| List / revoke | Active, expired, exhausted; one-click deactivate |
| Audit | Creator, redemptions (timestamp, session ID, IP hash) |
| Fraud | Flag same IP > N redemptions |

**Acceptance:** CEO creates `LAUNCH50`, user enters at payment, lands on companion without Razorpay.

---

### 4.2 Payments & revenue — **P0**

| Feature | Detail |
|---------|--------|
| Order list | Plan, amount, status, Razorpay order ID, coupon used, timestamp |
| Refunds | Initiate refund (Razorpay link or API); reason required |
| Revenue dashboard | Daily/weekly/monthly; filter by plan and coupon vs paid |
| Failed payments | List + retry count |

---

### 4.3 Traffic & funnel — **P0**

| Feature | Detail |
|---------|--------|
| Traffic overview | Sessions, top pages, Form 16 CTA rate |
| Funnel visualization | Step drop-off with % (integrate PostHog or native events) |
| UTM / source | Which channel drove paid conversions |
| Export | Weekly CSV for CEO review |

**Primary user:** Ayush (daily).

---

### 4.4 User sessions (privacy-safe) — **P1**

| Feature | Detail |
|---------|--------|
| Session list | Anonymous ID, progress %, ITR form, plan, last step, last seen |
| Detail view | Step history, compute summary (no raw PDF) |
| Actions | Force unlock companion (support), trigger data deletion |
| Search | By session ID only — not PAN in Phase 1 lists |

---

### 4.5 Document ingestion monitor — **P1**

| Feature | Detail |
|---------|--------|
| Upload log | Connector (Form 16, AIS, 26AS, CAMS), parse status, error reason |
| Retention | Files past 24h marked deleted; job health indicator |
| Error rate | Password-protected PDF, corrupt file, parse timeout |

---

### 4.6 Feedback & support — **P1**

| Feature | Detail |
|---------|--------|
| Reviews | `/reviews` submissions — rating, text, moderate/hide |
| Support chat | Threads from `/api/chat`; assign to ops |
| Tags | B2C / billing / parse / companion confusion |

---

### 4.7 Content management — **P2**

Replace `BLOG_ADMIN_TOKEN` hack with proper CMS.

| Feature | Detail |
|---------|--------|
| Blog / learn articles | Create, edit, publish, schedule, slug, SEO meta |
| Homepage blocks | Pricing, launch offer timer, hero copy (versioned) |
| Help / FAQ | Edit help center articles |
| Approval | Draft → publish; CEO optional approve for pricing copy |

---

### 4.8 Companion CMS — **P2**

| Feature | Detail |
|---------|--------|
| Edit portal steps | `fieldLabel`, `plainEnglish`, `action` (enter/skip/deselect), `engineField` |
| Preview | Render step as user sees it |
| Metrics overlay | Confusion rate per field (from PostHog) |
| Publish | Version stamp; rollback to previous version |

Source today: `frontend/data/portal_steps.json` — admin becomes editor.

---

## 5. Module catalog — B2B (CA partner lane)

Plan architecture **now**; UI can ship Phase 2. Database **must** support multi-tenancy from Phase 1 schema design.

### 5.1 CA verification & onboarding — **P1 plan / P2 build**

| Feature | Detail |
|---------|--------|
| Application queue | Name, firm, ICAI no., docs, city |
| Workflow | pending → verified → rejected → suspended |
| Review checklist | Membership active, name match, no prior fraud flag |
| Audit | Approver, timestamp, reason |

**Gate:** No B2B access until `verified`.

---

### 5.2 CA firm & team management — **P2**

| Feature | Detail |
|---------|--------|
| Firm profile | Name, logo, contact, service areas |
| Sub-users | Partner CA, clerk, firm admin — role-based |
| Seats | Client/month limits per plan tier |
| Suspend | Whole firm — billing dispute or compliance |

**Roles:**

| Role | Access |
|------|--------|
| Platform Super Admin | All firms |
| CA Firm Admin | Own firm team + billing + all clients |
| CA Practitioner | Own assigned clients, compute, guide |
| CA Clerk | Data entry only |
| B2C Ops (Ayush) | B2C modules only — no firm PII bulk export |

---

### 5.3 CA client cases — **P2**

| Feature | Detail |
|---------|--------|
| Client list | Per firm; name, PAN last-4, AY, ITR form, status |
| Isolation | Firm A cannot see Firm B (row-level tenant ID) |
| Bulk import | CSV upload for large CA practices |
| Consent log | Client agreed to CA prep via platform (DPDP) |
| Lifecycle | draft → computed → guide_unlocked → filed_reported → closed |

---

### 5.4 B2B billing & wallet — **P2**

| Feature | Detail |
|---------|--------|
| Price tiers | Per-filing fee (e.g. ₹200); volume discounts |
| Prepaid wallet | Top-up via Razorpay; debit per client filing |
| B2B coupons | e.g. 50 free filings for launch CA partners |
| Low balance alerts | Email to firm admin |
| Revenue view | B2B ARPU, top firms, wallet vs post-paid (future) |

---

### 5.5 B2B filing ops dashboard — **P2**

Mirror B2C monitor, filtered by firm:

- Parse success/fail per client  
- Compute results + mismatch flags  
- Companion unlock + completion per client  
- Escalation to CA review queue  

---

### 5.6 B2B partner analytics — **P2**

| Metric | Use |
|--------|-----|
| Active CAs (filed ≥1 in 30d) | Network health |
| Filings per firm / city | Sales targeting (400 CA network) |
| Funnel | signup → verified → first client → first paid filing |
| Churn | Inactive 60+ days |
| Partner NPS | Separate from B2C reviews |

---

### 5.7 B2B enablement & compliance — **P2**

- In-admin announcements for CA partners  
- CA agreement acceptance log (version + timestamp)  
- Firm suspension playbook  
- B2B support tickets (priority SLA)  

---

## 6. Module catalog — shared platform

### 6.1 Engine & computation audit — **P2**

| Feature | Detail |
|---------|--------|
| Compute log | Input hash, regime, tax delta, engine version (sampled, not every row) |
| L1 vs API fallback rate | When API layer ships |
| Escalation queue | CA reviewer flags wrong computation |
| Deploy log | Which engine version is live |

---

### 6.2 AI monitor (L2 / Genie) — **P2**

| Feature | Detail |
|---------|--------|
| LLM usage | Gemini vs Claude, tokens, latency, errors |
| Quality sample | Redacted prompt/response review queue |
| Genie chat logs | Support escalation |
| Blocked tips audit | Lawful-only filter rejections |

---

### 6.3 Compliance & data governance — **P1**

| Feature | Detail |
|---------|--------|
| DPDP deletion queue | Request → in progress → done; SLA days |
| Retention config | Document TTL (default 24h) |
| Admin audit log | Every admin action: who, what, when, before/after |
| Policy version tracker | Privacy/terms update acceptance counts |

---

### 6.4 Team & access control — **P0**

| Feature | Detail |
|---------|--------|
| Admin users | Invite by email; assign role |
| 2FA | Required for refunds, coupon create, firm suspend |
| Session timeout | 30 min idle |
| Impersonation | Read-only support view of user session (logged) |

---

### 6.5 Feature flags — **P3**

- Toggle: bypass payment (testing), new companion version, B2B beta access  
- Per-firm or global scope  

---

### 6.6 Chrome extension passkeys — **P3** (future)

- Issue / revoke 7-day assistance passkeys  
- Usage log per key  
- Planned alongside CA companion assistance  

---

## 7. Data model (minimum entities)

Design these tables/collections in Phase 1 planning — implement incrementally.

```
admin_users          id, email, role, 2fa_enabled, created_at
audit_logs           id, admin_user_id, action, entity, before, after, ts

coupons              id, code, plan_scope, max_uses, used_count, expires_at, lane(b2c|b2b|both)
coupon_redemptions   id, coupon_id, session_id, tenant_id?, ts, ip_hash

payments             id, razorpay_order_id, amount, plan, status, session_id, coupon_id?, ts
companion_grants     id, session_id, source(payment|coupon|admin), expires_at?

sessions             id, anonymous_token, progress_pct, itr_form, plan, last_step, ts
session_events       id, session_id, event_name, payload_json, ts

documents            id, session_id, connector, parse_status, error, uploaded_at, deleted_at
deletion_requests    id, session_id, status, requested_at, completed_at

tenants              id, firm_name, ica_i_no, status, wallet_balance, created_at
tenant_users         id, tenant_id, email, role, status
tenant_clients       id, tenant_id, display_name, pan_last4, ay, status
tenant_filings       id, tenant_client_id, session_id, billed_amount, status

content_revisions    id, type(blog|homepage|help|portal_step), slug, body_json, status, published_at
feedback             id, rating, comment, session_id?, moderated, ts
support_tickets      id, lane(b2c|b2b), subject, status, assignee, ts

engine_audit_samples id, input_hash, output_summary, engine_version, ts
ai_usage_logs        id, provider, tokens, latency_ms, session_id?, ts
```

**Tenant rule:** Every B2B row carries `tenant_id`. B2C rows have `tenant_id = null`.

---

## 8. Phased roadmap

### Phase 0 — Planning (2 weeks, consultant)

Deliverables:
- [ ] Validated module list (this doc ± changes)
- [ ] DB vendor choice + schema DDL
- [ ] Auth provider choice (Clerk / Auth0 / custom email+OTP)
- [ ] Wireframes: Home dashboard + Coupons + CA verification
- [ ] Integration map (Razorpay, PostHog, Vercel, LLM APIs)
- [ ] Cost + team estimate

### Phase 1A — Launch critical (2–3 weeks build)

**Goal:** CEO + Ayush run daily ops without engineers.

| Module | Priority |
|--------|----------|
| Admin auth + roles | P0 |
| Home dashboard (6 KPIs + inbox) | P0 |
| Coupons (create, redeem hook, list) | P0 |
| Payments list + revenue card | P0 |
| Traffic / funnel (PostHog embed or native) | P0 |
| Audit log | P0 |

**Exit criteria:** Coupon unlocks companion on production; dashboard loads in < 3s.

### Phase 1B — Trust & compliance (2 weeks)

| Module | Priority |
|--------|----------|
| DPDP deletion queue | P1 |
| Document retention job + monitor | P1 |
| User sessions (privacy-safe list) | P1 |
| Feedback / support inbox | P1 |
| CA verification queue (manual approve — B2B prep) | P1 |

### Phase 2A — B2B core (3–4 weeks)

| Module | Priority |
|--------|----------|
| Tenant schema + firm accounts | P2 |
| CA client cases | P2 |
| B2B wallet + per-filing billing | P2 |
| B2B filing ops view | P2 |
| B2B partner analytics | P2 |

### Phase 2B — Platform depth (3–4 weeks)

| Module | Priority |
|--------|----------|
| Companion CMS | P2 |
| Content CMS (blogs, homepage) | P2 |
| Engine audit samples | P2 |
| AI monitor | P2 |
| CA review escalation queue | P2 |

### Phase 3 — Growth & extensions

- Feature flags  
- Chrome extension passkey admin  
- CA referral tracking  
- Post-paid invoicing for large firms  
- Co-branded CA marketing assets  

---

## 9. Integrations map

```
                    ┌─────────────────┐
                    │  Admin Portal   │
                    │  (Next.js app   │
                    │   or Retool)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐      ┌────────────┐      ┌────────────┐
   │ Postgres  │      │  User App  │      │  External  │
   │ (admin DB)│◄────►│  frontend/ │      │  services  │
   └───────────┘      │  backend/  │      └────────────┘
                      └────────────┘            │
                           │          Razorpay · PostHog
                           │          Gemini · Claude
                           ▼          Vercel logs · Email
                    Filing APIs
                    /api/payments/*
                    /api/compute
                    /api/documents/*
```

**Build recommendation (for Phase 1A speed):**

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Custom Next.js `/admin`** | Full control, same repo, Ayush-branded UX | Dev time | **Recommended** for simple dashboard |
| Retool / Appsmith | Fast CRUD | Cost, less custom funnel viz | Good for internal MVP only |
| Separate admin subdomain | Security isolation | Two deploys | `admin.lastminute-itr.vercel.app` |

---

## 10. Roles & permissions matrix

| Action | CEO | Ops (Ayush) | Engineering | Content | CA Firm Admin |
|--------|-----|-------------|-------------|---------|---------------|
| View dashboard | ✅ | ✅ | ✅ | ❌ | Own firm only |
| Create coupon | ✅ | ✅ | ❌ | ❌ | B2B only (if enabled) |
| Refund payment | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify CA | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete user data | ✅ | ✅ | ❌ | ❌ | Own clients |
| Edit portal steps | ✅ | ❌ | ✅ | ❌ | ❌ |
| Publish blog | ✅ | ❌ | ❌ | ✅ | ❌ |
| Suspend CA firm | ✅ | ❌ | ❌ | ❌ | ❌ |
| View engine audit | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## 11. Simple dashboard wireframe (ASCII)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  TaxSaathi Admin          [Today ▼]  [B2C+B2B ▼]     Nikhil ▼  🔔 3      │
├──────────┬─────────────────────────────────────────────────────────────────┤
│          │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  Home ●  │  │ Traffic │ │ Starts  │ │  Paid   │ │ Revenue │ │ Issues  │   │
│  Coupons │  │  2,841  │ │   412   │ │    38   │ │ ₹18.4k  │ │    7    │   │
│  Payments│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│  Traffic │                                                                 │
│  ── B2B  │  ┌──────────────────────────────┐ ┌──────────────────────────┐  │
│  CA Partners│  FUNNEL (7d)                  │ │ ACTION INBOX             │  │
│  Billing │  │ Land ████████████ 100%        │ │ • 3 CA verifications     │  │
│  ── Plat │  │ Import ████████░░  62%       │ │ • 2 DPDP deletions       │  │
│  Content │  │ Checkout ███░░░░░  28%      │ │ • 5 parse failures       │  │
│  Engine  │  │ Paid ██░░░░░░░░  12%        │ │ • 1 low wallet (CA)      │  │
│  Compliance│ │ Companion █░░░░░░░░   8%    │ └──────────────────────────┘  │
│  Settings│  └──────────────────────────────┘                                │
│          │  ┌──────────────────────────────┐                               │
│          │  │ REVENUE — B2C vs B2B (30d)   │  [+ New Coupon]  [Export CSV]│
│          │  │     📈 line chart            │                               │
│          │  └──────────────────────────────┘                               │
└──────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 12. Acceptance criteria (whole project)

### Planning phase done when:
- [ ] Consultant delivers DB schema DDL + auth choice + 2-week Phase 1A sprint plan
- [ ] CEO signs off wireframes for Home + Coupons + CA verification
- [ ] Multi-tenant rules documented (B2B isolation)

### Phase 1A done when:
- [ ] Ayush logs in, sees live KPIs, creates coupon, sees redemption in list
- [ ] User redeems coupon at checkout → companion unlocks without Razorpay
- [ ] All admin actions appear in audit log
- [ ] Dashboard loads on mobile tablet (responsive)

### Phase 2 B2B done when:
- [ ] Verified CA firm adds client, runs filing, wallet debits ₹200
- [ ] Firm A cannot access Firm B data (pen-test or test suite proof)
- [ ] CEO sees B2B revenue on home dashboard

---

## 13. Open decisions (founder to answer during planning)

1. Database vendor: Neon / Supabase / PlanetScale / self-hosted Postgres?  
2. Admin auth: Clerk vs email+OTP custom vs Google SSO only?  
3. Admin hosting: same Next.js app (`/admin`) vs subdomain?  
4. B2B beta: invite-only 10 CAs or open application queue?  
5. Wallet minimum top-up amount?  
6. CA verification: manual only or ICAI API integration (future)?  
7. PostHog: embed dashboards vs build native funnel?  
8. Companion CMS: edit in admin vs continue JSON in git for Phase 1?  
9. Chrome extension passkey: 7 days or 1 day validity?  
10. Who owns daily dashboard review — Ayush only or CEO daily standup?

---

## 14. Reference documents (attach to consultant packet)

| Doc | Path |
|-----|------|
| McKinsey client brief | `docs/MCKINSEY_ENGAGEMENT/01_CLIENT_BRIEF.md` |
| AI CA architecture | `docs/MCKINSEY_ENGAGEMENT/05_AI_CA_ARCHITECTURE.md` |
| Analytics events | `docs/MCKINSEY_ENGAGEMENT/06_ANALYTICS_EVENTS.md` |
| UX research pack | `docs/ux-research/UX_DESIGNER_RESEARCH_PACK_2026.xlsx` |
| Platform QA audit | `docs/PLATFORM_QA_AUDIT.md` |
| Testing bypass (coupons context) | `docs/TESTING_BYPASS.md` |

---

## 15. Implementation master prompt (outline for build phase)

After planning approval, engineering receives a second doc with these sections:

1. Tech stack locked (from §13 decisions)  
2. Repo structure: `frontend/app/admin/*`, `backend/admin_api/*`, shared DB client  
3. Sprint 1 tickets: auth, DB migrate, coupon CRUD, payment webhook → DB  
4. Sprint 2 tickets: dashboard KPIs, PostHog integration, audit log  
5. API contracts: coupon validate, grant companion, admin session list  
6. Test plan: coupon E2E, tenant isolation tests, DPDP deletion E2E  
7. Deploy: `admin.lastminute-itr.vercel.app`, env vars, 2FA setup  

---

## 16. One-line mandate

> **One simple dashboard. Every business activity — B2C revenue, B2B CA partners, compliance, content, engine health — controlled from one place, without code deploys, without breaking "we guide, you file."**

---

*End of master plan v1.0*
