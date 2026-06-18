import { afterEach, describe, expect, it, vi } from "vitest";

// Keep the admin store purely in-memory: no file reads/writes during the test.
vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(() => Promise.reject(new Error("no file"))),
    writeFile: vi.fn(() => Promise.resolve()),
    mkdir: vi.fn(() => Promise.resolve()),
  },
}));

import { resetCache } from "@/lib/db/store";
import { getPublishedPrice, upsertPricingRow } from "@/lib/pricing/config";

describe("pricing config propagation", () => {
  afterEach(() => resetCache());

  it("getPublishedPrice reflects a published base price override", async () => {
    resetCache();
    await upsertPricingRow({
      planId: "diy",
      basePriceInr: 1234,
      offerPriceInr: null,
    });
    expect(await getPublishedPrice("diy")).toBe(1234);
  });

  it("an active offer price wins over the base price", async () => {
    resetCache();
    const future = new Date(Date.now() + 86_400_000).toISOString();
    await upsertPricingRow({
      planId: "ai_smart",
      basePriceInr: 1999,
      offerPriceInr: 999,
      offerEndsAt: future,
    });
    expect(await getPublishedPrice("ai_smart")).toBe(999);
  });

  it("an expired offer falls back to the base price", async () => {
    resetCache();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    await upsertPricingRow({
      planId: "ca",
      basePriceInr: 2999,
      offerPriceInr: 1499,
      offerEndsAt: past,
    });
    expect(await getPublishedPrice("ca")).toBe(2999);
  });
});
