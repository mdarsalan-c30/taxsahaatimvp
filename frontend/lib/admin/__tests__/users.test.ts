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
import {
  createAdminUser,
  createCustomRole,
  resolveRolePermissions,
  setRolePermissions,
  updateAdminUser,
  verifyAdminCredentials,
} from "@/lib/admin/users";

describe("self-serve team management", () => {
  afterEach(() => resetCache());

  it("creates a user and authenticates it; disabled users cannot log in", async () => {
    resetCache();
    const { user, error } = await createAdminUser({
      email: "Ops@TaxSaathi.com",
      password: "supersecret",
      role: "ops",
      createdBy: "ceo@taxsaathi.com",
    });
    expect(error).toBeUndefined();
    expect(user?.email).toBe("ops@taxsaathi.com");

    const ok = await verifyAdminCredentials("ops@taxsaathi.com", "supersecret");
    expect(ok).toEqual({ email: "ops@taxsaathi.com", role: "ops" });

    const bad = await verifyAdminCredentials("ops@taxsaathi.com", "wrong");
    expect(bad).toBeNull();

    await updateAdminUser(user!.id, { status: "disabled" });
    const disabled = await verifyAdminCredentials(
      "ops@taxsaathi.com",
      "supersecret"
    );
    expect(disabled).toBeNull();
  });

  it("rejects duplicate emails and short passwords", async () => {
    resetCache();
    await createAdminUser({
      email: "dupe@taxsaathi.com",
      password: "longenough",
      role: "ops",
    });
    const dup = await createAdminUser({
      email: "dupe@taxsaathi.com",
      password: "longenough",
      role: "ops",
    });
    expect(dup.error).toMatch(/already exists/i);

    const short = await createAdminUser({
      email: "new@taxsaathi.com",
      password: "short",
      role: "ops",
    });
    expect(short.error).toMatch(/8 characters/i);
  });

  it("editing the matrix overrides built-in role permissions", async () => {
    resetCache();
    const before = await resolveRolePermissions();
    expect(before.engineering).not.toContain("editPricing");

    await setRolePermissions("engineering", ["viewDashboard", "editPricing"]);
    const after = await resolveRolePermissions();
    expect(after.engineering).toContain("editPricing");
    expect(after.engineering).not.toContain("viewAudit");
  });

  it("supports custom roles with their own permission set", async () => {
    resetCache();
    const { role, error } = await createCustomRole({
      key: "finance",
      label: "Finance",
      permissions: ["viewDashboard", "refundPayment"],
    });
    expect(error).toBeUndefined();
    expect(role?.key).toBe("finance");

    const map = await resolveRolePermissions();
    expect(map.finance).toEqual(
      expect.arrayContaining(["viewDashboard", "refundPayment"])
    );

    // A user can be assigned the custom role and authenticate.
    await createAdminUser({
      email: "fin@taxsaathi.com",
      password: "longenough",
      role: "finance",
    });
    const ok = await verifyAdminCredentials("fin@taxsaathi.com", "longenough");
    expect(ok?.role).toBe("finance");
  });
});
