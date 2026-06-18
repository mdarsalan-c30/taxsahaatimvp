import {
  computeKpis,
  engagementSummary,
  journeyMap,
  screenFailures,
} from "@/lib/admin/metrics";
import { fieldErrorRate } from "@/lib/admin/events";
import { Card, PageHeader, Pill, SetupBanner } from "../../_components/ui";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const embedUrl = process.env.NEXT_PUBLIC_POSTHOG_EMBED_FUNNEL;
  const posthogConfigured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

  const [kpis, errorRate, engagement, journey, failures] = await Promise.all([
    computeKpis(7),
    fieldErrorRate(7),
    engagementSummary(7),
    journeyMap(7),
    screenFailures(7),
  ]);

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Funnel and companion analytics"
      />

      {!posthogConfigured && (
        <SetupBanner
          title="PostHog is not configured"
          body="Set NEXT_PUBLIC_POSTHOG_KEY to embed dashboards. Until then, the cards below use counts computed from the native session_events store."
        />
      )}

      {embedUrl ? (
        <Card className="p-0">
          <iframe
            src={embedUrl}
            title="PostHog funnel"
            className="h-[600px] w-full rounded-xl"
          />
        </Card>
      ) : (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">Native fallback (7d)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.key} className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  {k.label}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {k.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            To embed live PostHog dashboards, set{" "}
            <code className="rounded bg-muted px-1">
              NEXT_PUBLIC_POSTHOG_EMBED_FUNNEL
            </code>{" "}
            to a shared dashboard URL.
          </p>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="mb-4 text-sm font-semibold">Audience (7d)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Unique users", value: engagement.uniqueUsers },
            { label: "Unique today", value: engagement.uniqueToday },
            { label: "Started filing", value: engagement.starts },
            { label: "Returning", value: engagement.returningUsers },
            { label: "Avg screens / user", value: engagement.avgScreensPerUser },
          ].map((a) => (
            <div key={a.label}>
              <p className="text-2xl font-semibold tabular-nums">
                {a.value.toLocaleString("en-IN")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 text-sm font-semibold">
          Screen-by-screen journey (7d)
        </h2>
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
      </Card>

      <Card className="mt-6">
        <h2 className="mb-1 text-sm font-semibold">Where users get stuck (7d)</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Field confusion, help requests, and document parse failures by screen.
        </p>
        {failures.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No friction signals recorded in this window.
          </p>
        ) : (
          <ul className="space-y-2">
            {failures.map((f) => (
              <li
                key={f.key}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-foreground">{f.screen}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {f.signal}
                  </span>
                </span>
                <Pill tone="rose">{f.count}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <p className="text-xs uppercase text-muted-foreground">
          Field-error rate (M2)
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{errorRate}%</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Share of companion users who hit at least one field confusion event.
        </p>
      </Card>
    </div>
  );
}
