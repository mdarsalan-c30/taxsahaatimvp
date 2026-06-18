import Link from "next/link";
import { listContacts, STAGE_LABEL } from "@/lib/admin/crm";
import { listDocuments } from "@/lib/admin/compliance";
import { Card, EmptyState, PageHeader, Pill } from "../../_components/ui";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const [contacts, documents] = await Promise.all([
    listContacts(),
    listDocuments(),
  ]);
  const failures = documents.filter((d) => d.parseStatus === "failed");

  return (
    <div>
      <PageHeader
        title="Sessions"
        subtitle="Privacy-safe session list — pseudonymous identifiers only"
      />

      {failures.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">
            Parse failures
          </h2>
          <ul className="space-y-1 text-sm text-amber-800">
            {failures.slice(0, 20).map((d) => (
              <li key={d.id}>
                {d.connector ?? "document"} · {d.sessionId?.slice(0, 12) ?? "—"} ·{" "}
                {d.error ?? "parse failed"}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {contacts.length === 0 ? (
        <EmptyState message="No sessions recorded yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {["Session", "Stage", "Last seen", "Events"].map((h) => (
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
              {contacts.slice(0, 200).map((c) => (
                <tr key={c.contactId} className="border-b border-border/60">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/crm/${encodeURIComponent(c.sessionId)}`}
                      className="text-primary hover:underline"
                    >
                      {c.sessionId.slice(0, 12)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone="blue">{STAGE_LABEL[c.stage]}</Pill>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.lastSeen).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c.eventCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
