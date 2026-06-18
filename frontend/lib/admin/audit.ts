import { all, genId, insert } from "@/lib/db/store";
import type { AuditLog } from "@/lib/db/types";

/** Record a privileged admin mutation with before/after for DPDP compliance (§3.5). */
export async function writeAudit(input: {
  adminEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}): Promise<AuditLog> {
  const row: AuditLog = {
    id: genId("aud"),
    adminEmail: input.adminEmail,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    before: input.before,
    after: input.after,
    ts: new Date().toISOString(),
  };
  return insert("auditLogs", row);
}

/** Newest-first audit log for the Settings ▸ Audit screen. */
export async function listAudit(limit = 200): Promise<AuditLog[]> {
  const rows = await all("auditLogs");
  return [...rows].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, limit);
}
