# UX Designer Research Pack

Welcome. This folder is the single handoff for the UI/UX designer. It compiles everything we already know about LastMinute ITR's users, competitors, information architecture, and design language into one filterable workbook, and fills the biggest gap (real user voice) with fresh forum research.

## Start here

1. Open **`UX_DESIGNER_RESEARCH_PACK_2026.xlsx`** and read the **`README`** tab first. It states the product constraint, the column legend, and what exists vs. what is missing.
2. Then skim the tabs in this order: `User_Pain_Points` → `Forum_Research` → `Personas` → `User_Flows` → `Information_Architecture` → `Competitors` → `Design_References`.
3. The same data is in **`csv/`** (one file per tab) if you prefer Git diffs, grep, or importing into another tool.

## The one product rule that governs every design decision

LastMinute ITR is an **ITR companion, not an e-filer**. We reconcile Form 16 / AIS / 26AS, compare the old vs new regime, and walk the user **screen-by-screen through incometax.gov.in**. The user always files and e-verifies themselves on the official portal.

Copy and UI must never imply:

- "We file for you" / auto-submission to the Income Tax Department
- "Guaranteed refund" or refund-maximization hype
- Any affiliation with the Income Tax Department

Source of truth for safe copy: [`lib/copy/companion.ts`](../../lib/copy/companion.ts).

## What's in the workbook (12 tabs)

| Tab | What it gives you |
|-----|-------------------|
| `README` | Orientation, legend, honest gaps |
| `Competitors` | 16 India + global UX references with our wedge per competitor |
| `User_Pain_Points` | 9+ synthesized themes mapped to current routes, severity, and the gap |
| `Forum_Research` | Real user quotes scraped from qna.tax, Reddit, and competitor help/blogs, each with a clickable URL |
| `Personas` | 8 case-study personas + marketing carousel personas with expected journeys |
| `Surveys_Feedback` | The in-app feedback form spec + analytics events (and what data does **not** exist) |
| `Interviews` | Status (none done) + a recommended 12-question script for you to run |
| `Information_Architecture` | Route map across Marketing / Filing / API zones with status flags |
| `User_Flows` | Step-by-step flows (current ~20 screens vs proposed 11-screen path) |
| `Design_References` | Design system, competitor teardowns, and global north-stars with "steal / avoid" |
| `Competitor_UX_Audits` | Filing-journal teardowns and gap matrix, with where the auth wall stops us |
| `Source_Index` | Every source doc with a priority tag (Must_read / Reference / Archive) |

## Honest gaps (please read before trusting the data)

- **No primary interviews.** Zero users or CAs have been interviewed. The `Interviews` tab has a ready-to-run script — running it is the highest-value next research step.
- **No survey dataset.** The in-app feedback form (1–5 stars, 280-char message → `/api/feedback`) collects data, but nothing has been analyzed or exported. Treat `Surveys_Feedback` as a spec, not results.
- **Competitor journals stop at the auth wall.** Quicko/ClearTax teardowns end at login/OTP/paywall, so we lack their logged-in pixel detail. The `Forum_Research` quotes are the best proxy for real user voice.

## Must-read source docs (beyond this pack)

- [`docs/DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) — tokens, components, states, motion
- [`itr-filing-wireframes/USER_FLOWS.md`](../../../itr-filing-wireframes/USER_FLOWS.md) — flow diagrams + interactive prototype links
- [`docs/research/USER_PAINPOINTS_2026.md`](../research/USER_PAINPOINTS_2026.md) — the pain synthesis behind Tab 2
- [`docs/FUNNEL_AUDIT_AND_SIMPLIFICATION.md`](../FUNNEL_AUDIT_AND_SIMPLIFICATION.md) — the ~20 → 11-screen proposal
- [`docs/UX_IMPROVEMENT_PLAN.md`](../UX_IMPROVEMENT_PLAN.md) — prioritized UX fixes

Interactive wireframe prototype: `itr-filing-wireframes/prototype/index.html` (try `?flow=happy`, `?flow=mismatch`, `?viewport=mobile|desktop`).

## How to regenerate this pack

The workbook and CSVs are generated, not hand-edited. To rebuild:

```bash
cd lastminute-itr
python3 scripts/build_ux_research_pack.py
```

Existing-doc rows are embedded in the script. Forum rows come from `_forum_research_raw.json` (merged automatically from `_forum_qna.json`, `_forum_reddit.json`, and `_forum_competitors.json` if those agent partials are present). Requires `openpyxl` for the `.xlsx`; without it, the script still writes the CSV bundle.
