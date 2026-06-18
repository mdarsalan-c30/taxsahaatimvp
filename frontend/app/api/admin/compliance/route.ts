import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/rbac";
import { writeAudit } from "@/lib/admin/audit";
import { completeDeletionRequest } from "@/lib/admin/compliance";

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, "deleteUserData");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Request id required" }, { status: 400 });
  }

  const req = await completeDeletionRequest(body.id);
  if (!req) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "dpdp.delete_complete",
    entity: "deletion_requests",
    entityId: req.id,
    after: req,
  });

  return NextResponse.json({ ok: true, request: req });
}
