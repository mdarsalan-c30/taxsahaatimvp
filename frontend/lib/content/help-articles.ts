/** Help hub articles — companion journey pillars (not Quicko Save/Pay/File e-file taxonomy). */

export type HelpPillar = "prep" | "reconcile" | "regime" | "portal" | "everify";

export interface HelpArticle {
  slug: string;
  pillar: HelpPillar;
  title: string;
  summary: string;
  /** Where the hub card links. Native articles point at /help/<slug>; a few deep-link into tools/flow. */
  href: string;
  keywords: string[];
  /**
   * Native markdown body rendered at /help/<slug>. When present the article is
   * a real help page (problem → steps on incometax.gov.in → how LastMinute assists).
   * Deep-link cards (e.g. the ITR quiz) omit this.
   */
  body?: string;
}

export const HELP_PILLARS: { id: HelpPillar; label: string; description: string }[] = [
  {
    id: "prep",
    label: "Prep",
    description: "Getting Started: What you need before you open the portal.",
  },
  {
    id: "reconcile",
    label: "Reconcile",
    description: "Fixing Mismatches: Solving Form 16, AIS, and 26AS differences.",
  },
  {
    id: "regime",
    label: "Regime",
    description: "Old vs new regime with proof-backed deductions.",
  },
  {
    id: "portal",
    label: "File on portal",
    description: "Filing Guide: How to use your step-by-step companion.",
  },
  {
    id: "everify",
    label: "E-verify",
    description: "Complete verification within 30 days of portal submit.",
  },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // ---------------- PREP ----------------
  {
    slug: "form16-upload",
    pillar: "prep",
    title: "Upload and read your Form 16",
    summary: "Part A vs Part B, and what to verify before tax computation.",
    href: "/help/form16-upload",
    keywords: ["form 16", "upload", "salary", "tds"],
    body: `## The problem

Form 16 has two parts and people often read only the net figure. Part A is the TDS certificate (quarterly tax deducted, with your PAN and the employer TAN). Part B is the salary breakup and the deductions your employer considered.

## On incometax.gov.in

1. Log in and open **e-File → Income Tax Returns → File Income Tax Return**
2. When you reach the salary schedule, the portal pre-fills figures from your employer's TDS return
3. Compare those pre-filled numbers with **Part B** of your own Form 16 line by line
4. Confirm the **TDS in Part A** matches your **Form 26AS**

## How LastMinute helps

- Import Form 16 and we extract gross salary, exemptions, and TDS into a draft
- We flag where Part A TDS and your salary breakup disagree
- We show a [reconcile dashboard](/file/review) before you copy anything to the portal

You still file on incometax.gov.in — see the [Form 16 guide](/learn/form-16-guide) for a deeper walk-through.

[Start with Form 16](/file/import/documents?source=form16).`,
  },
  {
    slug: "choose-itr-form",
    pillar: "prep",
    title: "Which ITR form do I need?",
    summary: "ITR-1 vs ITR-2 decision points for salaried filers.",
    href: "/help/choose-itr-form",
    keywords: ["itr-1", "itr-2", "sahaj", "form selection"],
    body: `## The problem

Choosing the wrong ITR form is a common reason returns get treated as defective. ITR-1 (Sahaj) is for simple salaried cases; many situations push you to ITR-2.

## Quick decision points

- **ITR-1** fits: salary, one house property, other-source interest, total income up to the ITR-1 limit
- **ITR-2** is needed if you have: **capital gains**, more than one house property, foreign income/assets, or you are a director/hold unlisted shares
- **ITR-3/ITR-4** apply when you have business or professional income

## On incometax.gov.in

1. Start **File Income Tax Return** and select the assessment year
2. The portal asks a few questions and suggests a form — but you are responsible for the final choice
3. Pick the form that covers **all** your income types

## How LastMinute helps

- Our [ITR form quiz](/tools#itr-quiz) maps your income mix to the likely form
- The [reconcile dashboard](/file/review) surfaces capital gains or extra house property that would force ITR-2

Read [ITR-1 vs ITR-2](/learn/itr-1-vs-itr-2) for examples, then file on the portal.

[Check your form](/tools#itr-quiz).`,
  },
  {
    slug: "readiness-checklist",
    pillar: "prep",
    title: "Last-minute readiness checklist",
    summary: "PAN, AIS, bank account, and regime decision — in order.",
    href: "/help/readiness-checklist",
    keywords: ["checklist", "deadline", "documents"],
    body: `## The problem

Filing near the deadline goes wrong when one document is missing. A short checklist prevents a re-do.

## Before you open the portal

1. **PAN and Aadhaar** linked, and your **bank account** pre-validated for any refund
2. **Form 16** from every employer this year
3. **AIS and Form 26AS** downloaded and read
4. Interest certificates (savings, FD), and capital-gains statements if any
5. A **regime decision** based on your numbers, not the employer default

## On incometax.gov.in

1. Confirm bank account pre-validation under **Profile → My Bank Account**
2. Download **AIS** and **26AS** under **Services**
3. Keep them open while you fill the return

## How LastMinute helps

- We assemble these into one [reconcile dashboard](/file/review) with a progress indicator
- We compare [old vs new regime](/learn/old-vs-new-regime) on your figures

This is preparation help — the return is filed by you on the portal.

[Run the checklist](/file).`,
  },
  // ---------------- RECONCILE ----------------
  {
    slug: "ais-mismatch",
    pillar: "reconcile",
    title: "Fix AIS mismatches",
    summary: "When AIS shows income or TDS your Form 16 missed.",
    href: "/help/ais-mismatch",
    keywords: ["ais", "mismatch", "tds", "interest"],
    body: `## The problem

Your **AIS** (Annual Information Statement) often shows income your Form 16 does not — savings interest, FD interest, dividends, or share sales reported by banks and brokers.

## On incometax.gov.in

1. Open **Services → Annual Information Statement (AIS)**
2. Review each section: TDS/TCS, SFT, interest, dividend, securities
3. For a wrong line, submit **feedback** (duplicate / not mine / value incorrect) — see [AIS feedback step-by-step](/learn/ais-feedback-step-by-step)
4. Report the **correct** figures in your return regardless of feedback

## How LastMinute helps

- We line up Form 16 against AIS and **flag the gaps** in the [reconcile dashboard](/file/review)
- We label each item factually (matched / needs review) — no advice, just the differences

See [AIS mismatch](/learn/ais-mismatch) for worked examples, then file on the portal.

[Reconcile now](/file).`,
  },
  {
    slug: "ais-vs-26as",
    pillar: "reconcile",
    title: "AIS vs Form 26AS",
    summary: "Which statement to trust for TDS reconciliation.",
    href: "/help/ais-vs-26as",
    keywords: ["26as", "ais", "tds credit"],
    body: `## The problem

Both AIS and Form 26AS show tax information, and they can differ. 26AS focuses on tax **credits** (TDS/TCS, advance tax). AIS is broader and also lists income (interest, dividend, securities).

## On incometax.gov.in

1. Download both under **Services**
2. Use **26AS** to confirm TDS credits you will claim
3. Use **AIS** to confirm all income is reported
4. If TDS is missing from 26AS, the deductor must correct it — see [TDS not in 26AS](/learn/tds-not-in-26as-employer-fix)

## How LastMinute helps

- We compare your TDS schedule against 26AS and your income against AIS
- The [reconcile dashboard](/file/review) shows where the two statements disagree

Read [AIS vs 26AS](/learn/ais-vs-26as), then claim credits and file on the portal.

[Compare your statements](/file).`,
  },
  {
    slug: "two-form16",
    pillar: "reconcile",
    title: "Two Form 16s after a job change",
    summary: "Combine employers and total TDS correctly.",
    href: "/help/two-form16",
    keywords: ["job change", "two form 16", "employer"],
    body: `## The problem

After a job change you get a Form 16 from each employer. Each one applies the standard deduction and exemptions on its own salary — so simply adding net figures can double-count.

## On incometax.gov.in

1. Report **combined** gross salary from all employers under the salary head
2. Apply the **standard deduction once**, not per employer
3. Total the **TDS** from each Part A and claim the combined credit
4. Check the total against **AIS/26AS**

## How LastMinute helps

- Import each Form 16 and we **aggregate employers**, applying the standard deduction a single time
- We total TDS across employers and flag any 26AS gap

See [two Form 16s after job change](/learn/two-form-16-job-change), then file on the portal.

[Add another Form 16](/file/import/documents?source=form16&addEmployer=1).`,
  },
  {
    slug: "download-ais-help",
    pillar: "reconcile",
    title: "How to download your AIS",
    summary: "Exact path on the portal and the password to open the PDF.",
    href: "/help/download-ais-help",
    keywords: ["download ais", "annual information statement", "password"],
    body: `## The problem

People cannot find the AIS or cannot open the downloaded file.

## On incometax.gov.in

1. Log in and go to **Services → Annual Information Statement (AIS)**
2. Click the **AIS** tile (not just TIS) and choose download
3. The PDF is password protected — the password is usually your **PAN (lowercase)** + **date of birth (DDMMYYYY)**, e.g. \`abcde1234f01011990\`
4. Also download the **Taxpayer Information Summary (TIS)** for an aggregated view

## How LastMinute helps

- We explain each AIS section and how it maps to ITR schedules
- The [reconcile dashboard](/file/review) compares AIS lines against your Form 16 draft

Full walk-through: [download AIS](/learn/download-ais). You file the return on the portal.

[Start reconciling](/file).`,
  },
  // ---------------- REGIME ----------------
  {
    slug: "old-vs-new",
    pillar: "regime",
    title: "Old vs new tax regime",
    summary: "Compare on your numbers — not the employer default.",
    href: "/help/old-vs-new",
    keywords: ["old regime", "new regime", "87a"],
    body: `## The problem

Employers often deduct TDS under the new regime by default. That may not be your lowest-tax option — it depends on your deductions.

## What decides it

- **New regime**: lower slabs, higher standard deduction, but most Chapter VI-A deductions are not allowed
- **Old regime**: higher slabs, but 80C, 80D, HRA, home-loan interest and more are available

Heavy deductions usually favour old; few deductions usually favour new.

## On incometax.gov.in

1. The return lets you choose the regime for the year
2. Salaried filers without business income can generally pick each year
3. Select the regime that results in lower tax on **your** figures

## How LastMinute helps

- Our [tax estimator](/tools) and the [reconcile dashboard](/file/review) compute both regimes on your numbers side by side
- We show which deductions you would lose by switching to new

Read [old vs new regime](/learn/old-vs-new-regime), then choose and file on the portal.

[Compare regimes](/tools).`,
  },
  {
    slug: "80c-hra",
    pillar: "regime",
    title: "80C and HRA in the old regime",
    summary: "Proof-backed deductions only.",
    href: "/help/80c-hra",
    keywords: ["80c", "hra", "deductions"],
    body: `## The problem

80C and HRA are the biggest old-regime levers, but both need proof and have limits people miss.

## The essentials

- **80C** caps the bundle (EPF, PPF, ELSS, life insurance, home-loan principal, etc.) at ₹1.5 lakh
- **HRA** exemption is the least of three limbs and needs rent proof — see the [HRA calculator](/tools)

## On incometax.gov.in

1. Enter 80C investments under **Deductions (Chapter VI-A)**
2. HRA exemption is reflected in the **salary** schedule (exempt allowance)
3. Keep receipts; the portal does not ask for proof but the department can

## How LastMinute helps

- The [reconcile dashboard](/file/review) tracks each deduction as claimed / needs-proof — factual labels, not advice
- Our [HRA calculator](/tools) shows the binding limb so you know the exempt amount

See [80C deduction guide](/learn/80c-deduction-guide) and [HRA exemption](/learn/hra-exemption-itr), then file on the portal.

[Check deductions](/file/review).`,
  },
  {
    slug: "regime-switch-portal",
    pillar: "regime",
    title: "Switching regime on the portal",
    summary: "How the regime choice appears in the return, and Form 10-IEA.",
    href: "/help/regime-switch-portal",
    keywords: ["regime switch", "10-iea", "opt out", "default regime"],
    body: `## The problem

The new regime is the **default**. To use the old regime you must actively opt out, and business filers have extra steps.

## On incometax.gov.in

1. In the return, find the question about opting out of the new regime
2. **Salaried/no-business** filers can usually choose each year inside the return
3. Filers with **business/professional income** generally file **Form 10-IEA** to opt out, within the due date
4. Confirm the chosen regime before you validate

## How LastMinute helps

- We compute both regimes so you opt out only when old is genuinely lower for you
- The [reconcile dashboard](/file/review) reflects your selected regime in the refund/payable view

Background: [old vs new regime](/learn/old-vs-new-regime). The selection and any Form 10-IEA are filed by you on the portal.

[Compare first](/tools).`,
  },
  // ---------------- PORTAL ----------------
  {
    slug: "portal-submit",
    pillar: "portal",
    title: "Submit your return on incometax.gov.in",
    summary: "Login, prefill, validate, and download the acknowledgement.",
    href: "/help/portal-submit",
    keywords: ["submit", "incometax.gov.in", "acknowledgement"],
    body: `## The problem

The final submission has several steps and skipping validation causes errors at the end.

## On incometax.gov.in

1. **Login** with PAN/Aadhaar and password
2. **e-File → Income Tax Returns → File Income Tax Return**; pick the assessment year and form
3. Review the **pre-filled** salary, TDS, and deduction data against your documents
4. Run **Validate** on each schedule and fix flagged items
5. **Preview** the return, confirm tax payable/refund, then **submit**
6. Download the **ITR-V / acknowledgement**

## How LastMinute helps

- Our [portal companion](/file/companion?demo=1) maps your reconciled figures to each portal screen as copy-ready values
- We list what to paste and what to verify per section

Submission and e-verification are done by you on the portal — we do not file for you.

[Open the companion](/file/companion?demo=1).`,
  },
  {
    slug: "portal-login-prefill",
    pillar: "portal",
    title: "Login and use the portal pre-fill",
    summary: "What pre-fill covers, and why you must still verify it.",
    href: "/help/portal-login-prefill",
    keywords: ["login", "prefill", "personal info", "verify"],
    body: `## The problem

The portal pre-fills a lot, and filers assume it is complete. Pre-fill is a starting point, not a verified return.

## On incometax.gov.in

1. **Login** and confirm **personal info** (PAN, Aadhaar, contact, bank account)
2. When filing, the portal pulls **salary, TDS, interest, and some deductions**
3. **Verify each pre-filled figure** against Form 16, AIS, and 26AS
4. Add anything pre-fill missed (e.g. interest not yet reported by a bank)

## How LastMinute helps

- We build a reconciled draft so you know the correct number **before** you see pre-fill
- The [reconcile dashboard](/file/review) highlights items pre-fill commonly misses

You remain responsible for the figures filed on the portal.

[Build your draft](/file).`,
  },
  // ---------------- E-VERIFY ----------------
  {
    slug: "everify-deadline",
    pillar: "everify",
    title: "The 30-day e-verify rule",
    summary: "Why an unverified return is invalid, and how to verify.",
    href: "/help/everify-deadline",
    keywords: ["e-verify", "aadhaar otp", "30 days"],
    body: `## The problem

Submitting the return is not the end. An **unverified** return is treated as **not filed**. You must e-verify within **30 days** of submission.

## On incometax.gov.in

1. After submit, choose **e-Verify Now**
2. Pick a method: **Aadhaar OTP**, net banking, bank/demat EVC, or send a signed ITR-V by post
3. Complete it within **30 days**
4. Save the **verification confirmation**

## How LastMinute helps

- We remind you that verification is a required final step and outline each method
- See [e-verify guide](/learn/e-verify-itr-guide) for the Aadhaar OTP path

Verification is completed by you on the portal.

[Read the e-verify guide](/learn/e-verify-itr-guide).`,
  },
  {
    slug: "everify-aadhaar-otp",
    pillar: "everify",
    title: "E-verify with Aadhaar OTP",
    summary: "The fastest method when your mobile is linked to Aadhaar.",
    href: "/help/everify-aadhaar-otp",
    keywords: ["aadhaar otp", "e-verify", "evc"],
    body: `## The problem

Aadhaar OTP is the quickest way to verify, but it needs your **mobile number linked to Aadhaar**.

## On incometax.gov.in

1. On the e-Verify screen, select **Aadhaar OTP**
2. Confirm consent; an OTP is sent to your Aadhaar-linked mobile
3. Enter the OTP within its validity window
4. You get a **transaction ID** confirming verification

If your mobile is not linked to Aadhaar, use **net banking** or **bank EVC** instead.

## How LastMinute helps

- We explain which method fits your setup and what to keep as confirmation
- More detail: [e-verify guide](/learn/e-verify-itr-guide)

The OTP step happens on the portal — we do not verify on your behalf.

[See verification steps](/learn/e-verify-itr-guide).`,
  },
  {
    slug: "refund-status",
    pillar: "everify",
    title: "Refund after filing",
    summary: "CPC processing timeline — the amount is confirmed by the department.",
    href: "/help/refund-status",
    keywords: ["refund", "processing", "cpc"],
    body: `## The problem

After filing, refunds are processed by **CPC** and credited to your **pre-validated bank account**. Timing varies and the final amount is decided by the department, not by any estimate.

## On incometax.gov.in

1. Ensure your bank account is **pre-validated** (Profile → My Bank Account)
2. Track status under **Services → Know Your Refund Status** or in **e-File → View Filed Returns**
3. If a refund fails, it is usually a bank validation issue — fix and re-issue

## How LastMinute helps

- Our estimate shows a likely refund/payable so there are no surprises, but the department confirms the final figure
- See [refund status](/learn/itr-refund-status) for the processing stages

We do not promise a refund amount — that is determined when the return is processed.

[Check your estimate](/file/review).`,
  },
  // ---------------- DEEP-LINK CARDS (no native body) ----------------
  {
    slug: "itr-form-quiz",
    pillar: "prep",
    title: "Take the ITR form quiz",
    summary: "Answer a few questions to see your likely ITR form.",
    href: "/tools#itr-quiz",
    keywords: ["itr quiz", "form selection", "sahaj"],
  },
  {
    slug: "portal-companion",
    pillar: "portal",
    title: "Open the portal companion",
    summary: "Copy-ready fields mapped to incometax.gov.in screens.",
    href: "/file/companion?demo=1",
    keywords: ["companion", "portal", "copy paste"],
  },
];

export function getHelpArticlesByPillar(pillar: HelpPillar): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.pillar === pillar);
}

/** Articles with a native body, rendered at /help/<slug>. */
export function getNativeHelpArticles(): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => typeof a.body === "string" && a.body.length > 0);
}

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug && a.body);
}
