import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { PLANS, PLAN_LIST } from "@/lib/payments/plans";
import { LAUNCH_OFFER } from "@/lib/marketing/offer";

const prisma = new PrismaClient();

export function genId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

const modelMap: Record<string, keyof typeof prisma> = {
  adminUsers: "adminUser",
  adminRoles: "adminRole",
  auditLogs: "auditLog",
  pricingConfig: "pricingConfig",
  pricingRevisions: "pricingRevision",
  coupons: "coupon",
  couponRedemptions: "couponRedemption",
  payments: "payment",
  companionGrants: "companionGrant",
  sessionEvents: "sessionEvent",
  crmContacts: "crmContact",
  crmTasks: "crmTask",
  crmNotes: "crmNote",
  documents: "document",
  deletionRequests: "deletionRequest",
  supportTickets: "supportTicket",
  tenants: "tenant",
  b2cUsers: "b2CUser"
};

export async function all<K extends string>(collection: K): Promise<any[]> {
  const modelName = modelMap[collection];
  if (!modelName) throw new Error(`Unknown collection: ${collection}`);
  return (prisma[modelName as any] as any).findMany();
}

export async function insert<K extends string>(collection: K, row: any): Promise<any> {
  const modelName = modelMap[collection];
  if (!modelName) throw new Error(`Unknown collection: ${collection}`);
  
  // Ensure dates are converted properly if they are strings in the old code
  const data = { ...row };
  const dateFields = ["createdAt", "updatedAt", "ts", "uploadedAt", "deletedAt", "requestedAt", "completedAt", "offerEndsAt", "publishedAt", "expiresAt", "dueAt"];
  for (const field of dateFields) {
    if (data[field] && typeof data[field] === "string") {
      data[field] = new Date(data[field]);
    }
  }

  return (prisma[modelName as any] as any).create({ data });
}

export async function update<K extends string>(collection: K, id: string, patch: any): Promise<any> {
  const modelName = modelMap[collection];
  if (!modelName) throw new Error(`Unknown collection: ${collection}`);
  
  const data = { ...patch };
  const dateFields = ["createdAt", "updatedAt", "ts", "uploadedAt", "deletedAt", "requestedAt", "completedAt", "offerEndsAt", "publishedAt", "expiresAt", "dueAt"];
  for (const field of dateFields) {
    if (data[field] && typeof data[field] === "string") {
      data[field] = new Date(data[field]);
    }
  }

  try {
    return await (prisma[modelName as any] as any).update({ where: { id }, data });
  } catch (err) {
    return null;
  }
}

export async function remove<K extends string>(collection: K, id: string): Promise<boolean> {
  const modelName = modelMap[collection];
  if (!modelName) throw new Error(`Unknown collection: ${collection}`);
  
  try {
    await (prisma[modelName as any] as any).delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function replaceAll<K extends string>(collection: K, rows: any[]): Promise<void> {
  const modelName = modelMap[collection];
  if (!modelName) throw new Error(`Unknown collection: ${collection}`);
  
  await (prisma[modelName as any] as any).deleteMany();
  
  const formattedRows = rows.map(row => {
    const data = { ...row };
    const dateFields = ["createdAt", "updatedAt", "ts", "uploadedAt", "deletedAt", "requestedAt", "completedAt", "offerEndsAt", "publishedAt", "expiresAt", "dueAt"];
    for (const field of dateFields) {
      if (data[field] && typeof data[field] === "string") {
        data[field] = new Date(data[field]);
      }
    }
    return data;
  });

  await (prisma[modelName as any] as any).createMany({ data: formattedRows });
}

export function resetCache(): void {}

export { PLANS };
