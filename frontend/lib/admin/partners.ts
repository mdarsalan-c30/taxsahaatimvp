import { all, genId, insert, update } from "@/lib/db/store";
import type { Tenant, TenantStatus } from "@/lib/db/types";

export async function listTenants(status?: TenantStatus): Promise<Tenant[]> {
  const rows = await all("tenants");
  const filtered = status ? rows.filter((t) => t.status === status) : rows;
  return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createApplication(input: {
  firmName: string;
  applicantName?: string;
  icaiNo?: string;
  email?: string;
  passwordHash?: string;
  city?: string;
}): Promise<Tenant> {
  const tenant: Tenant = {
    id: genId("ten"),
    firmName: input.firmName,
    applicantName: input.applicantName,
    icaiNo: input.icaiNo,
    email: input.email,
    passwordHash: input.passwordHash,
    city: input.city,
    status: "pending",
    walletBalance: 0,
    createdAt: new Date().toISOString(),
  };
  return insert("tenants", tenant);
}

/** Approve, reject, or suspend a CA firm. Gates all B2B access. */
export async function reviewTenant(input: {
  id: string;
  decision: TenantStatus;
  reviewer: string;
  reason?: string;
}): Promise<Tenant | null> {
  return update("tenants", input.id, {
    status: input.decision,
    reviewedBy: input.reviewer,
    reviewReason: input.reason,
  });
}
