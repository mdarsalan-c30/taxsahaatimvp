import { all } from "@/lib/db/store";
import type { SessionEvent } from "@/lib/db/types";

export interface Kpi {
  key: string;
  label: string;
  value: string;
  raw: number;
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  pct: number;
}

export interface RevenuePoint {
  date: string;
  b2c: number;
  b2b: number;
}

function sinceMs(rangeDays: number): number {
  return Date.now() - rangeDays * 86_400_000;
}

function distinctSessions(
  events: SessionEvent[],
  eventName: string,
  since: number
): Set<string> {
  const set = new Set<string>();
  for (const e of events) {
    if (e.eventName === eventName && new Date(e.ts).getTime() >= since) {
      set.add(e.sessionId);
    }
  }
  return set;
}

const FUNNEL_DEF: { key: string; label: string; event: string }[] = [
  { key: "landing", label: "Landing", event: "landing_cta_click" },
  { key: "started", label: "Started", event: "import_started" },
  { key: "checkout", label: "Checkout", event: "paywall_view" },
  { key: "paid", label: "Paid", event: "payment_success" },
  { key: "companion", label: "Companion", event: "companion_wizard_completed" },
];

export async function computeFunnel(rangeDays = 7): Promise<FunnelStep[]> {
  const events = await all("sessionEvents");
  const since = sinceMs(rangeDays);
  const counts = FUNNEL_DEF.map((d) => ({
    ...d,
    count: distinctSessions(events, d.event, since).size,
  }));
  const top = counts[0]?.count ?? 0;
  return counts.map((c) => ({
    key: c.key,
    label: c.label,
    count: c.count,
    pct: top > 0 ? Math.round((c.count / top) * 100) : 0,
  }));
}

function formatInr(n: number): string {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

export async function computeKpis(rangeDays = 7): Promise<Kpi[]> {
  const [events, payments, documents, tickets] = await Promise.all([
    all("sessionEvents"),
    all("payments"),
    all("documents"),
    all("supportTickets"),
  ]);
  const since = sinceMs(rangeDays);

  const traffic = distinctSessions(events, "landing_cta_click", since).size;
  const starts = distinctSessions(events, "import_started", since).size;

  const paidRows = payments.filter(
    (p) =>
      new Date(p.ts).getTime() >= since &&
      (p.status === "paid" || p.status === "granted")
  );
  const paid = paidRows.length;
  const revenue = paidRows.reduce((sum, p) => sum + p.amount, 0);

  const companionViewed = distinctSessions(
    events,
    "companion_footprint_step_viewed",
    since
  ).size;
  const companionDone = distinctSessions(
    events,
    "companion_wizard_completed",
    since
  ).size;
  const companionRate =
    companionViewed > 0
      ? Math.round((companionDone / companionViewed) * 100)
      : 0;

  const failedParses = documents.filter(
    (d) =>
      d.parseStatus === "failed" && new Date(d.uploadedAt).getTime() >= since
  ).length;
  const openTickets = tickets.filter((t) => t.status === "open").length;

  return [
    { key: "traffic", label: "Traffic", value: traffic.toLocaleString("en-IN"), raw: traffic },
    { key: "starts", label: "Starts", value: starts.toLocaleString("en-IN"), raw: starts },
    { key: "paid", label: "Paid", value: paid.toLocaleString("en-IN"), raw: paid },
    { key: "revenue", label: "Revenue", value: formatInr(revenue), raw: revenue },
    { key: "companion", label: "Companion", value: `${companionRate}%`, raw: companionRate },
    {
      key: "issues",
      label: "Issues",
      value: (failedParses + openTickets).toLocaleString("en-IN"),
      raw: failedParses + openTickets,
    },
  ];
}

export async function revenueSeries(days = 30): Promise<RevenuePoint[]> {
  const payments = await all("payments");
  const points: RevenuePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000);
    const key = day.toISOString().slice(0, 10);
    points.push({ date: key, b2c: 0, b2b: 0 });
  }
  const index = new Map(points.map((p) => [p.date, p]));
  for (const p of payments) {
    const key = p.ts.slice(0, 10);
    const point = index.get(key);
    if (!point) continue;
    // B2B payments are tenant-billed; Phase 1A has only B2C, so bucket all to b2c.
    point.b2c += p.amount;
  }
  return points;
}

