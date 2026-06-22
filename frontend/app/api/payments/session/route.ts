import { NextRequest, NextResponse } from "next/server";
import { hasServerCompanionAccess } from "@/lib/payments/access";
import { isPaymentBypassEnabled } from "@/lib/payments/bypass";
import { getPaymentSessionFromRequest } from "@/lib/payments/sessionRequest";
import {
  PAYMENT_SESSION_COOKIE,
  paymentSessionCookieOptions,
} from "@/lib/payments/session";
import { all } from "@/lib/db/store";

export async function GET(request: NextRequest) {
  if (isPaymentBypassEnabled()) {
    return NextResponse.json({
      verified: true,
      planId: "ai_smart",
      companionAccess: true,
      mock: true,
      bypass: true,
    });
  }

  const session = getPaymentSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ verified: false });
  }

  let passkey: string | undefined;
  let expiresAt: string | null | undefined;
  
  if (session.sessionId) {
    try {
      const grants = await all("companionGrants");
      const match = grants.find((g) => g.sessionId === session.sessionId);
      if (match) {
        passkey = match.passkey;
        expiresAt = match.expiresAt;
      }
    } catch (err) {
      console.error("Failed to fetch companionGrants:", err);
    }
  }

  return NextResponse.json({
    verified: true,
    planId: session.planId,
    orderId: session.orderId,
    paymentId: session.paymentId,
    verifiedAt: session.verifiedAt,
    mock: session.mock,
    companionAccess: hasServerCompanionAccess(session),
    passkey,
    expiresAt,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ cleared: true });
  response.cookies.set(PAYMENT_SESSION_COOKIE, "", {
    ...paymentSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
