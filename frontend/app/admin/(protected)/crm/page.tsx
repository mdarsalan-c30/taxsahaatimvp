import Link from "next/link";
import {
  listContacts,
  listTasks,
  pipelineCounts,
  STAGE_LABEL,
  STAGE_ORDER,
} from "@/lib/admin/crm";
import { Card, EmptyState, PageHeader, Pill } from "../../_components/ui";
import { AddTaskForm, CompleteTaskButton } from "./CrmClient";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const [counts, contacts, tasks] = await Promise.all([
    pipelineCounts(),
    listContacts(),
    listTasks(),
  ]);

  return (
    <div>
      <PageHeader
        title="CRM"
        subtitle="B2C pipeline derived from session events, with notes and tasks"
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STAGE_ORDER.map((stage) => (
          <Card key={stage} className="p-3 text-center">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">
              {STAGE_LABEL[stage]}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {counts[stage]}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Contacts</h2>
          {contacts.length === 0 ? (
            <EmptyState message="No contacts yet. They appear as sessions generate funnel events." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    {["Session", "Email", "Stage", "Last seen", "Events"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 100).map((c) => (
                    <tr key={c.contactId} className="border-b border-border/60">
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link
                          href={`/admin/crm/${encodeURIComponent(c.sessionId)}`}
                          className="text-primary hover:underline"
                        >
                          {c.sessionId.slice(0, 12)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.email ?? "—"}
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

        <div>
          <h2 className="mb-3 text-sm font-semibold">Tasks</h2>
          <Card>
            <AddTaskForm />
            <ul className="mt-4 space-y-2">
              {tasks.length === 0 ? (
                <li className="text-sm text-muted-foreground">No tasks yet.</li>
              ) : (
                tasks.slice(0, 25).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span
                      className={
                        t.status === "done"
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }
                    >
                      {t.title}
                    </span>
                    {t.status === "open" && <CompleteTaskButton id={t.id} />}
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
