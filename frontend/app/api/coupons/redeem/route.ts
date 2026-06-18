import { NextRequest, NextResponse } from "next/server";
import { hashIp, recordRedemption, validateCoupon } from "@/lib/admin/coupons";
import {
  buildPaymentSessionPayload,
  createPaymentSessionToken,
  paymentSessionCookieOptions,
  PAYMENT_SESSION_COOKIE,
} from "@/lib/payments/session";
import type { PlanId } from "@/lib/payments/plans";

const VALID_PLANS: PlanId[] = ["free", "diy", "ai_smart", "ca"];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      code?: string;
      planId?: string;
      sessionId?: string;
    };
    if (!body.code) {
      return NextResponse.json({ error: "Enter a code" }, { status: 400 });
    }
    const planId = (body.planId === "ca_review" ? "ca" : body.planId) as PlanId;
    if (!planId || !VALID_PLANS.includes(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const result = await validateCoupon(body.code, planId);
    if (!result.valid || !result.coupon) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    // Amount-off coupons are applied at Razorpay checkout, not redeemed here.
    if (result.coupon.discount === "amount") {
      return NextResponse.json({
        unlocked: false,
        discount: "amount",
        amountOff: result.coupon.amountOff ?? 0,
      });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await recordRedemption(result.coupon, {
      sessionId: body.sessionId,
      ipHash: hashIp(ip),
      planId,
    });

    const response = NextResponse.json({ unlocked: true, planId });
    const token = createPaymentSessionToken(
      buildPaymentSessionPayload({
        planId,
        orderId: `order_coupon_${Date.now()}`,
        paymentId: `pay_coupon_${result.coupon.code}`,
        mock: true,
      })
    );
    response.cookies.set(
      PAYMENT_SESSION_COOKIE,
      token,
      paymentSessionCookieOptions()
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Redemption failed" }, { status: 500 });
  }
}
