import { all, genId, insert } from "@/lib/db/store";
import type { SessionEvent } from "@/lib/db/types";

const KNOWN_EVENTS = new Set([
  "landing_cta_click",
  "import_started",
  "import_mode_selected",
  "import_estimate_submitted",
  "form16_upload",
  "regime_compare_completion",
  "presubmit_checklist_green",
  "paywall_view",
  "plan_select",
  "payment_success",
  "value_stack_impression",
  "companion_footprint_step_viewed",
  "companion_field_action",
  "companion_field_copy",
  "companion_field_confusion",
  "companion_wizard_completed",
]);

/** Record a consumer funnel/companion event for native KPIs. Best-effort. */
export async function recordSessionEvent(input: {
  sessionId: string;
  eventName: string;
  payload?: Record<string, unknown>;
}): Promise<SessionEvent | null> {
  if (!input.sessionId || !KNOWN_EVENTS.has(input.eventName)) return null;
  const row: SessionEvent = {
    id: genId("evt"),
    sessionId: input.sessionId,
    eventName: input.eventName,
    payload: input.payload,
    ts: new Date().toISOString(),
  };
  return insert("sessionEvents", row);
}

/** Field-error rate (M2) over a window, from companion events. */
export async function fieldErrorRate(rangeDays = 7): Promise<number> {
  const events = await all("sessionEvents");
  const since = Date.now() - rangeDays * 86_400_000;
  const viewed = new Set<string>();
  const confused = new Set<string>();
  for (const e of events) {
    if (new Date(e.ts).getTime() < since) continue;
    if (e.eventName === "companion_footprint_step_viewed") viewed.add(e.sessionId);
    if (e.eventName === "companion_field_confusion") confused.add(e.sessionId);
  }
  if (viewed.size === 0) return 0;
  return Math.round((confused.size / viewed.size) * 1000) / 10;
}