function distinctSessionsAny(events: SessionEvent[], since: number): Set<string> {
  const set = new Set<string>();
  for (const e of events) {
    if (new Date(e.ts).getTime() >= since) set.add(e.sessionId);
  }
  return set;
}

export interface EngagementSummary {
  uniqueUsers: number;
  uniqueToday: number;
  starts: number;
  returningUsers: number;
  avgScreensPerUser: number;
}

/** Audience snapshot: unique visitors in range, today, and engagement depth. */
export async function engagementSummary(
  rangeDays = 7
): Promise<EngagementSummary> {
  const events = await all("sessionEvents");
  const since = sinceMs(rangeDays);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const unique = distinctSessionsAny(events, since);
  const uniqueToday = distinctSessionsAny(events, startOfToday.getTime());
  const starts = distinctSessions(events, "import_started", since);

  // Sessions seen before the current range = returning.
  const seenBefore = new Set<string>();
  for (const e of events) {
    if (new Date(e.ts).getTime() < since) seenBefore.add(e.sessionId);
  }
  let returning = 0;
  for (const s of unique) if (seenBefore.has(s)) returning += 1;

  const screensPerSession = new Map<string, Set<string>>();
  for (const e of events) {
    if (new Date(e.ts).getTime() < since) continue;
    if (!screensPerSession.has(e.sessionId)) {
      screensPerSession.set(e.sessionId, new Set());
    }
    screensPerSession.get(e.sessionId)!.add(e.eventName);
  }
  let totalScreens = 0;
  for (const set of screensPerSession.values()) totalScreens += set.size;
  const avgScreens =
    unique.size > 0
      ? Math.round((totalScreens / unique.size) * 10) / 10
      : 0;

  return {
    uniqueUsers: unique.size,
    uniqueToday: uniqueToday.size,
    starts: starts.size,
    returningUsers: returning,
    avgScreensPerUser: avgScreens,
  };
}

/** Full screen-by-screen journey in order, mapped to consumer screens. */
const JOURNEY_DEF: { key: string; label: string; event: string }[] = [
  { key: "landing", label: "Landing CTA", event: "landing_cta_click" },
  { key: "import_started", label: "Import started", event: "import_started" },
  { key: "import_mode", label: "Import mode chosen", event: "import_mode_selected" },
  { key: "form16", label: "Form-16 uploaded", event: "form16_upload" },
  { key: "estimate", label: "Estimate submitted", event: "import_estimate_submitted" },
  { key: "regime", label: "Regime compared", event: "regime_compare_completion" },
  { key: "presubmit", label: "Pre-submit ready", event: "presubmit_checklist_green" },
  { key: "paywall", label: "Paywall viewed", event: "paywall_view" },
  { key: "plan_select", label: "Plan selected", event: "plan_select" },
  { key: "paid", label: "Paid", event: "payment_success" },
  { key: "companion", label: "Companion completed", event: "companion_wizard_completed" },
];

export interface JourneyStep {
  key: string;
  label: string;
  count: number;
  pct: number;
  dropFromPrev: number;
  dropPct: number;
  isBiggestDrop: boolean;
}

