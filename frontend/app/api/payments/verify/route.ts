import { NextRequest, NextResponse } from "next/server";
import { getPlan, type PlanId } from "@/lib/payments/plans";
import {
  hasRazorpayKeys,
  verifyPaymentSignature,
} from "@/lib/payments/razorpay";
import {
  buildPaymentSessionPayload,
  createPaymentSessionToken,
  paymentSessionCookieOptions,
  PAYMENT_SESSION_COOKIE,
} from "@/lib/payments/session";
import { recordPayment } from "@/lib/admin/payments";
import { recordSessionEvent } from "@/lib/admin/events";
import {
  hashIp,
  recordRedemption,
  validateCoupon,
} from "@/lib/admin/coupons";
import { getPublishedPrice } from "@/lib/pricing/config";

const VALID_PLANS: PlanId[] = ["free", "diy", "ai_smart", "ca"];

/** Best-effort persistence for the admin dashboard — never blocks verification. */
async function persistVerifiedPayment(input: {
  planId: PlanId;
  orderId: string;
  paymentId: string;
  mock: boolean;
  sessionId?: string;
  couponCode?: string;
  ipHash?: string;
}): Promise<void> {
  try {
    const amount = input.orderId.startsWith("order_free_")
      ? 0
      : await getPublishedPrice(input.planId);

    let couponId: string | undefined;
    if (input.couponCode) {
      const result = await validateCoupon(input.couponCode, input.planId);
      if (result.valid && result.coupon?.discount === "amount") {
        await recordRedemption(result.coupon, {
          sessionId: input.sessionId,
          ipHash: input.ipHash,
          planId: input.planId,
        });
        couponId = result.coupon.id;
      }
    }

    await recordPayment({
      amount: couponId ? Math.max(0, amount) : amount,
      plan: input.planId,
      status: "paid",
      source: input.orderId.startsWith("order_free_") ? "free" : "razorpay",
      razorpayOrderId: input.orderId,
      razorpayPaymentId: input.paymentId,
      sessionId: input.sessionId,
      couponId,
    });

    if (input.sessionId) {
      await recordSessionEvent({
        sessionId: input.sessionId,
        eventName: "payment_success",
        payload: { plan_id: input.planId, mock: input.mock },
      });
    }
  } catch {
    // swallow — payment verification must succeed regardless of analytics
  }
}

function resolvePlanId(raw: string | undefined): PlanId | null {
  if (!raw || !VALID_PLANS.includes(raw as PlanId)) return null;
  return raw as PlanId;
}

async function verifiedResponse(input: {
  mock: boolean;
  orderId: string;
  paymentId: string;
  planId: PlanId;
  sessionId?: string;
  couponCode?: string;
  ipHash?: string;
}) {
  await persistVerifiedPayment({
    planId: input.planId,
    orderId: input.orderId,
    paymentId: input.paymentId,
    mock: input.mock,
    sessionId: input.sessionId,
    couponCode: input.couponCode,
    ipHash: input.ipHash,
  });

  const response = NextResponse.json({
    verified: true,
    mock: input.mock,
    orderId: input.orderId,
    paymentId: input.paymentId,
    planId: input.planId,
  });

  const token = createPaymentSessionToken(
    buildPaymentSessionPayload({
      planId: input.planId,
      orderId: input.orderId,
      paymentId: input.paymentId,
      mock: input.mock,
    })
  );

  response.cookies.set(
    PAYMENT_SESSION_COOKIE,
    token,
    paymentSessionCookieOptions()
  );

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      planId?: string;
      mock?: boolean;
      sessionId?: string;
      couponCode?: string;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const ipHash = hashIp(
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    );

    if (!razorpay_order_id) {
      return NextResponse.json(
        { error: "Missing order id" },
        { status: 400 }
      );
    }

    const hasKeys = hasRazorpayKeys();
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction && !hasKeys) {
      return NextResponse.json(
        { error: "Payment verification unavailable" },
        { status: 503 }
      );
    }
    const isMockAllowed = !hasKeys && !isProduction;
    const planId = resolvePlanId(body.planId);

    if (
      isMockAllowed &&
      razorpay_order_id.startsWith("order_mock_")
    ) {
      if (!planId) {
        return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });
      }
      return await verifiedResponse({
        mock: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id ?? `pay_mock_${Date.now()}`,
        planId,
        sessionId: body.sessionId,
        couponCode: body.couponCode,
        ipHash,
      });
    }

    if (razorpay_order_id.startsWith("order_free_")) {
      if (planId && getPlan(planId).price === 0) {
        return await verifiedResponse({
          mock: true,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id ?? `pay_free_${Date.now()}`,
          planId,
          sessionId: body.sessionId,
          ipHash,
        });
      }
      return NextResponse.json(
        { verified: false, error: "Invalid free order" },
        { status: 400 }
      );
    }

    if (!razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment id or signature" },
        { status: 400 }
      );
    }

    if (!hasRazorpayKeys()) {
      return NextResponse.json(
        { error: "Razorpay not configured" },
        { status: 503 }
      );
    }

    const valid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET!
    );

    if (!valid) {
      return NextResponse.json(
        { verified: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json({ error: "Invalid plan id" }, { status: 400 });
    }

    return await verifiedResponse({
      mock: false,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planId,
      sessionId: body.sessionId,
      couponCode: body.couponCode,
      ipHash,
    });
  } catch (error) {
    console.error("verify error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
