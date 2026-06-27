export type PlanId = "free" | "normal" | "pro" | "b2b_20" | "b2b_40" | "b2b_100" | "ai_smart" | "ca" | "diy";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
