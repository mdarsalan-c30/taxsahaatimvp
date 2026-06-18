import { listTickets } from "@/lib/admin/support";
import { EmptyState, PageHeader, Pill } from "../../_components/ui";
import { TicketActions } from "./SupportClient";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const tickets = await listTickets();

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Feedback and support threads, linked to sessions"
      />

      {tickets.length === 0 ? (
        <EmptyState message="No support tickets yet." />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{t.subject}</p>
                  {t.body && (
                    <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.sessionId ? `Session ${t.sessionId.slice(0, 12)} · ` : ""}
                    {new Date(t.ts).toLocaleString("en-IN")}
                    {t.assignee ? ` · ${t.assignee}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Pill tone={t.status === "open" ? "amber" : "gray"}>
                    {t.status}
                  </Pill>
                  <TicketActions id={t.id} status={t.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
