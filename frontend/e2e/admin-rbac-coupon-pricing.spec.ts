import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Admin E2E: RBAC enforcement, coupon lifecycle, and pricing propagation.
 *
 * Runs against the dev server (NODE_ENV != production), where a bootstrap CEO
 * (admin@taxsaathi.local / admin1234) is provided by lib/admin/auth.ts when
 * ADMIN_USERS is not configured. Mock orders (order_mock_) are allowed in dev.
 */

const DEV_ADMIN = {
  email: "admin@taxsaathi.local",
  password: "admin1234",
};

async function loginAsAdmin(request: APIRequestContext): Promise<void> {
  const res = await request.post("/api/admin/login", { data: DEV_ADMIN });
  expect(res.status(), "dev admin login should succeed").toBe(200);
  const body = (await res.json()) as { ok?: boolean; role?: string };
  expect(body.ok).toBe(true);
  expect(body.role).toBe("ceo");
}

test.describe("admin: RBAC", () => {
  test("unauthenticated /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("unauthenticated admin API is rejected with 401", async ({ request }) => {
    const res = await request.post("/api/admin/coupons", {
      data: { code: "SHOULD_NOT_WORK" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("admin: coupon lifecycle", () => {
  test("CEO creates a full-unlock coupon; public validate + redeem works", async ({
    request,
  }) => {
    await loginAsAdmin(request);

    const code = `E2E${Date.now().toString().slice(-8)}`;

    const create = await request.post("/api/admin/coupons", {
      data: {
        code,
        planScope: "any",
        lane: "b2c",
        discount: "full",
        maxUses: 5,
        validityDays: 7,
      },
    });
    expect(create.status()).toBe(200);
    const created = (await create.json()) as {
      ok?: boolean;
      coupon?: { id: string; code: string };
    };
    expect(created.ok).toBe(true);
    expect(created.coupon?.code).toBe(code);

    // Public validation should accept it.
    const validate = await request.post("/api/coupons/validate", {
      data: { code, planId: "ai_smart" },
    });
    expect(validate.status()).toBe(200);
    const validated = (await validate.json()) as {
      valid?: boolean;
      discount?: string;
    };
    expect(validated.valid).toBe(true);
    expect(validated.discount).toBe("full");

    // Public redeem should unlock without Razorpay.
    const redeem = await request.post("/api/coupons/redeem", {
      data: { code, planId: "ai_smart", sessionId: `e2e_${Date.now()}` },
    });
    expect(redeem.status()).toBe(200);
    const redeemed = (await redeem.json()) as {
      unlocked?: boolean;
      planId?: string;
    };
    expect(redeemed.unlocked).toBe(true);
    expect(redeemed.planId).toBe("ai_smart");
  });

  test("invalid coupon code is rejected by public validate", async ({
    request,
  }) => {
    const res = await request.post("/api/coupons/validate", {
      data: { code: "NOPE_DOES_NOT_EXIST", planId: "ai_smart" },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { valid?: boolean };
    expect(body.valid).toBe(false);
  });

  test("CEO can publish pricing without error", async ({ request }) => {
    await loginAsAdmin(request);
    const publish = await request.post("/api/admin/pricing", {
      data: {
        rows: [{ planId: "diy", basePriceInr: 1234, offerPriceInr: null }],
      },
    });
    expect(publish.status()).toBe(200);
    // Note: cross-instance read-back (create-order amount) is asserted in the
    // single-process integration test lib/pricing/__tests__/config.test.ts,
    // since the dev file store caches per module instance.
  });
});
