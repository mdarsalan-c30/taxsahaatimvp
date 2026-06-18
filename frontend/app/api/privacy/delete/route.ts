import { NextRequest, NextResponse } from "next/server";
import { createDeletionRequest } from "@/lib/admin/compliance";

/** Public DPDP data-deletion request intake; lands in the compliance queue. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      email?: string;
    };
    if (!body.sessionId && !body.email) {
      return NextResponse.json(
        { error: "Provide a session id or email" },
        { status: 400 }
      );
    }
    const req = await createDeletionRequest({
      sessionId: body.sessionId,
      email: body.email,
    });
    return NextResponse.json({ ok: true, id: req.id });
  } catch {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
