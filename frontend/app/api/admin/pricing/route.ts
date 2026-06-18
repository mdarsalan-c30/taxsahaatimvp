import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/rbac";
import { writeAudit } from "@/lib/admin/audit";
import {
  getPricingConfig,
  snapshotPricing,
  upsertPricingRow,
} from "@/lib/pricing/config";
import type { PlanId } from "@/lib/payments/plans";

const VALID_PLANS: PlanId[] = ["free", "diy", "ai_smart", "ca"];

interface PricingRowInput {
  planId: PlanId;
  basePriceInr: number;
  offerPriceInr?: number | null;
  offerEndsAt?: string | null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "editPricing");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { rows?: PricingRowInput[] };
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: "No pricing rows" }, { status: 400 });
  }

  for (const row of body.rows) {
    if (!VALID_PLANS.includes(row.planId)) {
      return NextResponse.json(
        { error: `Invalid plan: ${row.planId}` },
        { status: 400 }
      );
    }
    if (typeof row.basePriceInr !== "number" || row.basePriceInr < 0) {
      return NextResponse.json(
        { error: `Invalid base price for ${row.planId}` },
        { status: 400 }
      );
    }
    if (
      row.offerPriceInr != null &&
      (row.offerPriceInr < 0 || row.offerPriceInr > row.basePriceInr)
    ) {
      return NextResponse.json(
        { error: `Offer price for ${row.planId} must be 0..base` },
        { status: 400 }
      );
    }
  }

  const before = await getPricingConfig();

  for (const row of body.rows) {
    await upsertPricingRow({
      planId: row.planId,
      basePriceInr: row.basePriceInr,
      offerPriceInr: row.offerPriceInr ?? null,
      offerEndsAt: row.offerEndsAt ?? null,
    });
  }

  await snapshotPricing(auth.email);
  await writeAudit({
    adminEmail: auth.email,
    action: "pricing.publish",
    entity: "pricing_config",
    before,
    after: await getPricingConfig(),
  });

  revalidatePath("/");
  revalidatePath("/file/checkout/payment");

  return NextResponse.json({ ok: true });
}
