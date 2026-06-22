import { describe, expect, it } from "vitest";
import {
  enumerateQuizAnswerPaths,
  MARKETING_CTA_PATHS,
  ctaPathExists,
  resolveCtaRoutePath,
} from "../ctaPaths";
import { getJourneyStep } from "@/lib/filing/journey";
import { suggestItrType } from "@/lib/content/hooks";
import {
  generateItr3MatrixScenarios,
  generateScenarios,
  getScenarioCount,
  MAX_SCENARIO_COUNT,
} from "../scenarios";
import {
  isPythonEngineAvailable,
  runBatch,
  runScenario,
  validateComputeResult,
} from "../runner";
import { draftToUserInput } from "@/lib/engine/draftToUserInput";

const PYTHON_OK = isPythonEngineAvailable();
const SCENARIO_TIMEOUT_MS = 5_000;
// The full combinatorial matrix runs 500+ scenarios through the Python engine and
// takes ~5 minutes. It is intentionally a separate lane (`npm run simulation`, which
// sets RUN_SIMULATION=1) so it never times out the predeploy gate's fast `npm test`.
const RUN_FULL_MATRIX = process.env.RUN_SIMULATION === "1";

describe("simulation: CTA paths", () => {
  it("lists all major marketing CTAs with resolvable routes", () => {
    expect(MARKETING_CTA_PATHS.length).toBeGreaterThanOrEqual(15);
    for (const cta of MARKETING_CTA_PATHS) {
      expect(cta.href).toBeTruthy();
      expect(ctaPathExists(cta.href)).toBe(true);
    }
  });

  it("maps filing CTAs to expected journey steps", () => {
    for (const cta of MARKETING_CTA_PATHS) {
      if (!cta.expectedJourneyStep || cta.href.startsWith("#")) continue;
      const path = resolveCtaRoutePath(cta.href).split("?")[0];
      expect(getJourneyStep(path)).toBe(cta.expectedJourneyStep);
    }
  });

  it("covers all 144 quiz answer combinations", () => {
    const paths = enumerateQuizAnswerPaths();
    expect(paths).toHaveLength(144);

    const outcomes = new Set(paths.map((p) => p.outcome));
    expect(outcomes.has("itr1")).toBe(true);
    expect(outcomes.has("itr2")).toBe(true);
    expect(outcomes.has("talkToCa")).toBe(true);

    for (const path of paths) {
      expect(suggestItrType(path.answers)).toBe(path.outcome);
      expect(path.href).toMatch(/^\/file/);
    }
  });
});

describe.skipIf(!PYTHON_OK)("simulation: combinatorial compute", () => {
  const scenarios = [...generateScenarios(), ...generateItr3MatrixScenarios()];

  it(`generates up to ${MAX_SCENARIO_COUNT} pruned scenarios`, () => {
    const count = getScenarioCount();
    expect(count).toBeGreaterThan(500);
    expect(count).toBeLessThanOrEqual(MAX_SCENARIO_COUNT + 100);
    expect(scenarios.length).toBe(count);
  });

  it.skipIf(!RUN_FULL_MATRIX)(
    "runs full combinatorial matrix without crashes",
    { timeout: 600_000 },
    async () => {
      const summary = await runBatch(scenarios, { concurrency: 12 });

      if (summary.failed > 0) {
        const sample = summary.failures
          .slice(0, 10)
          .map((f) => `${f.id}: ${f.error}`)
          .join("\n");
        console.error(
          `Simulation failures (${summary.failed}/${summary.total}):\n${sample}`
        );
      }

      expect(summary.failed).toBe(0);
      expect(summary.passed).toBe(summary.total);
    }
  );

  it("handles zero-salary interest-only edge case", { timeout: SCENARIO_TIMEOUT_MS }, async () => {
    const result = await runScenario({
      id: "EDGE-FD-ONLY",
      name: "FD interest only",
      draftSlice: {
        filingMode: "estimate",
        profile: {
          assessmentYear: "AY 2026-27 (FY 2025-26)",
          residentialStatus: "resident",
          ageBand: "under_60",
        },
        matrix: { income: "1", age: "a", business: "x" },
        incomeChips: ["fd_interest"],
        income: {
          grossSalary: 0,
          tds: 0,
          fdInterest: 25_000,
          employer: "",
          advanceTax: 0,
          selfAssessmentTax: 0,
          hraReceived: 0,
          actualRentPaid: 0,
          cityTier: "metro",
        },
        houseProperty: {
          propertyType: "none",
          annualRent: 0,
          homeLoanInterest: 0,
          municipalTax: 0,
          coOwnerPercent: 100,
        },
        deductions: {
          section80C: 0,
          section80D: 0,
          section80GG: 0,
          npsExtra: 0,
        },
        connectedConnectors: [],
      },
      expected: { noThrow: true, itrForm: "ITR-1" },
    });
    if (!result.passed) {
      console.error("EDGE-FD-ONLY error:", result.error);
    }
    expect(result.passed).toBe(true);
  });

  it("handles senior 80TTB path", { timeout: SCENARIO_TIMEOUT_MS }, async () => {
      const slice = {
        filingMode: "estimate" as const,
        profile: {
          assessmentYear: "AY 2026-27 (FY 2025-26)",
          residentialStatus: "resident" as const,
          ageBand: "senior" as const,
        },
        matrix: { income: "2" as const, age: "b" as const, business: "x" as const },
        incomeChips: ["salary", "fd_interest"],
        income: {
          grossSalary: 800_000,
          tds: 40_000,
          fdInterest: 60_000,
          employer: "Retired Corp",
          advanceTax: 0,
          selfAssessmentTax: 0,
          hraReceived: 0,
          actualRentPaid: 0,
          cityTier: "metro" as const,
        },
        houseProperty: {
          propertyType: "none" as const,
          annualRent: 0,
          homeLoanInterest: 0,
          municipalTax: 0,
          coOwnerPercent: 100,
        },
        deductions: {
          section80C: 100_000,
          section80D: 25_000,
          section80GG: 0,
          npsExtra: 0,
        },
        connectedConnectors: [] as string[],
      };

      const userInput = draftToUserInput(slice);
      expect(userInput.deductions?.savings_interest_deduction).toBe(50_000);

      const result = await runScenario({
        id: "EDGE-SENIOR-80TTB",
        name: "Senior 80TTB",
        draftSlice: slice,
        expected: { noThrow: true },
      });
      if (!result.passed) {
        console.error("EDGE-SENIOR-80TTB error:", result.error);
      }
      expect(result.passed).toBe(true);
  });
});

