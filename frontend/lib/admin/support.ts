import { all, genId, insert, update } from "@/lib/db/store";
import type { SupportTicket } from "@/lib/db/types";

export async function listTickets(): Promise<SupportTicket[]> {
  const rows = await all("supportTickets");
  return [...rows].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.ts.localeCompare(a.ts);
  });
}

export async function createTicket(input: {
  subject: string;
  body?: string;
  sessionId?: string;
  rating?: number;
  tag?: string;
  lane?: "b2c" | "b2b";
}): Promise<SupportTicket> {
  const ticket: SupportTicket = {
    id: genId("tkt"),
    lane: input.lane ?? "b2c",
    sessionId: input.sessionId,
    subject: input.subject,
    body: input.body,
    rating: input.rating,
    tag: input.tag,
    status: "open",
    ts: new Date().toISOString(),
  };
  return insert("supportTickets", ticket);
}

export async function assignTicket(
  id: string,
  assignee: string
): Promise<SupportTicket | null> {
  return update("supportTickets", id, { assignee });
}

export async function closeTicket(id: string): Promise<SupportTicket | null> {
  return update("supportTickets", id, { status: "closed" });
}
