import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/rbac";
import { writeAudit } from "@/lib/admin/audit";
import { reviewTenant } from "@/lib/admin/partners";
import type { TenantStatus } from "@/lib/db/types";

const DECISIONS: TenantStatus[] = ["verified", "rejected", "suspended"];

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, "verifyCa");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    id?: string;
    decision?: TenantStatus;
    reason?: string;
  };
  if (!body.id || !body.decision || !DECISIONS.includes(body.decision)) {
    return NextResponse.json(
      { error: "Valid id and decision required" },
      { status: 400 }
    );
  }
  if (body.decision === "rejected" && !body.reason?.trim()) {
    return NextResponse.json(
      { error: "Rejection reason required" },
      { status: 400 }
    );
  }

  const tenant = await reviewTenant({
    id: body.id,
    decision: body.decision,
    reviewer: auth.email,
    reason: body.reason,
  });
  if (!tenant) {
    return NextResponse.json({ error: "Firm not found" }, { status: 404 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: `partner.${body.decision}`,
    entity: "tenants",
    entityId: tenant.id,
    after: tenant,
  });

  return NextResponse.json({ ok: true, tenant });
}
