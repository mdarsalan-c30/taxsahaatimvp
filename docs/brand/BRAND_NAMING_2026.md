# Brand Naming Research — June 2026

Research for the Indian ITR **companion** product (prepare + portal guide; user files on incometax.gov.in).  
Scope: brand doc only — no code or rebrand executed in this phase.

**Related files:** [DOMAIN_AVAILABILITY_2026.csv](./DOMAIN_AVAILABILITY_2026.csv) · raw DNS JSON: `_domain_scan_raw.json`

---

## Executive recommendation

### Primary: **LastMinute ITR** (keep and secure domains now)

Best balance of **clearance, SEO, and shipped product fit**. Already live in hero copy, Vercel deploy, and repo. All core domains (`lastminuteitr.com`, `.in`, `.co`, `.app`, `.ai`) show **no DNS records** — register immediately before filing season.

**Pair with tagline:** *File ITR before the deadline — without the guesswork.* (already in [lib/copy/marketing.ts](../../lib/copy/marketing.ts))

### Runner-up (Hindi warmth): **TaxSahaati**

Use if you want a warmer, Indian companion brand aligned with your MVP (`taxsahaatimvp`). Spelling uses **sahaati** (extra “a”) to stay distinct from incumbents **TaxSaathi** / **TaxSathi**. All scanned TLDs likely free.

