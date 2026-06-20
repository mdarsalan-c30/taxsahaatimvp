import type { PlanId } from "@/lib/filing/types";

export type { PlanId };

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  recommended?: boolean;
  comingSoon?: boolean;
  comingSoonFeatures?: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "₹0",
    description: "Estimate and readiness checklist",
    features: [
      "Tax estimate",
      "ITR form recommendation",
      "Filing checklist",
    ],
  },
  diy: {
    id: "diy",
    name: "DIY",
    price: 499,
    priceLabel: "₹499",
    description: "Guided self-filing for salaried returns",
    features: [
      "Form 16 import",
      "Step-by-step wizard",
      "Pre-submit checks",
      "Gov portal companion guide",
    ],
  },
  ai_smart: {
    id: "ai_smart",
    name: "AI Smart",
    price: 349,
    priceLabel: "₹349",
    description: "Smart mismatch detection & tax optimizer",
    recommended: true,
    features: [
      "Everything in DIY",
      "AIS / 26AS mismatch detection",
      "Old vs new regime comparison",
      "Personalized tax savings suggestions",
    ],
  },
  ca: {
    id: "ca",
    name: "CA Review",
    price: 2499,
    priceLabel: "₹2,499",
    description: "Optional CA review before you file on incometax.gov.in — launching soon",
    comingSoon: true,
    comingSoonFeatures: ["Reviewed by a verified CA", "48-hour turnaround"],
    features: [
      "Everything in AI Smart",
      "Reviewed by a verified CA",
      "Zero-notice risk review",
      "48-hour turnaround",
    ],
  },
};

export const PLAN_LIST: Plan[] = [
  PLANS.free,
  PLANS.diy,
  PLANS.ai_smart,
  PLANS.ca,
];

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}
