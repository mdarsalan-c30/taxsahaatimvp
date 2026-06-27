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
    name: "Basic",
    price: 0,
    priceLabel: "₹0",
    description: "Perfect for individuals with simple salary structures.",
    features: [
      "Tax estimate",
      "ITR form recommendation",
      "Filing checklist",
    ],
  },
  normal: {
    id: "normal",
    name: "Normal",
    price: 359,
    priceLabel: "₹359",
    description: "For simple salaried users who want AI-guided filing checks.",
    recommended: false,
    features: [
      "Form 16 import & AIS fetch",
      "Basic mismatch check",
      "Gov portal companion guide",
    ],
  },
  pro: {
    id: "pro",
    name: "Advance",
    price: 499,
    priceLabel: "₹499",
    description: "For users who want deeper AI checks, mismatch review, capital gains alerts, and priority companion guidance.",
    recommended: true,
    features: [
      "Everything in Normal",
      "Active AI Companion (Genie)",
      "Detailed mismatch resolution",
      "Capital gains alerts",
    ],
  },
  b2b_20: {
    id: "b2b_20",
    name: "20 Applications",
    price: 5000,
    priceLabel: "₹5,000",
    description: "For CAs & HRs. 20 filing credits.",
    features: ["Assign filings to clients", "Credit wallet", "Bulk dashboard"],
  },
  b2b_40: {
    id: "b2b_40",
    name: "40 Applications",
    price: 9000,
    priceLabel: "₹9,000",
    description: "For CAs & HRs. 40 filing credits.",
    features: ["Assign filings to clients", "Credit wallet", "Bulk dashboard"],
  },
  b2b_100: {
    id: "b2b_100",
    name: "100 Applications",
    price: 15999,
    priceLabel: "₹15,999",
    description: "For CAs & HRs. 100 filing credits.",
    features: ["Assign filings to clients", "Credit wallet", "Bulk dashboard"],
  },
  diy: {
    id: "diy",
    name: "Professional (Legacy)",
    price: 499,
    priceLabel: "₹499",
    description: "Legacy plan.",
    features: [],
  },
  ai_smart: {
    id: "ai_smart",
    name: "AI Smart (Legacy)",
    price: 349,
    priceLabel: "₹349",
    description: "Legacy plan.",
    features: [],
  },
  ca: {
    id: "ca",
    name: "CA Review",
    price: 2499,
    priceLabel: "₹2,499",
    description: "Optional CA review",
    features: [],
  },
};

export const PLAN_LIST: Plan[] = [
  PLANS.free,
  PLANS.normal,
  PLANS.pro,
];

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}