describe("simulation: result validation (mock)", () => {
  it("rejects NaN in regime comparison", () => {
    const err = validateComputeResult({
      assessment_year: "2025-26",
      age: 32,
      mode: "estimate",
      profile: {
        age_group: "normal",
        is_senior: false,
        is_super_senior: false,
        new_regime_eligible: true,
        old_regime_eligible: true,
        itr_form: "ITR-1",
        routing_reasons: [],
        expert_required: false,
        out_of_scope_reasons: [],
      },
      income_heads: {
        gross_salary: 1_000_000,
        standard_deduction: 75_000,
        hra_exemption: 0,
        professional_tax: 0,
        lta_exemption: 0,
        net_salary_income: 925_000,
        gross_annual_value: 0,
        municipal_tax: 0,
        net_annual_value: 0,
        repair_deduction_30pct: 0,
        interest_on_loan_24b: 0,
        net_house_property_income: 0,
        excess_interest_disallowed: 0,
        fd_interest: 0,
        savings_interest_gross: 0,
        dividend_income: 0,
        stcg_other_slab: 0,
        total_other_income: 0,
        stcg_111a_net: 0,
        ltcg_112a_net: 0,
        ltcg_other_net: 0,
        gross_total_income: Number.NaN,
        carry_forward_loss_set_off: 0,
      },
      business_income: {
        presumptive_44ad: 0,
        presumptive_44ada: 0,
        books_profit: 0,
        net_business_income: 0,
        section_used: "",
        presumptive_eligible: false,
      },
      deductions: {
        raw_80c_pool: 0,
        capped_80c: 0,
        deduction_80d: 0,
        deduction_80ccd_1b: 0,
        deduction_80ccd_2: 0,
        deduction_80e: 0,
        deduction_80g: 0,
        deduction_80gg: 0,
        deduction_80tta_ttb: 0,
        deduction_80u: 0,
        total_chapter_via: 0,
        new_regime_deductions: 0,
      },
      regime_comparison: {
        old: {
          regime: "old",
          taxable_income: 800_000,
          slab_tax: 50_000,
          special_rate_tax: 0,
          gross_tax: 50_000,
          rebate_87a: 0,
          tax_after_rebate: 50_000,
          surcharge: 0,
          surcharge_rate: 0,
          marginal_relief: 0,
          tax_plus_surcharge: 50_000,
          cess: 2_000,
          total_tax: 52_000,
          tds_and_advance_tax: 40_000,
          net_payable: 12_000,
        },
        new: {
          regime: "new",
          taxable_income: 800_000,
          slab_tax: 45_000,
          special_rate_tax: 0,
          gross_tax: 45_000,
          rebate_87a: 0,
          tax_after_rebate: 45_000,
          surcharge: 0,
          surcharge_rate: 0,
          marginal_relief: 0,
          tax_plus_surcharge: 45_000,
          cess: 1_800,
          total_tax: 46_800,
          tds_and_advance_tax: 40_000,
          net_payable: 6_800,
        },
        recommended_regime: "new",
        tax_saving: 5_200,
        breakeven_deductions: 0,
        deductions_lost_in_new: 0,
        old_effective_rate: 0,
        new_effective_rate: 0,
      },
      risk_flags: [],
      recommendations: [],
      confidence: {
        completeness_score: 80,
        filing_ready: false,
        missing_documents: [],
        ca_escalation_recommended: false,
        ca_escalation_reasons: [],
        is_estimate_mode: true,
      },
    });
    expect(err).toContain("gross_total_income");
  });
});
