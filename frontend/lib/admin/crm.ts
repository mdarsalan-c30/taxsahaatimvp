import { all, genId, insert, update } from "@/lib/db/store";
import type {
  CrmNote,
  CrmStage,
  CrmTask,
  SessionEvent,
  SupportTicket,
} from "@/lib/db/types";

export const STAGE_ORDER: CrmStage[] = [
  "lead",
  "started",
  "active",
  "checkout",
  "won",
  "companion",
  "support",
];

export const STAGE_LABEL: Record<CrmStage, string> = {
  lead: "Lead",
  started: "Started",
  active: "Active",
  checkout: "Checkout",
  won: "Won",
  companion: "Companion",
  support: "Support",
};

const EVENT_STAGE: Record<string, CrmStage> = {
  landing_cta_click: "lead",
  import_started: "started",
  import_mode_selected: "active",
  import_estimate_submitted: "active",
  form16_upload: "active",
  regime_compare_completion: "active",
  presubmit_checklist_green: "active",
  companion_footprint_step_viewed: "active",
  paywall_view: "checkout",
  plan_select: "checkout",
  value_stack_impression: "checkout",
  payment_success: "won",
  companion_wizard_completed: "companion",
};

export interface CrmContactView {
  contactId: string;
  sessionId: string;
  email?: string;
  stage: CrmStage;
  lastSeen: string;
  eventCount: number;
}

function maskEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  return `${name.slice(0, 1)}***@${domain}`;
}

async function buildContacts(): Promise<Map<string, CrmContactView>> {
  const [events, tickets] = await Promise.all([
    all("sessionEvents"),
    all("supportTickets"),
  ]);
  const map = new Map<string, CrmContactView>();

  for (const e of events) {
    const stage = EVENT_STAGE[e.eventName];
    const existing = map.get(e.sessionId);
    const email = (e.payload?.email as string | undefined) ?? existing?.email;
    if (!existing) {
      map.set(e.sessionId, {
        contactId: e.sessionId,
        sessionId: e.sessionId,
        email,
        stage: stage ?? "lead",
        lastSeen: e.ts,
        eventCount: 1,
      });
      continue;
    }
    existing.eventCount += 1;
    if (e.ts > existing.lastSeen) existing.lastSeen = e.ts;
    if (email) existing.email = email;
    if (stage && STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(existing.stage)) {
      existing.stage = stage;
    }
  }

  for (const t of tickets) {
    if (t.status !== "open" || !t.sessionId) continue;
    const existing = map.get(t.sessionId);
    if (existing) existing.stage = "support";
  }

  return map;
}

export async function listContacts(): Promise<CrmContactView[]> {
  const map = await buildContacts();
  return [...map.values()]
    .map((c) => ({ ...c, email: maskEmail(c.email) }))
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export async function pipelineCounts(): Promise<Record<CrmStage, number>> {
  const map = await buildContacts();
  const counts = Object.fromEntries(
    STAGE_ORDER.map((s) => [s, 0])
  ) as Record<CrmStage, number>;
  for (const c of map.values()) counts[c.stage] += 1;
  return counts;
}

export interface ContactDetail {
  contactId: string;
  sessionId: string;
  email?: string;
  stage: CrmStage;
  timeline: SessionEvent[];
  notes: CrmNote[];
  tasks: CrmTask[];
  tickets: SupportTicket[];
}

export async function contactDetail(
  sessionId: string
): Promise<ContactDetail | null> {
  const [events, notes, tasks, tickets] = await Promise.all([
    all("sessionEvents"),
    all("crmNotes"),
    all("crmTasks"),
    all("supportTickets"),
  ]);
  const timeline = events
    .filter((e) => e.sessionId === sessionId)
    .sort((a, b) => b.ts.localeCompare(a.ts));
  if (timeline.length === 0) return null;

  const map = await buildContacts();
  const view = map.get(sessionId);

  return {
    contactId: sessionId,
    sessionId,
    email: maskEmail(view?.email),
    stage: view?.stage ?? "lead",
    timeline,
    notes: notes
      .filter((n) => n.contactId === sessionId)
      .sort((a, b) => b.ts.localeCompare(a.ts)),
    tasks: tasks
      .filter((t) => t.contactId === sessionId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    tickets: tickets.filter((t) => t.sessionId === sessionId),
  };
}

export async function listTasks(): Promise<CrmTask[]> {
  const tasks = await all("crmTasks");
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function createTask(input: {
  title: string;
  contactId?: string;
  dueAt?: string | null;
  assignee?: string;
}): Promise<CrmTask> {
  const task: CrmTask = {
    id: genId("task"),
    contactId: input.contactId,
    title: input.title,
    dueAt: input.dueAt ?? null,
    status: "open",
    assignee: input.assignee,
    createdAt: new Date().toISOString(),
  };
  return insert("crmTasks", task);
}

export async function completeTask(id: string): Promise<CrmTask | null> {
  return update("crmTasks", id, { status: "done" });
}

export async function addNote(input: {
  contactId: string;
  adminEmail: string;
  body: string;
}): Promise<CrmNote> {
  const note: CrmNote = {
    id: genId("note"),
    contactId: input.contactId,
    adminEmail: input.adminEmail,
    body: input.body,
    ts: new Date().toISOString(),
  };
  return insert("crmNotes", note);
}
