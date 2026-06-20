import { test, expect } from "@playwright/test";

const DRAFT_STORAGE_KEY = "lastminute-itr-draft";

/**
 * Smoke: mock payment unlock → companion guide loads.
 * Uses order_mock_ bypass (non-production, no Razorpay keys).
 */
test.describe("smoke: payment to companion", () => {
  test("mock payment unlocks companion walkthrough", async ({ page }) => {
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
          connectedConnectors: ["form16"],
          incomeChips: ["salary"],
          mismatchResolved: true,
          mismatchProceedWithExplanation: false,
          bankValidated: true,
          regime: "new",
          plan: "diy",
          recommendedForm: "ITR-1",
          paymentVerifiedAt: null,
          paidPlanId: null,
          engineRecommendationCount: 0,
        },
        version: 0,
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }, DRAFT_STORAGE_KEY);

    await page.goto("/file/checkout/payment");
    await expect(
      page.getByRole("heading", { name: /Payment & tax summary/i })
    ).toBeVisible({ timeout: 15_000 });

    const payButton = page.getByRole("button", {
      name: /Pay .* unlock filing guide/i,
    });
    await expect(payButton).toBeVisible();
    await expect(payButton).toBeEnabled();

    const verifyResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/payments/verify") && res.status() === 200
    );

    await payButton.click();
    const verify = await verifyResponse;
    const verifyBody = (await verify.json()) as { verified?: boolean; mock?: boolean };
    expect(verifyBody.verified).toBe(true);
    expect(verifyBody.mock).toBe(true);

    await page.waitForURL(/\/file\/companion/, { timeout: 30_000 });
    await expect(page).toHaveURL(/unlocked=1/);

    await expect(
      page.getByRole("heading", { name: /incometax\.gov\.in walkthrough/i })
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      page.getByText("Personal filing guide")
    ).toBeVisible();
  });
});
