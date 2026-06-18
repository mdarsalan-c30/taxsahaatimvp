import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/rbac";
import { writeAudit } from "@/lib/admin/audit";
import { refundPayment } from "@/lib/admin/payments";

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, "refundPayment");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { id?: string; reason?: string };
  if (!body.id || !body.reason?.trim()) {
    return NextResponse.json(
      { error: "Payment id and reason are required" },
      { status: 400 }
    );
  }

  const payment = await refundPayment(body.id, body.reason.trim());
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "payment.refund",
    entity: "payments",
    entityId: payment.id,
    after: payment,
  });

  return NextResponse.json({ ok: true, payment });
}
