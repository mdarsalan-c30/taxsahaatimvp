import { LAUNCH_OFFER } from "@/lib/marketing/offer";
import { formatPlanPriceLabel } from "@/lib/marketing/pricing";

export const HERO_HEADLINE = "Running out of time?";

export const HERO_HEADLINE_ACCENT = "Let's get your ITR done right.";

export const HERO_EMOTIONAL_HOOK =
  "Drop your Form 16 here, and we'll do the heavy lifting. We catch hidden mismatches, find your best legal tax savings, and give you a simple screen-by-screen guide to confidently file on the official government portal.";

export const HERO_TRUST_DISCLAIMER =
  "Free tax estimate. No credit card required. Usually takes under 15 minutes.";

export const HERO_TRUST_BADGES = [
  { icon: "🛡️", label: "100% Private & Secure" },
  { icon: "✅", label: "Strictly Legal Tax Savings" },
  { icon: "🏛️", label: "You File on Gov Portal" },
] as const;

/** @deprecated Use HERO_TRUST_BADGES in TrustBar instead */
export const HERO_TRUST_LINE =
  "100% Private & Secure · Strictly Legal Tax Savings · You File on Gov Portal";

export const HERO_CTAS = {
  uploadForm16: {
    label: "Upload Form 16",
    href: "/file/import/documents?source=form16",
  },
  startFiling: {
    label: `Start filing for ${formatPlanPriceLabel(LAUNCH_OFFER.launchPriceInr)}`,
    href: "/file/checkout/plans?plan=ai_smart",
  },
  howItWorks: {
    label: "See how it works",
    href: "#how-it-works",
  },
  freeEstimate: {
    label: "Start my free estimate",
    href: "/file/onboarding/eligibility?step=about-you",
  },
} as const;

export const B2B_PROFESSIONALS = {
  navLabel: "For Tax Professionals",
  headline: "Scale your practice this tax season.",
  subheadline:
    "Get the same powerful mismatch engine and optimization tools at wholesale pricing. File for 10 or 100 clients, set your own fees, and save hours per return.",
  cta: "Create a Partner Account",
  benefits: [
    "Wholesale pricing per client return — charge your clients what you choose",
    "Bulk filing workspace with mismatch checks and regime compare for every client",
    "Same screen-by-screen portal guide your clients trust, built for CA workflows",
    "Dedicated partner verification and wallet for high-volume seasons",
  ],
} as const;

export const PRICING_SECTION = {
  eyebrow: "Pricing",
  headline: "Pay to unlock your portal guide",
  subhead:
    "Start free with estimates. Pay only to unlock your personalized incometax.gov.in walkthrough — you still file and e-verify yourself.",
  helperLine:
    "Prices in ₹ · Secure Razorpay checkout · We never store card details · Your files stay on the portal after you submit",
} as const;

export const PAYMENT_COPY = {
  secureLine: "UPI / card via Razorpay · Secure payment · No card storage on our servers",
  portalLine:
    "Payment unlocks your step-by-step portal guide — you copy values into incometax.gov.in yourself.",
  filesLine: "After filing, your return and acknowledgements live on the government portal.",
} as const;

export const OFFER_COPY = {
  pill: `Launch offer: ${formatPlanPriceLabel(LAUNCH_OFFER.launchPriceInr)}`,
  countdownPrefix: "Offer ends in",
  expired: "Launch offer ended",
} as const;

export const FINAL_CTA = {
  headline: "Ready before the deadline?",
  subhead:
    "Import your documents, review eligible deductions, and unlock your portal guide when you're confident.",
  primary: HERO_CTAS.startFiling.label,
  secondary: "Start free estimate",
} as const;