**Do not adopt:** **TaxSaathi** or **TaxSathi** as primary brand — domains taken and active CA-assisted filing competitors at [taxsaathi.com](https://taxsaathi.com/) and [taxsathi.com](https://taxsathi.com/).

### Hybrid strategy (recommended if team is split)

| Layer | Name | Role |
|-------|------|------|
| Consumer brand | **TaxSahaati** | Marketing, ads, Hindi-English trust |
| Product descriptor | **LastMinute ITR filing companion** | Subtitle until brand equity builds |
| Legal entity | TBD | MCA name can differ from consumer brand |

Secure domains for **both** `taxsahaati.*` and `lastminuteitr.*` if budget allows (~₹2–4k/year combined on .com + .in).

---

## What the name must signal

From companion positioning ([lib/copy/companion.ts](../../lib/copy/companion.ts)):

- Reconcile Form 16, AIS, 26AS
- Old vs new regime comparison
- Screen-by-screen incometax.gov.in guide
- User files and e-verifies themselves
- **Not** a CA firm, **not** auto-submit, **not** government-affiliated

Names that sound like “we file for you” (TaxBuddy, TaxSaathi incumbents) work against this wedge.

---

## Your shortlist — verdict

| Name | Spelling | Verdict |
|------|----------|---------|
| TaxSaathi | साथी (natural Hindi) | **Blocked** — taxsaathi.com + .in taken; live GST/ITR compliance firm |
| TaxSathi | Shortened | **Blocked** — taxsathi.com + .in taken; CA-assisted ITR from ₹999 |
| TaxSahaati | MVP spelling | **Go** — all TLDs likely free; phonetically near Saathi but legally/SEO distinct |
| LastMinute ITR | Current product | **Go** — ownable, shipped, all TLDs likely free |

---

## Full domain matrix (DNS scan — confirm at registrar before purchase)

DNS “LIKELY_FREE” means no A/AAAA record found (NXDOMAIN or no address). **Not a guarantee** — always verify at GoDaddy, Namecheap, or Google Domains before paying.

| Candidate | .com | .in | .co | .app | .ai |
|-----------|------|-----|-----|------|-----|
| **taxsahaati** | free | free | free | free | free |
| **lastminuteitr** | free | free | free | free | free |
| **lastminute-itr** | free | free | free | free | free |
| sahiitr | free | free | free | free | free |
| itrpath | free | free | free | free | free |
| form16guide | free | free | free | free | free |
| reconcileitr | free | free | free | free | free |
| taxsamajh | free | free | free | free | free |
| deadlineitr | free | free | free | free | free |
| itrready | free | free | free | free | free |
| portalitr | free | free | free | free | free |
| karfile | taken | free | free | free | free |
| itrguide | taken | free | free | free | free |
| taxsaathi | **taken** | **taken** | free | free | free |
| taxsathi | **taken** | **taken** | free | free | free |
| etaxsaathi | **taken** | free | free | free | free |
| taxdost | taken | taken | free | free | — |
| lastminute | taken | taken | — | taken | taken |

Full list: [DOMAIN_AVAILABILITY_2026.csv](./DOMAIN_AVAILABILITY_2026.csv)

### Suggested domain bundles

**LastMinute ITR (priority)**
- Must-have: `lastminuteitr.in` + `lastminuteitr.com`
- Nice-to-have: `lastminuteitr.app` (app store / PWA), `lastminuteitr.ai` (AI companion story)

**TaxSahaati (if Hindi brand)**
- Must-have: `taxsahaati.in` + `taxsahaati.com`
- Defensive: `taxsahaati.app`

**Avoid buying:** `taxsaathi.com` / `taxsathi.com` (owned by competitors; acquisition costly).

---

## Competitor collision table

| Brand | Domain | Positioning | Conflict with us |
|-------|--------|-------------|------------------|
| **Taxsaathi** | taxsaathi.com | GST, ITR, litigation, “filed 500+ ITRs”, CA consultancy | **High** — same name spelling; “we file for you” |
| **Taxsathi** | taxsathi.com | CA-assisted ITR ₹999–₹1499, “Get your tax filed within 24 hours” | **High** — direct ITR filing service |
| **Etax Saathi** | etaxsaathi.com | ITR, GST, company registration, “reliable Saathi” | **Medium** — Saathi family; different spelling |
| **ClearTax** | cleartax.in | E-file, scale SEO, refund claims | Low name clash; category competitor |
| **TaxBuddy** | taxbuddy.in (DNS ambiguous) | Assisted + DIY filing | Category competitor |
| **Quicko** | quicko.in (DNS ambiguous) | ITD import, traders | Category competitor |

**Passing-off risk:** Adopting **TaxSaathi** or **TaxSathi** could confuse users searching those exact terms and land on competitor sites. **TaxSahaati** reduces but does not eliminate phonetic similarity — use distinct visual identity and always state companion positioning.

---

## Trademark checklist (IP India)

Perform before finalizing any name (especially Saathi family):

1. **Public search:** [tmrsearch.ipindia.gov.in/tmrpublicsearch](https://tmrsearch.ipindia.gov.in/tmrpublicsearch/) — Wordmark, “Contains” search for:
   - TAX SAAHAATI / TAXSAHAATI
   - TAX SAATHI / TAXSAATHI
   - LAST MINUTE ITR / LASTMINUTEITR
   - SAHI ITR / SAHIITR
2. **Classes to check:** 9 (software/apps), 35 (business/advisory services), 42 (SaaS/IT services)
3. **Phonetic search:** Run phonetic variant for “Tax Saathi” — may catch near-matches TaxSaathi competitors filed
4. **MCA company name:** [mca.gov.in](https://www.mca.gov.in/) — SPICe+ Part A name reservation if incorporating; struck-off companies can still block names
5. **Budget for counsel:** ₹15k–₹40k for trademark attorney clearance opinion if raising funding

*This doc does not constitute legal advice. DNS and web research are indicative only.*

---

## Social handle sweep (June 2026)

HTTP checks only — platforms often return 200 for both taken and empty handles. **Verify manually** before committing.

| Handle | Instagram | X (Twitter) | YouTube @ | LinkedIn /company |
|--------|-----------|-------------|-----------|-------------------|
| taxsahaati | 200 (verify) | **404 — likely available** | **404 — likely available** | blocked/rate-limited |
| taxsaathi | 200 (likely taken) | — | — | — |
| lastminuteitr | 200 (verify) | **404 — likely available** | — | — |

**Recommendation:** Claim `@lastminuteitr` and `@taxsahaati` on X and YouTube early; use consistent handle across channels once brand is chosen.

---

## Scored finalists (1–5 per criterion)

Criteria: positioning fit · memorability · Indian resonance · domain feasibility · competitive clearance · SEO headroom · premium aesthetic

| Rank | Name | Pos | Mem | Ind | Dom | Clear | SEO | Prem | **Total** |
|------|------|-----|-----|-----|-----|-------|-----|------|-----------|
| **1** | **LastMinute ITR** | 5 | 4 | 3 | 5 | 5 | 4 | 4 | **30** |
| **2** | **TaxSahaati** | 5 | 4 | 5 | 5 | 4 | 3 | 4 | **30** |
| **3** | **SahiITR** | 4 | 5 | 5 | 5 | 5 | 3 | 4 | **31** |
| **4** | **ITRPath** | 5 | 4 | 3 | 5 | 5 | 4 | 5 | **31** |
| **5** | **ReconcileITR** | 5 | 3 | 3 | 5 | 5 | 4 | 4 | **29** |
| — | Form16Guide | 3 | 4 | 3 | 5 | 5 | 5 | 3 | 28 |
| **Avoid** | TaxSaathi | 2 | 4 | 5 | 1 | 1 | 1 | 2 | 16 |
| **Avoid** | TaxSathi | 2 | 5 | 5 | 1 | 1 | 1 | 2 | 17 |

*Tie-break:* LastMinute ITR wins on **already shipped** + **zero incumbent collision**. TaxSahaati wins on **Indian warmth** if that is the GTM priority.

---

## Brand kits (finalists)

### 1. LastMinute ITR

| Field | Value |
|-------|-------|
| Display name | LastMinute ITR |
| Pronunciation | last-MIN-it I-T-R |
| Tagline | File ITR before the deadline — without the guesswork. |
| Hero headline | Reconcile Form 16 & AIS. You submit on incometax.gov.in. |
| Say | Companion, portal guide, estimate, reconcile, you file yourself |
| Never say | We file for you, guaranteed refund, government partner, auto-submit |
| Domain bundle | lastminuteitr.com + lastminuteitr.in (+ .app optional) |

### 2. TaxSahaati

| Field | Value |
|-------|-------|
| Display name | TaxSahaati |
| Pronunciation | tax-SAA-haa-tee (तैक्स-साहाती) |
| Tagline | Your tax companion — we prep, you file on the government portal. |
| Hero headline | Form 16, AIS, regime — sorted. You file on incometax.gov.in. |
| Say | Sahaati (companion), guide, reconcile, step-by-step |
| Never say | Hum file karte hain, guaranteed refund, sarkari partner |
| Domain bundle | taxsahaati.com + taxsahaati.in |
| Visual note | Distinct logo/color from taxsaathi.com — avoid green-gold CA-shop cliché |

### 3. SahiITR (backup)

| Field | Value |
|-------|-------|
| Display name | SahiITR |
| Pronunciation | SAA-hee I-T-R |
| Tagline | Get your ITR right — then file it yourself. |
| Hero headline | Reconcile everything. File with confidence on incometax.gov.in. |
| Domain bundle | sahiitr.com + sahiitr.in |

### 4. ITRPath (backup)

| Field | Value |
|-------|-------|
| Display name | ITRPath |
| Pronunciation | I-T-R path |
| Tagline | Your path through the tax portal — step by step. |
| Hero headline | From Form 16 to e-verify — we guide every screen. |
| Domain bundle | itrpath.com + itrpath.in |

---

## Decision gate (what changes if you pick a name later)

| Phase | LastMinute ITR | TaxSahaati | Full hybrid |
|-------|----------------|------------|-------------|
| **Marketing only** | Update meta title, footer, hero eyebrow | Same + Hindi microcopy on homepage | Consumer = TaxSahaati; product line = LastMinute companion |
| **Domain** | Point lastminuteitr.in → Vercel | Point taxsahaati.in → Vercel | Redirect rules for both |
| **Full rebrand** | package.json, README, Vercel project, OG image, 156 learn URLs unchanged | Rename display strings, new OG, sitemap brand strings | Largest lift; plan 2–3 day sprint |

**No action taken in this research phase** beyond these docs.

---

## Action checklist for founders

1. [ ] Decide: **LastMinute ITR** only vs **TaxSahaati** consumer brand vs hybrid
2. [ ] Register domains within 48 hours (filing season squats names fast)
3. [ ] Run IP India wordmark search (30 min, free)
4. [ ] Claim X + YouTube handles for chosen name
5. [ ] Share this doc + CSV with colleague on GitLab
6. [ ] If TaxSahaati: brief designer on visual differentiation from taxsaathi.com
7. [ ] Schedule optional trademark filing (Class 42) after counsel review

---

## Research method

- **DNS:** `host -t A` across .com, .in, .co, .app, .ai for 22 candidates (June 15, 2026)
- **Competitors:** Live site review of taxsaathi.com, taxsathi.com, etaxsaathi.com
- **Product context:** [lib/copy/marketing.ts](../../lib/copy/marketing.ts), [lib/copy/companion.ts](../../lib/copy/companion.ts), [docs/DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)
- **MVP signal:** `taxsahaatimvp-exkv.vercel.app` → Tax**Sahaati** spelling

---

*Prepared for LastMinute ITR / TaxSahaati naming decision. Re-run DNS before any purchase.*
