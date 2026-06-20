import type { ArticleCluster } from "./article-clusters";
import { PHASE2_LEARN_ARTICLES } from "./learn-articles-phase2";
import { PHASE3_LEARN_ARTICLES } from "./learn-articles-phase3";
import { PHASE4_LEARN_ARTICLES } from "./learn-articles-phase4";
import { PHASE5_LEARN_ARTICLES } from "./learn-articles-phase5";

export interface LearnArticleFaq {
  question: string;
  answer: string;
}

export interface LearnArticle {
  slug: string;
  title: string;
  description: string;
  readMinutes: number;
  publishedAt: string;
  body: string;
  /** Two glossary slugs for internal linking in article footer */
  relatedGlossarySlugs: [string, string];
  /** SEO cluster for related-article suggestions */
  cluster?: ArticleCluster;
  tags?: string[];
  /** Optional FAQ block for FAQPage JSON-LD */
  faqs?: LearnArticleFaq[];
}

export const LEARN_ARTICLES = [
  ...PHASE5_LEARN_ARTICLES,
  ...PHASE4_LEARN_ARTICLES,
  {
    slug: "last-minute-filing",
    title: "Last-minute ITR filing: your 48-hour survival checklist",
    description:
      "Deadline in two days? Here is a realistic hour-by-hour plan — Form 16, AIS, regime choice, and filing on incometax.gov.in without panic mistakes.",
    readMinutes: 8,
    publishedAt: "2026-06-01",
    cluster: "last-minute",
    tags: ["ITR", "deadline", "last-minute", "checklist"],
    relatedGlossarySlugs: ["standard-deduction-u-s-16-ia", "tds-schedule"],
    faqs: [
      {
        question: "Can I still file if the deadline is in 48 hours?",
        answer:
          "Yes for most salaried filers if Form 16 and AIS are ready. Skip deduction optimisation — focus on complete income, correct TDS, regime choice, and e-verification.",
      },
    ],
    body: `## Breathe — you still have time

Every July, lakhs of salaried Indians file in the final 48 hours. You are not alone. The trick is **prioritising completeness over perfection**: report every AIS line, pick the right ITR form, pay any balance tax, and e-verify. Cosmetic 80C tuning can wait for a revised return if you are eligible.

This is not legal advice — verify dates on incometax.gov.in for AY 2026-27.

## Hour 0–1: Documents only (no portal yet)

1. Download **Form 16** Part A + B from every employer — [two Form 16s if you changed jobs](/learn/two-form-16-job-change)
2. Download **AIS** and **Form 26AS** same session — [how they differ](/learn/ais-vs-26as)
3. Circle every AIS line that is **not** salary from Form 16 (FD interest, old employer, broker sales)

Skip broker P&L deep-dives unless you sold shares — if you did, you likely need [ITR-2](/learn/itr-1-vs-itr-2), not ITR-1.

## Hour 1–3: Regime + form decision

Run [old vs new regime](/learn/old-vs-new-regime) on **combined** income, not employer default. New regime gives higher [standard deduction](/glossary/standard-deduction-u-s-16-ia) on salary; old regime unlocks 80C, 80D, and [HRA](/learn/hra-exemption-itr).

Pick **ITR-1** only if salary + one house + simple interest, no capital gains. When unsure, read [ITR-1 salaried guide](/learn/itr-1-salaried-guide).

## Hour 3–6: Enter numbers and fix mismatches

- Match employer TDS: Form 16 Part A → [26AS / TDS schedule](/glossary/tds-schedule)
- Add bank interest from AIS to [other sources](/glossary/other-sources-income)
- Pay **self-assessment tax** if computation shows payable — filing without paying creates interest later

Use [Form 16 upload](/file/import/documents?source=form16) to reduce typing — verify every field manually.

## Hour 6+: Submit on incometax.gov.in + e-verify

LastMinute ITR does **not** file for you. Copy verified figures to the government portal, submit, then **e-verify within 30 days** — unverified returns are treated as invalid.

Keep acknowledgment PDF and computation sheet for seven years.

## What you should do

- Refresh AIS download within 48 hours of submit — stale May AIS misses June TDS
- Fix [AIS mismatches](/learn/ais-mismatch) before upload, not after a notice
- If overwhelmed, file clean salary + interest first; complex schedules may need a CA — see [file without CA guide](/learn/file-itr-without-ca)

## Common mistake

**Filing at 11:59 pm with only Form 16.** AIS often shows FD interest your employer never saw. Zero tax due on Form 16 does not mean zero extra liability after AIS.

Second mistake: **wrong regime at the last minute** — claiming 80C or HRA in new regime gives no benefit and wastes review time.

## Related guides

- [10 common ITR mistakes](/learn/common-itr-mistakes)
- [ITR deadline and penalties](/learn/itr-deadline-2026)

[Check your ITR with LastMinute](/file) before you hit submit on the portal.`,
  },
  {
    slug: "old-vs-new-regime",
    title: "Old vs new tax regime: which one saves you money in AY 2026-27?",
    description:
      "A friendly comparison of slabs, standard deduction, 80C/HRA rules, and 87A rebate — with Indian salary examples so you pick based on your numbers, not rumours.",
    readMinutes: 9,
    publishedAt: "2026-05-20",
    cluster: "regime",
    tags: ["ITR", "old regime", "new regime", "87A"],
    relatedGlossarySlugs: ["opt-out-of-new-tax-regime", "rebate-u-s-87a"],
    faqs: [
      {
        question: "Is new regime always better after the ₹12 lakh rebate?",
        answer:
          "No. High 80C plus HRA plus home-loan interest under old regime can still beat new regime for many renters in metro cities. Compare both on your Form 16 and rent proofs.",
      },
    ],
    body: `## Think of it like two menus at the same restaurant

**Old regime** lets you order deductions — 80C, 80D, HRA, home-loan interest — but the base prices (slab rates) are higher.

**New regime** has lower slab rates and a bigger [standard deduction on salary](/glossary/standard-deduction-u-s-16-ia) (₹75,000 for AY 2026-27), but most Chapter VI-A items are off the menu. A enhanced [rebate u/s 87A](/glossary/rebate-u-s-87a) can zero out tax for many middle incomes — see [87A in new regime](/learn/87a-rebate-new-regime).

You choose each year (with some lock-in rules for business income). Employers may default TDS to new regime — your **filing choice can differ**, which creates balance tax payable if old regime wins.

## New regime — quick picture

| Income slab (₹) | Rate |
| Up to 3,00,000 | Nil |
| 3,00,001 – 7,00,000 | 5% |
| 7,00,001 – 10,00,000 | 10% |
| 10,00,001 – 12,00,000 | 15% |
| 12,00,001 – 15,00,000 | 20% |
| Above 15,00,000 | 30% |

Verify exact slabs in the Finance Act for your AY — budgets move numbers.

**Generally not available in new regime:** [80C](/glossary/section-80c), [80D](/glossary/section-80d), HRA exemption, most home-loan interest set-off. **Often still available:** employer [80CCD(2)](/glossary/section-80ccd-2) NPS within limits.

## Old regime — when it still wins

Old regime keeps higher slabs but allows:

- ₹1.5 lakh [80C](/glossary/section-80c) bundle (PPF, ELSS, EPF employee share, etc.)
- [80D](/glossary/section-80d) health insurance
- [HRA exemption](/learn/hra-exemption-itr) if you pay rent in a metro
- Home-loan interest on self-occupied house (within caps)

Rule of thumb: if your **total deductions exceed roughly ₹1.5–2 lakh in tax benefit**, old regime deserves a serious look — but only on **your** rent and investment numbers.

## Mini example: ₹10 lakh salary, ₹1.8L 80C, ₹25k 80D, strong HRA

New regime: taxable salary after ₹75k standard deduction, no 80C/HRA → moderate tax, possibly reduced by 87A depending on taxable income.

Old regime: higher slabs but lower taxable income after 80C, 80D, HRA → often lower net tax for renters with proof.

**Do not copy this outcome** — run both sides. [New regime slabs detail](/learn/new-regime-slabs-2026) has worked arithmetic.

## What you should do

1. List deductions you **actually have proofs for**, not what you plan to invest in March
2. Include AIS interest — it changes taxable income and rebate eligibility
3. Compare net tax payable side-by-side before locking regime on incometax.gov.in
4. Use [LastMinute regime compare](/file/import/documents?source=form16) on your Form 16 draft

## Common mistake

**Choosing regime from Form 16 default.** Payroll assumed new regime for TDS; you file old regime with heavy 80C — tax payable surprise at filing. Pay challan before submit.

Another: **Ignoring FD interest in AIS** when evaluating 87A — extra ₹50k interest can push you over rebate cliff.

## Seniors and special cases

Senior citizens get different slab thresholds — see expanded [80TTB / senior guide](/learn/senior-citizen-80ttb). Capital gains use special rates regardless — may push you to [ITR-2](/learn/itr-1-vs-itr-2).

## FAQ

**Can I switch regime every year?**
Many salaried individuals can — business/profession cases have opt-out lock-in; confirm for your situation.

**Does HRA work in new regime?**
Generally not for typical salaried opt-in — HRA is an old-regime style exemption.

[Compare regimes on your numbers](/file) · [Read ITR-1 salaried guide](/learn/itr-1-salaried-guide)`,
  },
  {
    slug: "ais-mismatch",
    title: "AIS mismatch: why the tax portal shows income you forgot",
    description:
      "Banks, brokers, and old employers report to ITD before you file. Here is how to read AIS gaps, fix them, and avoid notices — with Indian examples.",
    readMinutes: 8,
    publishedAt: "2026-05-15",
    cluster: "ais",
    tags: ["ITR", "AIS", "26AS", "mismatch"],
    relatedGlossarySlugs: ["other-sources-income", "tds-schedule"],
    faqs: [
      {
        question: "Is AIS the same as my tax return?",
        answer:
          "No. AIS is third-party reported data. Your ITR is what you certify. Every AIS income line must appear in your return or be explained — silence invites mismatch processing.",
      },
    ],
    body: `## AIS is like a report card from everyone who paid you

The **Annual Information Statement (AIS)** on incometax.gov.in lists salary, interest, dividends, securities sales, rent, and more — reported against your PAN by employers, banks, brokers, and tenants.

It is **not** your return. But the department uses it to check whether you reported everything. Filing with only [Form 16](/learn/form-16-guide) while AIS shows ₹40,000 FD interest is one of the most common salaried filer mistakes.

## Frequent mismatches (Indian examples)

| AIS shows | Why Form 16 missed it |
| Bank FD interest ₹38,000 | Banks report interest; employer does not |
| Previous employer salary + TDS | Current Form 16 only |
| Zerodha/Groww sale proceeds | Broker SFT; not salary |
| Tenant TDS on rent you received | Landlord income, not employee |
| Dividend from demat | Registrar reporting |

## AIS vs Form 26AS — 30-second version

**26AS** = tax credits (TDS/TCS/challans) — what you claim in [TDS schedule](/glossary/tds-schedule).

**AIS** = broader transactions + credits — what you might have **forgotten to include**.

Read the full [AIS vs Form 26AS guide](/learn/ais-vs-26as) and [download steps](/learn/download-ais).

## What you should do

1. Download AIS PDF/JSON **48 hours before filing**
2. Build a three-column list: AIS line | Amount | In my draft? (Y/N/Exempt)
3. For every **N**, add to [other sources](/glossary/other-sources-income) or capital gains schedule
4. Match TDS lines to Form 16 Part A and 26AS — do not claim credit not in 26AS
5. Pay tax on income without adequate TDS before filing
6. Import Form 16 + review AIS in [LastMinute ITR](/file/import/documents?source=form16) for gap hints

## Common mistake

**Assuming "no TDS" means "no tax".** Bank reported ₹60,000 interest with zero TDS because you submitted Form 15G — you still **report** the interest and pay tax if slabs demand it.

Another: **treating AIS sale value as taxable income** — for shares, taxable amount is usually **gain**, not gross proceeds. You still need correct schedule, often [ITR-2](/learn/itr-1-vs-itr-2).

## AIS feedback when data is wrong

Use portal feedback on incorrect duplicate lines — keep screenshot. Still file with **correct** figures you can prove.

## Related

- [Two Form 16s after job change](/learn/two-form-16-job-change)
- [Bank FD in AIS](/learn/bank-fd-interest-ais)
- [10 common mistakes](/learn/common-itr-mistakes)

[Check your ITR with LastMinute](/file) — then file on incometax.gov.in.`,
  },
  {
    slug: "itr-1-vs-itr-2",
    title: "ITR-1 vs ITR-2: pick the right form first",
    description:
      "Eligibility rules for Sahaj (ITR-1) and when you must use ITR-2.",
    readMinutes: 5,
    publishedAt: "2026-05-10",
    relatedGlossarySlugs: ["recommended-itr-form", "capital-gains-schedule"],
    body: `## ITR-1 (Sahaj)

Use when **all** are true:

- Resident individual (not RNOR).
- Total income ≤ ₹50 lakh.
- Salary, one house property, other sources (interest, family pension).
- **No** capital gains, business income, or foreign assets.

## ITR-2

Required if you have:

- Capital gains (equity, MF, property).
- More than one house property or loss carry-forward.
- Foreign income or assets.
- Director in a company or unlisted equity.

## Wrong form = defective return

Picking ITR-1 with capital gains is a common last-minute mistake. The profiler in LastMinute ITR recommends the form from your income mix — change it early before you enter schedules.`,
  },
  ...PHASE2_LEARN_ARTICLES,
  ...PHASE3_LEARN_ARTICLES,
] as LearnArticle[];

export function getLearnArticle(slug: string): LearnArticle | undefined {
  return LEARN_ARTICLES.find((a) => a.slug === slug);
}
