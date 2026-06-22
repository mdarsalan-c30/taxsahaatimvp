import crypto from "crypto";
import type { PlanId } from "./plans";

export const PAYMENT_SESSION_COOKIE = "itr_payment_session";

/** Session lifetime — 30 days */
export const PAYMENT_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export interface PaymentSessionPayload {
  planId: PlanId;
  orderId: string;
  paymentId: string;
  verifiedAt: number;
  mock: boolean;
  exp: number;
  sessionId?: string;
}

export interface PaymentSessionPublic {
  verified: true;
  planId: PlanId;
  orderId: string;
  paymentId: string;
  verifiedAt: number;
  mock: boolean;
  sessionId?: string;
}

const VALID_PLAN_IDS: PlanId[] = ["free", "diy", "ai_smart", "ca"];

function getSessionSecret(): string {
  const secret =
    process.env.PAYMENT_SESSION_SECRET ?? process.env.RAZORPAY_KEY_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PAYMENT_SESSION_SECRET or RAZORPAY_KEY_SECRET required");
  }
  return "dev-payment-session-secret";
}

function signPayload(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodePayload(payload: PaymentSessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): PaymentSessionPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as PaymentSessionPayload;
    if (
      !parsed ||
      typeof parsed.planId !== "string" ||
      !VALID_PLAN_IDS.includes(parsed.planId) ||
      typeof parsed.orderId !== "string" ||
      typeof parsed.paymentId !== "string" ||
      typeof parsed.verifiedAt !== "number" ||
      typeof parsed.mock !== "boolean" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createPaymentSessionToken(
  input: Omit<PaymentSessionPayload, "exp"> & { exp?: number }
): string {
  const payload: PaymentSessionPayload = {
    ...input,
    exp: input.exp ?? Date.now() + PAYMENT_SESSION_MAX_AGE_SEC * 1000,
  };
  const encoded = encodePayload(payload);
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifyPaymentSessionToken(
  token: string | undefined | null
): PaymentSessionPublic | null {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload || payload.exp < Date.now()) return null;

  return {
    verified: true,
    planId: payload.planId,
    orderId: payload.orderId,
    paymentId: payload.paymentId,
    verifiedAt: payload.verifiedAt,
    mock: payload.mock,
    sessionId: payload.sessionId,
  };
}

export function buildPaymentSessionPayload(input: {
  planId: PlanId;
  orderId: string;
  paymentId: string;
  mock: boolean;
  sessionId?: string;
}): Omit<PaymentSessionPayload, "exp"> {
  return {
    planId: input.planId,
    orderId: input.orderId,
    paymentId: input.paymentId,
    verifiedAt: Date.now(),
    mock: input.mock,
    sessionId: input.sessionId,
  };
}

export function paymentSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PAYMENT_SESSION_MAX_AGE_SEC,
  };
}
