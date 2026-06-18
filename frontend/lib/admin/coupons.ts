import crypto from "crypto";
import { all, genId, insert, update } from "@/lib/db/store";
import type { PlanId } from "@/lib/payments/plans";
import type {
  Coupon,
  CouponRedemption,
  CompanionGrant,
  Lane,
  Payment,
} from "@/lib/db/types";

const DEFAULT_VALIDITY_DAYS = 30;

export async function listCoupons(): Promise<Coupon[]> {
  const rows = await all("coupons");
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const rows = await all("coupons");
  const normalized = code.trim().toUpperCase();
  return rows.find((c) => c.code === normalized) ?? null;
}

export async function createCoupon(input: {
  code: string;
  planScope: "any" | PlanId;
  lane: Lane;
  discount: "full" | "amount";
  amountOff?: number | null;
  maxUses: number;
  validityDays?: number;
  createdBy: string;
}): Promise<{ coupon?: Coupon; error?: string }> {
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return { error: "Code must be 3-32 chars (A-Z, 0-9, _ or -)" };
  }
  if (await getCouponByCode(code)) {
    return { error: "Coupon code already exists" };
  }
  if (input.discount === "amount" && (!input.amountOff || input.amountOff <= 0)) {
    return { error: "Amount-off coupons need a positive amount" };
  }
  const days = input.validityDays ?? DEFAULT_VALIDITY_DAYS;
  const coupon: Coupon = {
    id: genId("cpn"),
    code,
    planScope: input.planScope,
    lane: input.lane,
    discount: input.discount,
    amountOff: input.discount === "amount" ? input.amountOff : null,
    maxUses: Math.max(1, input.maxUses),
    usedCount: 0,
    status: "active",
    expiresAt: new Date(Date.now() + days * 86_400_000).toISOString(),
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  await insert("coupons", coupon);
  return { coupon };
}

export async function revokeCoupon(id: string): Promise<Coupon | null> {
  return update("coupons", id, { status: "revoked" });
}

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  coupon?: Coupon;
}

/** Stateless validity check used by both the admin and the public checkout. */
export async function validateCoupon(
  code: string,
  planId: PlanId,
  lane: "b2c" | "b2b" = "b2c"
): Promise<CouponValidation> {
  const coupon = await getCouponByCode(code);
  if (!coupon) return { valid: false, reason: "Invalid coupon code" };
  if (coupon.status !== "active") return { valid: false, reason: "Coupon revoked" };
  if (new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, reason: "Coupon expired" };
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: "Coupon fully redeemed" };
  }
  if (coupon.lane !== "both" && coupon.lane !== lane) {
    return { valid: false, reason: "Coupon not valid for this plan" };
  }
  if (coupon.planScope !== "any" && coupon.planScope !== planId) {
    return { valid: false, reason: "Coupon not valid for this plan" };
  }
  return { valid: true, coupon };
}

export function hashIp(ip: string | null | undefined): string {
  return crypto
    .createHash("sha256")
    .update(ip ?? "unknown")
    .digest("hex")
    .slice(0, 16);
}

/** Record a redemption, grant companion access, and log a ₹0 payment row. */
export async function recordRedemption(
  coupon: Coupon,
  input: { sessionId?: string; ipHash?: string; planId: PlanId }
): Promise<void> {
  await update("coupons", coupon.id, { usedCount: coupon.usedCount + 1 });

  const redemption: CouponRedemption = {
    id: genId("red"),
    couponId: coupon.id,
    sessionId: input.sessionId,
    ipHash: input.ipHash,
    ts: new Date().toISOString(),
  };
  await insert("couponRedemptions", redemption);

  if (input.sessionId) {
    const grant: CompanionGrant = {
      id: genId("grant"),
      sessionId: input.sessionId,
      source: "coupon",
      plan: input.planId,
      ts: new Date().toISOString(),
    };
    await insert("companionGrants", grant);
  }

  if (coupon.discount === "full") {
    const payment: Payment = {
      id: genId("pay"),
      amount: 0,
      plan: input.planId,
      status: "granted",
      source: "coupon",
      sessionId: input.sessionId,
      couponId: coupon.id,
      ts: new Date().toISOString(),
    };
    await insert("payments", payment);
  }
}

/** Coupons that have exceeded a redemption threshold from a single ip_hash. */
export async function fraudFlags(
  threshold = 5
): Promise<{ couponId: string; ipHash: string; count: number }[]> {
  const reds = await all("couponRedemptions");
  const counts = new Map<string, number>();
  for (const r of reds) {
    if (!r.ipHash) continue;
    const key = `${r.couponId}::${r.ipHash}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const flags: { couponId: string; ipHash: string; count: number }[] = [];
  for (const [key, count] of counts) {
    if (count >= threshold) {
      const [couponId, ipHash] = key.split("::");
      flags.push({ couponId, ipHash, count });
    }
  }
  return flags;
}
