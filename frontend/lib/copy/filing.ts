import { formatPlanPriceLabel } from "@/lib/marketing/pricing";
import { LAUNCH_OFFER } from "@/lib/marketing/offer";

export const FILING_START = {
  headline: "Start your return",
  welcomeBack: (name: string) => `Welcome back, ${name}`,
  subtitle:
    "Upload Form 16 and AIS. We run proof-based checks, then guide you to file on incometax.gov.in yourself.",
  trustLine: "Lawful optimization · DPDP compliant · Estimate mode by default",
  primaryCta: "Start my return",
  secondaryCta: "Government portal companion",
} as const;

export const FILING_IMPORT = {
  titleDefault: "Let's get your data in. How would you like to start?",
  titleForm16: (name?: string) =>
    name ? `${name}, upload your Form 16` : "Upload your Form 16",
  subtitleDefault:
    "Pick whichever is easiest for you right now. We'll do the heavy math, and you'll get to review everything before it goes to the government.",
  subtitleForm16:
    "Drop your PDF here — we'll read salary and TDS in seconds. You'll confirm every figure before anything goes to the government portal.",
} as const;

export const IMPORT_REVEAL = {
  eyebrow: "Imported from Form 16",
  headline: "Here's what we read so far",
  subhead:
    "These figures came straight from your Form 16. Confirm them, then add AIS and any other income before you compute tax.",
  standardDeductionNote:
    "Standard deduction (₹75,000 new regime / ₹50,000 old) is applied automatically by the tax engine — you don't enter it.",
  // Factual checklist of what a Form 16 alone does NOT cover.
  stillNeeded: [
    {
      id: "ais",
      label: "AIS / 26AS reconciliation",
      detail: "Match TDS and reported income against the ITD statement.",
    },
    {
      id: "other-income",
      label: "Interest, dividends, capital gains",
      detail: "Savings/FD interest, dividends, and any sale of shares or property.",
    },
    {
      id: "other-deductions",
      label: "Deductions outside Part B",
      detail: "80D, 80TTA/80TTB, home-loan interest, donations you can prove.",
    },
  ],
  primaryCta: "Confirm & continue",
  secondaryCta: "Add AIS",
} as const;

export const FILING_REGIME = {
  title: "Your Smart Tax Summary",
  subtitleLoading: "Crunching the numbers to find your best tax regime…",
  subtitleResult: (regime: "old" | "new", savings: string) =>
    `🏆 We recommend the ${regime === "new" ? "New" : "Old"} Regime. Choosing this path saves you ${savings}.`,
  subtitleFallback:
    "We couldn't compute a full comparison yet — check your inputs or continue with rough estimates.",
  savingsLine: (savings: string) =>
    `Choosing this path saves you ${savings} this year.`,
} as const;

export const FILING_INCOME = {
  title: "Here is what we found in your Form 16.",
  subtitle:
    "Take a quick look to ensure everything looks correct. (Don't worry, we'll double-check this against government records later to prevent any refund delays).",
  auditBanner:
    "Our system is double-checking these numbers for accuracy. You will see a full mismatch audit before you pay or file.",
} as const;

export const FILING_DEDUCTIONS = {
  title: "Eligible deductions",
  subtitle: "Only claim deductions that actually happened and you can prove.",
} as const;

export const FILING_COMPANION = {
  title: "Your Personal Filing Guide",
  subtitle:
    "Open incometax.gov.in in another tab. Follow these steps exactly, and copy-paste the numbers we've prepared for you.",
  mismatchWarning:
    "Make sure to fix any red flags in your summary before copying these numbers!",
  paywallHeadline: "Unlock your personalized portal filing guide",
  paywallSubtitle:
    "Get your personalized, step-by-step walkthrough for the official government portal.",
} as const;

export const FILING_REVIEW = {
  title: "Your Final Review",
  subtitle:
    "Let's make sure everything is perfect. We'll track your progress and estimate right here.",
  loadingSubtitle: "Loading your draft…",
  estimateDisclaimer:
    "This is our smart estimate. The government portal will give you the final exact number when you file.",
  estimateLabel: (regime: "old" | "new") =>
    `Estimated Tax (${regime === "new" ? "New" : "Old"} Regime)`,
  actionRequired: (count: number) =>
    `Action Required: ${count} missing item${count === 1 ? "" : "s"}`,
  actionRequiredSubtext:
    "Let's fix these quick gaps before we generate your filing guide.",
  allClear: "Everything looks good so far.",
  emptyImportTitle: "Let's grab your documents",
  emptyImportBody:
    "Upload your Form 16 and AIS, and we'll handle the heavy lifting of data entry and cross-checking.",
  uploadDocumentsCta: "Upload Documents",
} as const;

export const CHECKOUT_PLANS = {
  title: "Ready to file? Unlock your guide.",
  subtitle: FILING_COMPANION.paywallSubtitle,
  progressBlocker:
    "✋ Hold on! Let's resolve your missing documents before you pay. We want to make sure your guide is 100% accurate.",
  planValueNote: "Like having a CA double-check your work, without the hefty fee.",
  nextStep:
    "Pay securely — your portal filing guide unlocks immediately. You file on incometax.gov.in; we never auto-submit to ITD.",
  aiSmartOfferNote: `AI Smart launch offer: ${formatPlanPriceLabel(LAUNCH_OFFER.launchPriceInr)} (was ${formatPlanPriceLabel(LAUNCH_OFFER.originalPriceInr)})`,
} as const;

export const CHECKOUT_PAYMENT = {
  title: "Payment & tax summary",
  subtitle: FILING_COMPANION.paywallSubtitle,
  planLine: (planName: string, price: number) =>
    `${planName} · ${formatPlanPriceLabel(price)}`,
} as const;
