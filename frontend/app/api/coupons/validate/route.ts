import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/admin/coupons";
import type { PlanId } from "@/lib/payments/plans";

const VALID_PLANS: PlanId[] = ["free", "diy", "ai_smart", "ca"];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: string; planId?: string };
    if (!body.code) {
      return NextResponse.json({ valid: false, reason: "Enter a code" });
    }
    const planId = (body.planId === "ca_review" ? "ca" : body.planId) as PlanId;
    if (!planId || !VALID_PLANS.includes(planId)) {
      return NextResponse.json({ valid: false, reason: "Invalid plan" });
    }

    const result = await validateCoupon(body.code, planId);
    if (!result.valid || !result.coupon) {
      return NextResponse.json({ valid: false, reason: result.reason });
    }
    return NextResponse.json({
      valid: true,
      discount: result.coupon.discount,
      amountOff: result.coupon.amountOff ?? null,
    });
  } catch {
    return NextResponse.json(
      { valid: false, reason: "Validation failed" },
      { status: 500 }
    );
  }
}