/** Where users advance and where they fall off, screen by screen. */
export async function journeyMap(rangeDays = 7): Promise<JourneyStep[]> {
  const events = await all("sessionEvents");
  const since = sinceMs(rangeDays);
  const counts = JOURNEY_DEF.map((d) => ({
    ...d,
    count: distinctSessions(events, d.event, since).size,
  }));
  const top = counts[0]?.count ?? 0;

  let biggestDrop = 0;
  const steps: JourneyStep[] = counts.map((c, i) => {
    const prev = i > 0 ? counts[i - 1].count : c.count;
    const dropFromPrev = i > 0 ? Math.max(0, prev - c.count) : 0;
    const dropPct = prev > 0 ? Math.round((dropFromPrev / prev) * 100) : 0;
    if (dropFromPrev > biggestDrop) biggestDrop = dropFromPrev;
    return {
      key: c.key,
      label: c.label,
      count: c.count,
      pct: top > 0 ? Math.round((c.count / top) * 100) : 0,
      dropFromPrev,
      dropPct,
      isBiggestDrop: false,
    };
  });

  if (biggestDrop > 0) {
    const idx = steps.findIndex((s) => s.dropFromPrev === biggestDrop);
    if (idx >= 0) steps[idx].isBiggestDrop = true;
  }
  return steps;
}

export interface ScreenFailure {
  key: string;
  screen: string;
  signal: string;
  count: number;
  href: string;
}

const SCREEN_LABELS: Record<string, string> = {
  income: "Income screen",
  deductions: "Deductions screen",
  house_property: "House property",
  capital_gains: "Capital gains",
  bank: "Bank & TDS",
  review: "Review",
  presubmit: "Pre-submit",
};

function screenLabel(id: string | undefined): string {
  if (!id) return "Companion (unknown screen)";
  return SCREEN_LABELS[id] ?? `Companion · ${id}`;
}

/** Friction map: where individuals get confused or hit failures, by screen. */
export async function screenFailures(rangeDays = 7): Promise<ScreenFailure[]> {
  const [events, documents] = await Promise.all([
    all("sessionEvents"),
    all("documents"),
  ]);
  const since = sinceMs(rangeDays);
  const out: ScreenFailure[] = [];

  // Companion field/screen confusion grouped by screen.
  const confusion = new Map<string, number>();
  for (const e of events) {
    if (e.eventName !== "companion_field_confusion") continue;
    if (new Date(e.ts).getTime() < since) continue;
    const screenId = (e.payload?.screenId as string) ?? undefined;
    const key = screenLabel(screenId);
    confusion.set(key, (confusion.get(key) ?? 0) + 1);
  }
  for (const [screen, count] of confusion) {
    out.push({
      key: `confusion:${screen}`,
      screen,
      signal: "Field confusion / help requests",
      count,
      href: "/admin/analytics",
    });
  }

  // Document parse failures grouped by connector.
  const parse = new Map<string, number>();
  for (const d of documents) {
    if (d.parseStatus !== "failed") continue;
    if (new Date(d.uploadedAt).getTime() < since) continue;
    const key = d.connector ?? "Unknown source";
    parse.set(key, (parse.get(key) ?? 0) + 1);
  }
  for (const [connector, count] of parse) {
    out.push({
      key: `parse:${connector}`,
      screen: `Document import · ${connector}`,
      signal: "Parse failures",
      count,
      href: "/admin/sessions",
    });
  }

  return out.sort((a, b) => b.count - a.count).slice(0, 8);
}

export interface InboxItem {
  key: string;
  label: string;
  count: number;
  href: string;
}

export async function actionInbox(): Promise<InboxItem[]> {
  const [tenants, deletions, documents, tickets] = await Promise.all([
    all("tenants"),
    all("deletionRequests"),
    all("documents"),
    all("supportTickets"),
  ]);
  const since = sinceMs(1);
  return [
    {
      key: "ca",
      label: "CA verifications",
      count: tenants.filter((t) => t.status === "pending").length,
      href: "/admin/partners",
    },
    {
      key: "dpdp",
      label: "DPDP deletions",
      count: deletions.filter((d) => d.status === "open").length,
      href: "/admin/compliance",
    },
    {
      key: "parse",
      label: "Parse failures (24h)",
      count: documents.filter(
        (d) =>
          d.parseStatus === "failed" &&
          new Date(d.uploadedAt).getTime() >= since
      ).length,
      href: "/admin/sessions",
    },
    {
      key: "support",
      label: "Open support tickets",
      count: tickets.filter((t) => t.status === "open").length,
      href: "/admin/support",
    },
  ];
}
