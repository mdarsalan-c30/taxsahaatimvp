import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { PLANS, PLAN_LIST } from "@/lib/payments/plans";
import { LAUNCH_OFFER } from "@/lib/marketing/offer";
import type { AdminCollection, AdminData, PricingConfigRow } from "./types";

/**
 * Admin data store.
 *
 * Phase 1 backing: a single JSON file under `data/` with an in-memory cache,
 * mirroring the pattern in `lib/feedback.ts`. The shapes match `lib/db/schema.sql`
 * exactly, so production can swap this module for a Neon/Postgres-backed
 * implementation without touching callers.
 *
 * On read-only serverless filesystems the file write is best-effort and the
 * cache simply lives in memory for the lifetime of the instance.
 */

function emptyData(): AdminData {
  return {
    adminUsers: [],
    adminRoles: [],
    auditLogs: [],
    pricingConfig: [],
    pricingRevisions: [],
    coupons: [],
    couponRedemptions: [],
    payments: [],
    companionGrants: [],
    sessionEvents: [],
    crmContacts: [],
    crmTasks: [],
    crmNotes: [],
    documents: [],
    deletionRequests: [],
    supportTickets: [],
    tenants: [],
  };
}

let cache: AdminData | null = null;

function storeFilePath(): string {
  return path.join(process.cwd(), "data", "admin-store.json");
}

function seedPricing(data: AdminData): void {
  if (data.pricingConfig.length > 0) return;
  const now = new Date().toISOString();
  data.pricingConfig = PLAN_LIST.map((plan) => {
    const isOfferPlan = plan.id === LAUNCH_OFFER.planId;
    return {
      id: `pc_${plan.id}`,
      planId: plan.id,
      basePriceInr: isOfferPlan ? LAUNCH_OFFER.originalPriceInr : plan.price,
      offerPriceInr: isOfferPlan ? LAUNCH_OFFER.launchPriceInr : null,
      offerEndsAt: isOfferPlan ? LAUNCH_OFFER.launchOfferEndsAt : null,
      publishedAt: now,
    } satisfies PricingConfigRow;
  });
}

async function load(): Promise<AdminData> {
  if (cache) return cache;
  let data = emptyData();
  try {
    const raw = await fs.readFile(storeFilePath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<AdminData>;
    data = { ...data, ...parsed };
  } catch {
    // No file yet (or unreadable) — start from empty and seed.
  }
  seedPricing(data);
  cache = data;
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  try {
    const filePath = storeFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // Read-only filesystem (e.g. serverless) — cache remains in memory.
  }
}

export function genId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/** Read a full collection (newest-first is the caller's responsibility). */
export async function all<K extends AdminCollection>(
  collection: K
): Promise<AdminData[K]> {
  const data = await load();
  return data[collection];
}

/** Append a row and persist. */
export async function insert<K extends AdminCollection>(
  collection: K,
  row: AdminData[K][number]
): Promise<AdminData[K][number]> {
  const data = await load();
  (data[collection] as AdminData[K][number][]).push(row);
  await persist();
  return row;
}

/** Patch the first row matching `id` (rows must have an `id` field). */
export async function update<K extends AdminCollection>(
  collection: K,
  id: string,
  patch: Partial<AdminData[K][number]>
): Promise<AdminData[K][number] | null> {
  const data = await load();
  const rows = data[collection] as Array<{ id: string }>;
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...patch };
  await persist();
  return rows[idx] as AdminData[K][number];
}

/** Remove the first row matching `id`. Returns true if a row was deleted. */
export async function remove<K extends AdminCollection>(
  collection: K,
  id: string
): Promise<boolean> {
  const data = await load();
  const rows = data[collection] as Array<{ id: string }>;
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);
  await persist();
  return true;
}

/** Replace an entire collection (used for bulk seed/import). */
export async function replaceAll<K extends AdminCollection>(
  collection: K,
  rows: AdminData[K]
): Promise<void> {
  const data = await load();
  (data[collection] as AdminData[K]) = rows;
  await persist();
}

/** Test/dev helper — clears the in-memory cache so the next read reloads. */
export function resetCache(): void {
  cache = null;
}

export { PLANS };
