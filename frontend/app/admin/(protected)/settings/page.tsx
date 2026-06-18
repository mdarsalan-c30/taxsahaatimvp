import { listAudit } from "@/lib/admin/audit";
import { getAdminSession, PERMISSIONS } from "@/lib/admin/rbac";
import { getAdminUsers } from "@/lib/admin/auth";
import { Card, EmptyState, PageHeader, Pill } from "../../_components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getAdminSession();
  const canViewAudit =
    session?.role === "ceo" || session?.role === "engineering";

  const [audit, users] = await Promise.all([
    canViewAudit ? listAudit(100) : Promise.resolve([]),
    Promise.resolve(getAdminUsers()),
  ]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Team, roles, and audit log" />

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Team</h2>
        {users.length === 0 ? (
          <EmptyState message="No admin users configured. Set the ADMIN_USERS env var." />
        ) : (
          <ul className="space-y-2 text-sm">
            {users.map((u) => (
              <li key={u.email} className="flex items-center justify-between">
                <span>{u.email}</span>
                <Pill tone="blue">{u.role}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Permissions matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  Action
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  Allowed roles
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSIONS).map(([action, roles]) => (
                <tr key={action} className="border-b border-border/50">
                  <td className="px-3 py-2 font-mono text-xs">{action}</td>
                  <td className="px-3 py-2">{roles.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold">Audit log</h2>
      {!canViewAudit ? (
        <EmptyState message="Audit log is visible to CEO and engineering roles." />
      ) : audit.length === 0 ? (
        <EmptyState message="No audited actions yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {["When", "Admin", "Action", "Entity"].map((h) => (
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
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-border/60">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.ts).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">{a.adminEmail}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
                  <td className="px-4 py-3">
                    {a.entity}
                    {a.entityId ? ` · ${a.entityId.slice(0, 10)}` : ""}
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
