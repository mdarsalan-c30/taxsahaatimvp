import { test, expect } from "@playwright/test";

const DRAFT_STORAGE_KEY = "lastminute-itr-draft";

test.describe("smoke: salaried happy path", () => {
  test("landing loads with hero and primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Running out of time/i })
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("button", { name: /Start my free estimate/i })
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByLabel(/your name/i)
    ).toBeVisible();
  });

  test("form16 fast path opens documents import", async ({ page }) => {
    await page.goto("/file/import/documents?source=form16");
    await expect(
      page.getByRole("heading", { name: /Upload your Form 16/i })
    ).toBeVisible();
    await expect(page.getByText(/Document parsing/i)).toBeVisible();
  });

  test("import documents mode cards switch start paths", async ({ page }) => {
    await page.goto("/file/import/documents");
    await expect(
      page.getByRole("heading", { name: /Let's get your data in/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /Start with estimates/i }).click();
    await expect(
      page.getByText(/No worries — rough numbers are fine/i)
    ).toBeVisible();
    await expect(page.getByPlaceholder("e.g. 12,00,000")).toBeVisible();

    await page.getByRole("button", { name: /Clear selection/i }).click();
    await expect(
      page.getByText(/Pick how you want to start/i)
    ).toBeVisible();

    await page.getByRole("button", { name: /Import from ITD/i }).click();
    await expect(
      page.getByText(/Import from ITD is coming soon/i)
    ).toBeVisible();

    await page.getByRole("button", { name: /Upload Form 16/i }).click();
    await expect(page.getByText(/Document parsing/i)).toBeVisible();
  });

  test("estimate path routes to regime compare", async ({ page }) => {
    await page.goto("/file/import/documents");
    await page.getByRole("button", { name: /Start with estimates/i }).click();
    await page.getByPlaceholder("e.g. 12,00,000").fill("1500000");
    await page.getByRole("button", { name: /See my tax estimate/i }).click();
    await expect(
      page.getByRole("heading", { name: /Your Smart Tax Summary/i })
    ).toBeVisible();
  });

  test("form16 fast path routes to additional-income eligibility", async ({
    page,
  }) => {
    await page.goto("/file/import/documents?source=form16");
    const continueCta = page.getByRole("link", {
      name: /Continue — upload Form 16 first|Tell us what else you earned/i,
    });
    await expect(continueCta).toBeVisible();
    await expect(continueCta).toBeEnabled();
    await continueCta.click();
    await expect(
      page.getByRole("heading", { name: /Anything else this year/i })
    ).toBeVisible();
    await expect(
      page.getByText(/Is your income mostly from salary/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Do you run a business or freelance/i)
    ).toBeVisible();
  });

  test("mismatch salary actions navigate to detail", async ({ page }) => {
    await page.goto("/file/import/mismatch");
    await page.getByRole("link", { name: "Fix now" }).click();
    await expect(
      page.getByRole("heading", { name: /Salary mismatch/i })
    ).toBeVisible();
    await page.getByRole("link", { name: "Back" }).click();
    await page.getByRole("link", { name: "AIS feedback guide" }).click();
    await expect(
      page.getByRole("heading", { name: /Salary mismatch/i })
    ).toBeVisible();
  });

  test("chat sends message and receives support reply", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: /Support chat/i })).toBeVisible();
    await page.getByPlaceholder("Type your question…").fill("How do I upload Form 16?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("How do I upload Form 16?")).toBeVisible();
    await expect(page.getByText(/Thanks for reaching out/i)).toBeVisible();
  });

  test("form16 eligibility screen recommends ITR form from income chips", async ({
    page,
  }) => {
    await page.goto(
      "/file/onboarding/eligibility?source=form16&step=additional-income"
    );
    await expect(
      page.getByRole("heading", { name: /Anything else this year/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /Yes, business \/ freelance/i }).click();
    await expect(page.getByText("Recommended: ITR-4")).toBeVisible();
  });

  test("eligibility reset clears income chip selections", async ({ page }) => {
    await page.goto(
      "/file/onboarding/eligibility?source=form16&step=additional-income"
    );
    await page.getByRole("button", { name: /Yes, business \/ freelance/i }).click();
    await expect(page.getByText("Recommended: ITR-4")).toBeVisible();

    await page.getByRole("button", { name: /Reset this step/i }).click();
    await expect(page.getByText("Recommended: ITR-1")).toBeVisible();
  });

  test("regime compare page loads and shows computed cards", async ({ page }) => {
    await page.addInitScript((storageKey) => {
      const draft = {
        state: {
          filingMode: "estimate",
          profile: {
            assessmentYear: "AY 2026-27 (FY 2025-26)",
            residentialStatus: "resident",
            ageBand: "under_60",
          },
          matrix: { income: "2", age: "a", business: "x" },
          income: {
            grossSalary: 1200000,
            tds: 85000,
            fdInterest: 18400,
            employer: "Acme Pvt Ltd",
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
            section80C: 150000,
            section80D: 25000,
            section80GG: 0,
            npsExtra: 50000,
          },
          connectedConnectors: [],
          incomeChips: ["salary", "fd_interest"],
          mismatchResolved: true,
          regime: null,
          engineRecommendationCount: 0,
        },
        version: 0,
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }, DRAFT_STORAGE_KEY);

    await page.goto("/file/regime");
    await expect(
      page.getByRole("heading", { name: /Your Smart Tax Summary/i })
    ).toBeVisible();

    await expect(page.getByText(/Calculating your best tax regime/i)).toBeHidden({
      timeout: 30_000,
    });

    const cardGrid = page.locator(".filing-card-grid");
    const oldRegimeCard = cardGrid.getByRole("button", { name: /Old regime/i });
    const newRegimeCard = cardGrid.getByRole("button", { name: /New regime/i });
    await expect(oldRegimeCard).toBeVisible();
    await expect(newRegimeCard).toBeVisible();
    await expect(oldRegimeCard).toContainText(/₹/);
    await expect(newRegimeCard).toContainText(/₹/);
    await expect(oldRegimeCard).toBeEnabled();
    await expect(newRegimeCard).toBeEnabled();
  });

  test("checkout plans shows paywall guard or value stack", async ({ page }) => {
    await page.addInitScript((storageKey) => {
      const draft = {
        state: {
          mismatchResolved: false,
          bankValidated: true,
          regime: "new",
          plan: "ai_smart",
          recommendedForm: "ITR-1",
        },
        version: 0,
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }, DRAFT_STORAGE_KEY);

    await page.goto("/file/checkout/plans");
    await expect(
      page.getByRole("heading", { name: /Ready to file\? Unlock your guide/i })
    ).toBeVisible();

    const valueStack = page.getByLabel(/Your earned value before checkout/i);
    await expect(valueStack).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Recommended for you AI Smart/i })
    ).toHaveAttribute("disabled", "");
  });
});
