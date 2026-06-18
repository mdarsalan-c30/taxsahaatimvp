import Link from "next/link";
import { notFound } from "next/navigation";
import { contactDetail, STAGE_LABEL } from "@/lib/admin/crm";
import { Card, EmptyState, PageHeader, Pill } from "../../../_components/ui";
import { AddNoteForm, AddTaskForm, CompleteTaskButton } from "../CrmClient";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionId = decodeURIComponent(id);
  const detail = await contactDetail(sessionId);
  if (!detail) notFound();

  return (
    <div>
      <PageHeader
        title={`Contact ${detail.sessionId.slice(0, 12)}`}
        subtitle="Session timeline, notes, and tasks"
        actions={
          <Link
            href="/admin/crm"
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            ← Back
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Timeline</h2>
            {detail.timeline.length === 0 ? (
              <EmptyState message="No events." />
            ) : (
              <ul className="space-y-2 text-sm">
                {detail.timeline.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className="w-32 shrink-0 text-muted-foreground">
                      {new Date(e.ts).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="font-mono text-xs">{e.eventName}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold">Notes (internal)</h2>
            <AddNoteForm contactId={detail.sessionId} />
            <ul className="mt-4 space-y-2 text-sm">
              {detail.notes.map((n) => (
                <li key={n.id} className="border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">
                    {n.adminEmail} ·{" "}
                    {new Date(n.ts).toLocaleDateString("en-IN")}
                  </span>
                  <p className="text-foreground">{n.body}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold">Properties</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Session</dt>
                <dd className="font-mono text-xs">{detail.sessionId.slice(0, 16)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{detail.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Stage</dt>
                <dd>
                  <Pill tone="blue">{STAGE_LABEL[detail.stage]}</Pill>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold">Tasks</h2>
            <AddTaskForm contactId={detail.sessionId} />
            <ul className="mt-4 space-y-2 text-sm">
              {detail.tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span
                    className={
                      t.status === "done"
                        ? "text-muted-foreground line-through"
                        : ""
                    }
                  >
                    {t.title}
                  </span>
                  {t.status === "open" && <CompleteTaskButton id={t.id} />}
                </li>
              ))}
            </ul>
          </Card>

          {detail.tickets.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold">Support</h2>
              <ul className="space-y-2 text-sm">
                {detail.tickets.map((t) => (
                  <li key={t.id} className="flex justify-between">
                    <span>{t.subject}</span>
                    <Pill tone={t.status === "open" ? "amber" : "gray"}>
                      {t.status}
                    </Pill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
