import { NextRequest, NextResponse } from "next/server";
import { recordSessionEvent } from "@/lib/admin/events";

/** Public telemetry sink for native admin KPIs. Best-effort, never throws. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      eventName?: string;
      payload?: Record<string, unknown>;
    };
    if (body.sessionId && body.eventName) {
      await recordSessionEvent({
        sessionId: body.sessionId,
        eventName: body.eventName,
        payload: body.payload,
      });
    }
  } catch {
    // swallow — telemetry must not surface errors to the client
  }
  return NextResponse.json({ ok: true });
}
