import { listAudit } from "@/lib/admin/audit";
import { canAsync, getAdminSession } from "@/lib/admin/rbac";
import { listEffectiveUsers, listRoles } from "@/lib/admin/users";
import { PERMISSION_KEYS, PERMISSION_LABELS } from "@/lib/admin/permissions";
import { Card, EmptyState, PageHeader, SetupBanner } from "../../_components/ui";
import { TeamManager } from "./TeamManager";
import { RolesMatrix } from "./RolesMatrix";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getAdminSession();
  const role = session?.role ?? "";

  const [canManageTeam, canViewAudit] = await Promise.all([
    canAsync(role, "manageTeam"),
    canAsync(role, "viewAudit"),
  ]);

  const [users, roles, audit] = await Promise.all([
    listEffectiveUsers(),
    listRoles(),
    canViewAudit ? listAudit(100) : Promise.resolve([]),
  ]);

  const durable = Boolean(process.env.DATABASE_URL);
  const roleOptions = roles.map((r) => ({ key: r.key, label: r.label }));
  const permissionCatalog = PERMISSION_KEYS.map((k) => ({
    key: k,
    label: PERMISSION_LABELS[k],
  }));

  return (
    <div>
      <PageHeader
        title="Team & roles"
        subtitle="Add admins, assign roles function-by-function, and edit the permission matrix"
      />

      {!durable && (
        <SetupBanner
          title="Changes persist in the app store (not yet a database)"
          body="Users and roles you create here are durable locally and in preview, but on Vercel production the file store resets on redeploy/cold start. Connect Neon Postgres (set DATABASE_URL) for durable production accounts, or keep a bootstrap CEO in the ADMIN_USERS env var."
        />
      )}

      {!canManageTeam && (
        <SetupBanner
          title="Read-only"
          body="Your role can view the team and permission matrix but not edit it. The manageTeam permission is required to make changes."
        />
      )}

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold">Team</h2>
        <TeamManager
          users={users}
          roles={roleOptions}
          canManage={canManageTeam}
          currentEmail={session?.email ?? ""}
        />
      </Card>

      <Card className="mb-6">
        <h2 className="mb-1 text-sm font-semibold">Roles & permissions</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Toggle a cell to grant a permission to a role, then Save that column.
          Built-in roles can be overridden; custom roles can be added for
          function-specific access.
        </p>
        <RolesMatrix
          roles={roles}
          permissionCatalog={permissionCatalog}
          canManage={canManageTeam}
        />
      </Card>

      <h2 className="mb-3 text-sm font-semibold">Audit log</h2>
      {!canViewAudit ? (
        <EmptyState message="Audit log requires the viewAudit permission." />
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
                    {a.entityId ? ` · ${a.entityId.slice(0, 12)}` : ""}
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
