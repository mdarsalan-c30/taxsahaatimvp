import { test, expect } from "@playwright/test";

/**
 * CTA path smoke — one test per major entry group (not combinatorial).
 * Serial mode avoids overloading the Next dev server during parallel page loads.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test.describe("CTA paths: marketing", () => {
  test("landing hero CTAs navigate correctly", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Running out of time/i })
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("button", { name: /Start my free estimate/i })
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Upload Form 16", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/file\/import\/documents\?source=form16/, {
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: /Upload your Form 16/i })
    ).toBeVisible();
  });

  test("ITR type quiz renders and suggests outcome", async ({ page }) => {
    await page.goto("/#itr-quiz");
    const quizHeading = page.getByRole("heading", { name: /Find my ITR type/i });
    await expect(quizHeading).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Salary only/i }).click();
    await page.getByRole("button", { name: /One employer/i }).click();
    await page.getByRole("button", { name: /No owned\/rented property income/i }).click();
    await page.getByRole("button", { name: /No — under ₹50L/i }).click();
    await page.getByRole("button", { name: /Resident Indian/i }).click();
    await page.getByRole("button", { name: /See suggestion/i }).click();

    await expect(page.getByText(/ITR-1 \(Sahaj\)/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Continue to filing prep/i })
    ).toHaveAttribute("href", "/file");
  });

  test("final CTA links resolve", async ({ page }) => {
    await page.goto("/");
    const finalSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Ready before the deadline/i }),
    });
    const startLink = finalSection.getByRole("link", { name: /Start filing for/i });
    await expect(startLink).toBeVisible({ timeout: 15_000 });
    await startLink.click();
    await expect(page).toHaveURL(/\/file\/checkout\/plans/, { timeout: 30_000 });
  });

  test("QuickStart connector cards open import paths", async ({ page }) => {
    await page.goto("/");
    const aisLink = page.locator('a[href="/file/import/documents?source=ais"]').first();
    await expect(aisLink).toBeVisible({ timeout: 15_000 });
    await aisLink.click();
    await expect(page).toHaveURL(/\/file\/import\/documents\?source=ais/, {
      timeout: 30_000,
    });
  });
});

test.describe("CTA paths: filing flow", () => {
  test("/file starts eligibility onboarding", async ({ page }) => {
    await page.goto("/file");
    const startLink = page.getByRole("link", { name: /Start my return/i });
    await expect(startLink).toBeVisible();
    await startLink.click();
    await expect(page).toHaveURL(/\/file\/onboarding\/eligibility/, {
      timeout: 30_000,
    });
  });

  test("regime compare page loads", async ({ page }) => {
    await page.goto("/file/regime");
    await expect(
      page.getByRole("heading", { name: /Your Smart Tax Summary/i })
    ).toBeVisible();
  });

  test("presubmit URL redirects to merged risk review", async ({ page }) => {
    await page.goto("/file/review/presubmit");
    await expect(page).toHaveURL(/\/file\/review\/risk#final-check/);
    await expect(
      page.getByRole("heading", { name: /Risk & proof review/i })
    ).toBeVisible();
  });

  test("companion loads with payment bypass env", async ({ page }) => {
    await page.goto("/file/companion");
    await expect(
      page.getByRole("heading", { name: /incometax.gov.in walkthrough/i })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("presubmit bypass CTA reaches companion with incomplete checklist", async ({
    page,
  }) => {
    await page.addInitScript((storageKey) => {
      const draft = {
        state: {
          filingMode: "estimate",
          profile: {
            assessmentYear: "AY 2026-27 (FY 2025-26)",
            residentialStatus: "resident",
            ageBand: "under_60",
          },
          matrix: { income: "4", age: "a", business: "p" },
          income: {
            grossSalary: 0,
            tds: 0,
            fdInterest: 0,
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
          incomeChips: ["business"],
          mismatchResolved: false,
          mismatchProceedWithExplanation: false,
          bankValidated: false,
          regime: "new",
          plan: "diy",
          recommendedForm: "ITR-4",
          paymentVerifiedAt: null,
          paidPlanId: null,
          engineRecommendationCount: 0,
        },
        version: 0,
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }, "lastminute-itr-draft");

    await page.goto("/file/review/risk#final-check");
    await expect(
      page.getByRole("heading", { name: /Pre-submit checklist/i })
    ).toBeVisible({ timeout: 30_000 });

    const openGuide = page.getByRole("link", { name: /Open filing guide/i });
    await expect(openGuide).toBeVisible();
    await expect(openGuide).toBeEnabled();

    await openGuide.click();
    await expect(page).toHaveURL(/\/file\/companion/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /incometax.gov.in walkthrough/i })
    ).toBeVisible({ timeout: 30_000 });
  });
});
