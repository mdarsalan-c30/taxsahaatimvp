import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/rbac";
import { writeAudit } from "@/lib/admin/audit";
import { createCoupon, revokeCoupon } from "@/lib/admin/coupons";
import type { Lane } from "@/lib/db/types";
import type { PlanId } from "@/lib/payments/plans";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "createCoupon");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    code?: string;
    planScope?: "any" | PlanId;
    lane?: Lane;
    discount?: "full" | "amount";
    amountOff?: number;
    maxUses?: number;
    validityDays?: number;
  };

  if (!body.code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const { coupon, error } = await createCoupon({
    code: body.code,
    planScope: body.planScope ?? "any",
    lane: body.lane ?? "b2c",
    discount: body.discount ?? "full",
    amountOff: body.amountOff,
    maxUses: body.maxUses ?? 100,
    validityDays: body.validityDays,
    createdBy: auth.email,
  });

  if (error || !coupon) {
    return NextResponse.json({ error: error ?? "Create failed" }, { status: 400 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "coupon.create",
    entity: "coupons",
    entityId: coupon.id,
    after: coupon,
  });

  return NextResponse.json({ ok: true, coupon });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, "revokeCoupon");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Coupon id required" }, { status: 400 });
  }

  const coupon = await revokeCoupon(body.id);
  if (!coupon) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "coupon.revoke",
    entity: "coupons",
    entityId: coupon.id,
    after: coupon,
  });

  return NextResponse.json({ ok: true, coupon });
}
