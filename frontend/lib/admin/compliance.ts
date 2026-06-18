import { all, genId, insert, update } from "@/lib/db/store";
import type { DeletionRequest, DocumentRow } from "@/lib/db/types";

const RETENTION_MS = 24 * 60 * 60 * 1000;

export async function listDeletionRequests(): Promise<DeletionRequest[]> {
  const rows = await all("deletionRequests");
  return [...rows].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.requestedAt.localeCompare(a.requestedAt);
  });
}

export async function createDeletionRequest(input: {
  sessionId?: string;
  email?: string;
}): Promise<DeletionRequest> {
  const req: DeletionRequest = {
    id: genId("del"),
    sessionId: input.sessionId,
    email: input.email,
    status: "open",
    requestedAt: new Date().toISOString(),
  };
  return insert("deletionRequests", req);
}

export async function completeDeletionRequest(
  id: string
): Promise<DeletionRequest | null> {
  return update("deletionRequests", id, {
    status: "completed",
    completedAt: new Date().toISOString(),
  });
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const rows = await all("documents");
  return [...rows].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export interface RetentionStatus {
  totalTracked: number;
  pendingDeletion: number;
  overdue: number;
  healthy: boolean;
}

/** 24h document-retention health for the compliance monitor. */
export async function retentionStatus(): Promise<RetentionStatus> {
  const rows = await all("documents");
  const now = Date.now();
  let pendingDeletion = 0;
  let overdue = 0;
  for (const d of rows) {
    if (d.deletedAt) continue;
    pendingDeletion += 1;
    if (now - new Date(d.uploadedAt).getTime() > RETENTION_MS) overdue += 1;
  }
  return {
    totalTracked: rows.length,
    pendingDeletion,
    overdue,
    healthy: overdue === 0,
  };
}
