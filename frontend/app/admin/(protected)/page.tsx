import Link from "next/link";
import {
  actionInbox,
  computeKpis,
  engagementSummary,
  journeyMap,
  revenueSeries,
  screenFailures,
} from "@/lib/admin/metrics";
import { Card, KpiCard, PageHeader, Pill } from "../_components/ui";

export const dynamic = "force-dynamic";

const KPI_LINKS: Record<string, string> = {
  paid: "/admin/payments",
  revenue: "/admin/payments",
  issues: "/admin/sessions",
  starts: "/admin/crm",
  traffic: "/admin/analytics",
  companion: "/admin/analytics",
};

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const rangeDays = range === "1" ? 1 : 7;

  const [kpis, journey, inbox, revenue, engagement, failures] =
    await Promise.all([
      computeKpis(rangeDays),
      journeyMap(rangeDays),
      actionInbox(),
      revenueSeries(30),
      engagementSummary(rangeDays),
      screenFailures(rangeDays),
    ]);

  const hasData = kpis.some((k) => k.raw > 0);
  const maxRevenue = Math.max(1, ...revenue.map((p) => p.b2c + p.b2b));
  const rangeLabel = rangeDays === 1 ? "today" : `${rangeDays}d`;

  const audience = [
    {
      key: "unique",
      label: `Unique users (${rangeLabel})`,
      value: engagement.uniqueUsers.toLocaleString("en-IN"),
    },
    {
      key: "today",
      label: "Unique users today",
      value: engagement.uniqueToday.toLocaleString("en-IN"),
    },
    {
      key: "starts",
      label: "Started filing",
      value: engagement.starts.toLocaleString("en-IN"),
    },
    {
      key: "returning",
      label: "Returning",
      value: engagement.returningUsers.toLocaleString("en-IN"),
    },
    {
      key: "depth",
      label: "Avg screens / user",
      value: engagement.avgScreensPerUser.toLocaleString("en-IN"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Home"
        subtitle="Operations command center"
        actions={
          <div className="flex gap-1 rounded-lg border border-border bg-card p-0.5 text-sm">
            <Link
              href="/admin?range=1"
              className={`rounded-md px-3 py-1 ${rangeDays === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Today
            </Link>
            <Link
              href="/admin?range=7"
              className={`rounded-md px-3 py-1 ${rangeDays === 7 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              7d
            </Link>
          </div>
        }
      />

      {!hasData && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">No activity recorded yet</p>
          <p className="mt-1">
            KPI cards count events captured server-side (payments, coupon
            unlocks, and beaconed funnel events). Configure PostHog for full
            traffic and funnel analytics, or wait for live traffic to populate
            these counts.
          </p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            href={KPI_LINKS[kpi.key]}
          />
        ))}
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Audience</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {audience.map((a) => (
            <div key={a.key}>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {a.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Screen-by-screen journey ({rangeLabel})
            </h2>
            <span className="text-xs text-muted-foreground">
              count · % of landing · drop from previous
            </span>
          </div>
          <div className="space-y-1.5">
            {journey.map((step) => (
              <div key={step.key} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs text-muted-foreground">
                  {step.label}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className={`h-full rounded ${step.isBiggestDrop ? "bg-amber-500" : "bg-primary"}`}
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-foreground">
                  {step.count}
                </span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {step.pct}%
                </span>
                <span
                  className={`w-20 shrink-0 text-right text-xs tabular-nums ${
                    step.dropFromPrev > 0 ? "text-rose-600" : "text-muted-foreground"
                  }`}
                >
                  {step.dropFromPrev > 0
                    ? `−${step.dropFromPrev} (${step.dropPct}%)`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The <span className="text-amber-600">amber bar</span> marks the biggest
            single drop-off — the screen losing the most users.
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Action inbox
          </h2>
          <ul className="space-y-2">
            {inbox.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm transition hover:border-primary/40"
                >
                  <span className="text-foreground">{item.label}</span>
                  <Pill tone={item.count > 0 ? "amber" : "gray"}>
                    {item.count}
                  </Pill>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">
          Where users get stuck ({rangeLabel})
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Friction signals by screen — field confusion, help requests, and
          document parse failures.
        </p>
        {failures.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No friction signals recorded in this window.
          </p>
        ) : (
          <ul className="space-y-2">
            {failures.map((f) => (
              <li key={f.key}>
                <Link
                  href={f.href}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm transition hover:border-primary/40"
                >
                  <span>
                    <span className="font-medium text-foreground">{f.screen}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {f.signal}
                    </span>
                  </span>
                  <Pill tone="rose">{f.count}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Revenue — last 30 days
        </h2>
        <div className="flex h-32 items-end gap-0.5">
          {revenue.map((p) => (
            <div
              key={p.date}
              className="flex-1 rounded-t bg-primary/70"
              style={{
                height: `${Math.round(((p.b2c + p.b2b) / maxRevenue) * 100)}%`,
                minHeight: p.b2c + p.b2b > 0 ? "4px" : "0",
              }}
              title={`${p.date}: ₹${p.b2c + p.b2b}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
