-- TaxSaathi Admin — canonical Postgres schema (Neon-ready)
-- Source of truth for production. The running app currently uses lib/db/store.ts
-- (file/in-memory) which implements the same shapes; swap to these tables when
-- DATABASE_URL is provisioned. Tenant rule: B2B rows carry tenant_id, B2C rows null.

-- ── Admin & audit ────────────────────────────────────────────────────────────
-- `role` references admin_roles.key (built-in or custom); no enum check so the
-- self-serve Team screen can create custom roles. Disabled users cannot log in.
create table if not exists admin_users (
  id            text primary key,
  email         text unique not null,
  password_hash text not null,
  role          text not null,
  status        text not null default 'active' check (status in ('active','disabled')),
  twofa_enabled boolean not null default false,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Role definitions + editable permission matrix. Built-in roles are seeded from
-- lib/admin/permissions.ts; rows here override built-ins or add custom roles.
create table if not exists admin_roles (
  id          text primary key,
  key         text unique not null,
  label       text not null,
  builtin     boolean not null default false,
  permissions jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists audit_logs (
  id            text primary key,
  admin_email   text not null,
  action        text not null,
  entity        text not null,
  entity_id     text,
  before_json   jsonb,
  after_json    jsonb,
  ts            timestamptz not null default now()
);

-- ── Revenue ops ──────────────────────────────────────────────────────────────
create table if not exists pricing_config (
  id              text primary key,
  plan_id         text not null check (plan_id in ('free','diy','ai_smart','ca')),
  base_price_inr  integer not null,
  offer_price_inr integer,
  offer_ends_at   timestamptz,
  published_at    timestamptz not null default now(),
  unique (plan_id)
);

create table if not exists pricing_revisions (
  id              text primary key,
  config_snapshot jsonb not null,
  admin_email     text not null,
  ts              timestamptz not null default now()
);

create table if not exists coupons (
  id          text primary key,
  code        text unique not null,
  plan_scope  text not null,                          -- 'any' | plan id
  lane        text not null check (lane in ('b2c','b2b','both')),
  discount    text not null default 'full',           -- 'full' | 'amount'
  amount_off  integer,                                -- when discount = 'amount'
  max_uses    integer not null,
  used_count  integer not null default 0,
  status      text not null default 'active' check (status in ('active','revoked')),
  expires_at  timestamptz not null,
  created_by  text,
  created_at  timestamptz not null default now()
);

create table if not exists coupon_redemptions (
  id          text primary key,
  coupon_id   text not null references coupons(id),
  session_id  text,
  tenant_id   text,
  ip_hash     text,
  ts          timestamptz not null default now()
);

create table if not exists payments (
  id                text primary key,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount            integer not null,
  plan              text not null,
  status            text not null,                    -- paid | granted | refunded | failed
  source            text not null,                    -- razorpay | coupon | admin | free
  session_id        text,
  coupon_id         text,
  ts                timestamptz not null default now()
);

create table if not exists companion_grants (
  id          text primary key,
  session_id  text not null,
  source      text not null check (source in ('payment','coupon','admin')),
  plan        text,
  expires_at  timestamptz,
  ts          timestamptz not null default now()
);

-- ── Growth & CRM ─────────────────────────────────────────────────────────────
create table if not exists sessions (
  id            text primary key,                     -- anonymous session id
  email         text,
  lane          text not null default 'b2c',
  itr_form      text,
  plan          text,
  progress_pct  integer not null default 0,
  stage         text not null default 'lead',
  last_step     text,
  last_seen     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create table if not exists session_events (
  id          text primary key,
  session_id  text not null,
  event_name  text not null,
  payload     jsonb,
  ts          timestamptz not null default now()
);

create table if not exists crm_contacts (
  id          text primary key,
  session_id  text,
  tenant_id   text,
  email       text,
  lane        text not null default 'b2c',
  stage       text not null default 'lead',
  assignee    text,
  created_at  timestamptz not null default now()
);

create table if not exists crm_tasks (
  id          text primary key,
  contact_id  text,
  title       text not null,
  due_at      timestamptz,
  status      text not null default 'open' check (status in ('open','done')),
  assignee    text,
  created_at  timestamptz not null default now()
);

create table if not exists crm_notes (
  id          text primary key,
  contact_id  text not null,
  admin_email text not null,
  body        text not null,
  ts          timestamptz not null default now()
);

-- ── Trust & compliance ───────────────────────────────────────────────────────
create table if not exists documents (
  id            text primary key,
  session_id    text,
  connector     text,                                 -- form16 | ais | 26as | cams
  parse_status  text not null,                        -- ok | failed | pending
  error         text,
  uploaded_at   timestamptz not null default now(),
  deleted_at    timestamptz
);

create table if not exists deletion_requests (
  id            text primary key,
  session_id    text,
  email         text,
  status        text not null default 'open' check (status in ('open','completed')),
  requested_at  timestamptz not null default now(),
  completed_at  timestamptz
);

create table if not exists support_tickets (
  id          text primary key,
  lane        text not null default 'b2c',
  session_id  text,
  subject     text not null,
  body        text,
  rating      integer,
  tag         text,
  status      text not null default 'open' check (status in ('open','closed')),
  assignee    text,
  ts          timestamptz not null default now()
);

-- ── B2B (multi-tenant) ───────────────────────────────────────────────────────
create table if not exists tenants (
  id              text primary key,
  firm_name       text not null,
  applicant_name  text,
  icai_no         text,
  city            text,
  status          text not null default 'pending'
                   check (status in ('pending','verified','rejected','suspended')),
  wallet_balance  integer not null default 0,
  reviewed_by     text,
  review_reason   text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_session_events_session on session_events(session_id);
create index if not exists idx_session_events_name on session_events(event_name);
create index if not exists idx_payments_ts on payments(ts);
create index if not exists idx_coupon_redemptions_coupon on coupon_redemptions(coupon_id);
create index if not exists idx_crm_contacts_stage on crm_contacts(stage);
