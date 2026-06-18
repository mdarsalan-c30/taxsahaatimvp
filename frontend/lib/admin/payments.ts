import { all, genId, insert, update } from "@/lib/db/store";
import type { Payment, PaymentSource, PaymentStatus } from "@/lib/db/types";

export async function listPayments(): Promise<Payment[]> {
  const rows = await all("payments");
  return [...rows].sort((a, b) => b.ts.localeCompare(a.ts));
}

export async function recordPayment(input: {
  amount: number;
  plan: string;
  status: PaymentStatus;
  source: PaymentSource;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  sessionId?: string;
  couponId?: string;
}): Promise<Payment> {
  const payment: Payment = {
    id: genId("pay"),
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    amount: input.amount,
    plan: input.plan,
    status: input.status,
    source: input.source,
    sessionId: input.sessionId,
    couponId: input.couponId,
    ts: new Date().toISOString(),
  };
  return insert("payments", payment);
}

export async function refundPayment(
  id: string,
  reason: string
): Promise<Payment | null> {
  return update("payments", id, { status: "refunded", refundReason: reason });
}

export interface PaymentSummary {
  revenue: number;
  paidOrders: number;
  couponUnlocks: number;
}

export async function paymentSummary(): Promise<PaymentSummary> {
  const rows = await all("payments");
  let revenue = 0;
  let paidOrders = 0;
  let couponUnlocks = 0;
  for (const p of rows) {
    if (p.status === "paid") {
      revenue += p.amount;
      paidOrders += 1;
    }
    if (p.source === "coupon" && p.status === "granted") couponUnlocks += 1;
  }
  return { revenue, paidOrders, couponUnlocks };
}
