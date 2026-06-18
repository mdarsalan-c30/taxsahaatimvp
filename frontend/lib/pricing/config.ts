import { all, genId, insert, update } from "@/lib/db/store";
import type { PlanId } from "@/lib/payments/plans";
import { getDisplayPricing } from "@/lib/marketing/pricing";
import type { DisplayPricing } from "@/lib/marketing/pricing";
import type { PricingConfigRow, PricingRevision } from "@/lib/db/types";

/**
 * Single source of truth for effective pricing. Reads admin-published overrides
 * from the store and falls back to the static code constants
 * (`lib/marketing/pricing.ts`) whenever the store is empty or unavailable, so
 * the consumer funnel never breaks.
 */

export async function getPricingConfig(): Promise<PricingConfigRow[]> {
  try {
    return await all("pricingConfig");
  } catch {
    return [];
  }
}

function rowFor(
  rows: PricingConfigRow[],
  planId: PlanId
): PricingConfigRow | undefined {
  return rows.find((r) => r.planId === planId);
}

/** Effective price + offer for one plan, honoring admin overrides. */
export async function getPublishedPricing(
  planId: PlanId,
  now: Date = new Date()
): Promise<DisplayPricing> {
  const rows = await getPricingConfig();
  const row = rowFor(rows, planId);
  if (!row) return getDisplayPricing(planId, now);

  const offerActive =
    row.offerPriceInr != null &&
    row.offerEndsAt != null &&
    now.getTime() < new Date(row.offerEndsAt).getTime();

  if (offerActive) {
    return {
      current: row.offerPriceInr as number,
      original: row.basePriceInr,
      showOffer: true,
    };
  }
  return { current: row.basePriceInr, showOffer: false };
}

/** Authoritative integer price (in INR) for order creation. */
export async function getPublishedPrice(
  planId: PlanId,
  now: Date = new Date()
): Promise<number> {
  return (await getPublishedPricing(planId, now)).current;
}

/** Update the draft pricing rows for one plan (admin, CEO only). */
export async function upsertPricingRow(input: {
  planId: PlanId;
  basePriceInr: number;
  offerPriceInr?: number | null;
  offerEndsAt?: string | null;
}): Promise<PricingConfigRow> {
  const rows = await getPricingConfig();
  const existing = rowFor(rows, input.planId);
  const now = new Date().toISOString();
  if (existing) {
    const updated = await update("pricingConfig", existing.id, {
      basePriceInr: input.basePriceInr,
      offerPriceInr: input.offerPriceInr ?? null,
      offerEndsAt: input.offerEndsAt ?? null,
      publishedAt: now,
    });
    return updated as PricingConfigRow;
  }
  const row: PricingConfigRow = {
    id: `pc_${input.planId}`,
    planId: input.planId,
    basePriceInr: input.basePriceInr,
    offerPriceInr: input.offerPriceInr ?? null,
    offerEndsAt: input.offerEndsAt ?? null,
    publishedAt: now,
  };
  await insert("pricingConfig", row);
  return row;
}

/** Snapshot the current config as an audit revision. */
export async function snapshotPricing(adminEmail: string): Promise<void> {
  const rows = await getPricingConfig();
  const revision: PricingRevision = {
    id: genId("prev"),
    configSnapshot: rows,
    adminEmail,
    ts: new Date().toISOString(),
  };
  await insert("pricingRevisions", revision);
}

export async function listPricingRevisions(): Promise<PricingRevision[]> {
  const rows = await all("pricingRevisions");
  return [...rows].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 50);
}
