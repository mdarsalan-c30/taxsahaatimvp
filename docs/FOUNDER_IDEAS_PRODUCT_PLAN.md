# Founder Ideas Product Plan & Safety Classification

This document classifies all founder ideas into safety tiers to ensure strict compliance with Indian Income Tax laws and DPDP regulations.

## Safety Classifications

### 1. Tools should improve based on user inputs
**Classification:** Safe and should build.
**Plan:** Implement a feedback loop where user queries (anonymized) train a static FAQ list. No PII should ever be used to train external LLMs.

### 2. Study capital gains tax deeply
**Classification:** Safe but later.
**Plan:** Capital Gains (Schedule CG) is highly complex. We will map out the requirements (MFs, Equity, Property) in `CAPITAL_GAINS_PRODUCT_STUDY.md` and implement it in Phase 5.

### 3. Build AI CA / Tax Genie
**Classification:** Safe and should build (with strict guardrails).
**Plan:** The AI must only suggest *legal* tax-saving opportunities. It must never suggest fake loopholes. Handled in `AI_CA_GENIE_DESIGN.md`.

### 4. Add live filing status counters
**Classification:** Needs compliance review / Safe if real.
**Plan:** We cannot use fake social proof. We will use real database counters or clearly labeled "Demo" counters in preview mode. Handled in `LIVE_STATUS_SOCIAL_PROOF.md`.

### 5. Build Admin Panel
**Classification:** Safe and should build.
**Plan:** We will build this using our existing admin UI connected to PostgreSQL. Handled in `ADMIN_PANEL_REQUIREMENTS.md`.

### 6. Improve Pricing Structure
**Classification:** Safe and should build.
**Plan:** We will implement the dual-plan strategy (Normal ₹359, Pro ₹499). Handled in `PRICING_STRATEGY.md`.

### 7. Add B2B bulk filing purchase plans
**Classification:** Safe and should build.
**Plan:** We will add 20/40/100 application bulk pricing plans with a credit wallet system. Handled in `PRICING_STRATEGY.md`.

### 8. Add session timeout logic
**Classification:** Safe and should build.
**Plan:** Essential for DPDP compliance. Auto-logout and draft saving. Handled in `SESSION_SECURITY_PLAN.md`.

### 9. Train Genie with website keywords without API hit
**Classification:** Safe and should build.
**Plan:** We already have a static `LOCAL_TAX_KNOWLEDGE` dictionary. We will expand this based on the SEO strategy.

### 10. SEO Content Engine & Glossary
**Classification:** Safe and should build.
**Plan:** Build 150 blog topics focused on beginner-friendly tax advice. Handled in `SEO_CONTENT_ENGINE_PLAN.md`.

## Risky Ideas & Safe Alternatives

**Risky:** "Show agriculture income to save tax."
**Safe Alternative:** "Ask if the user genuinely has agricultural income, collect evidence, explain when it is exempt/taxable, and flag high-risk claims for CA review."

**Risky:** "Buy paintings to save tax."
**Safe Alternative:** "Explain that deductions must be supported by law and documents. Do not suggest artificial purchases. Route to CA review if needed."

**Risky:** "Find loopholes."
**Safe Alternative:** "Find legal deductions, missed exemptions, regime optimization, and notice-risk issues."
