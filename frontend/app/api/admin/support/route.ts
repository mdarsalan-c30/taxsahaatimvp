import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/rbac";
import { assignTicket, closeTicket } from "@/lib/admin/support";

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, "manageCrm");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    id?: string;
    action?: "close" | "assign";
  };
  if (!body.id) {
    return NextResponse.json({ error: "Ticket id required" }, { status: 400 });
  }

  const ticket =
    body.action === "assign"
      ? await assignTicket(body.id, auth.email)
      : await closeTicket(body.id);

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ticket });
}
