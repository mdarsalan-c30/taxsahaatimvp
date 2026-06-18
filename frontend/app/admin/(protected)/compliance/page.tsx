import {
  listDeletionRequests,
  retentionStatus,
} from "@/lib/admin/compliance";
import { Card, EmptyState, PageHeader, Pill } from "../../_components/ui";
import { CompleteDeletionButton } from "./ComplianceClient";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const [requests, retention] = await Promise.all([
    listDeletionRequests(),
    retentionStatus(),
  ]);
  const open = requests.filter((r) => r.status === "open");

  return (
    <div>
      <PageHeader
        title="Compliance"
        subtitle="DPDP deletion queue and 24-hour document retention monitor"
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-muted-foreground">
            Open deletions
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {open.length}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted-foreground">
            Docs pending deletion
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {retention.pendingDeletion}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted-foreground">
            Retention status
          </p>
          <p className="mt-1">
            <Pill tone={retention.healthy ? "green" : "red"}>
              {retention.healthy
                ? "Healthy"
                : `${retention.overdue} overdue (>24h)`}
            </Pill>
          </p>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-semibold">DPDP deletion requests</h2>
      {requests.length === 0 ? (
        <EmptyState message="No deletion requests." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {["Requested", "Session", "Email", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.requestedAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.sessionId?.slice(0, 12) ?? "—"}
                  </td>
                  <td className="px-4 py-3">{r.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Pill tone={r.status === "open" ? "amber" : "green"}>
                      {r.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "open" && <CompleteDeletionButton id={r.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
