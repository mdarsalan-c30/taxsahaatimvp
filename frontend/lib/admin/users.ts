import crypto from "crypto";
import { all, genId, insert, remove, update } from "@/lib/db/store";
import type { AdminRoleRow, AdminUserRow, AdminUserStatus } from "@/lib/db/types";
import { getAdminUsers, hashPassword } from "./auth";
import {
  BUILTIN_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  isPermission,
  type Permission,
} from "./permissions";

/**
 * Store-backed admin users and roles — the durable layer behind the Settings ▸
 * Team screen. Runs in the Node runtime only (never imported by middleware).
 *
 * Two sources of admin accounts coexist:
 *  - ENV bootstrap users (ADMIN_USERS / dev default) — read-only, always present
 *    so production can never lock itself out before a DB is connected.
 *  - Store users — created/edited from the UI; durable once DATABASE_URL exists.
 */

export interface EffectiveAdminUser {
  id: string;
  email: string;
  role: string;
  status: AdminUserStatus;
  source: "env" | "store";
  createdBy?: string;
  createdAt?: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listStoreUsers(): Promise<AdminUserRow[]> {
  const rows = await all("adminUsers");
  return [...rows].sort((a, b) => a.email.localeCompare(b.email));
}

/** ENV bootstrap users as effective rows (read-only). */
export function listEnvUsers(): EffectiveAdminUser[] {
  return getAdminUsers().map((u) => ({
    id: `env:${normalizeEmail(u.email)}`,
    email: u.email,
    role: u.role,
    status: "active",
    source: "env",
  }));
}

/** Merged view for the UI: ENV bootstrap users + store users (store wins on email). */
export async function listEffectiveUsers(): Promise<EffectiveAdminUser[]> {
  const env = listEnvUsers();
  const store = await listStoreUsers();
  const storeEmails = new Set(store.map((u) => normalizeEmail(u.email)));
  const envOnly = env.filter((u) => !storeEmails.has(normalizeEmail(u.email)));
  const storeRows: EffectiveAdminUser[] = store.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    status: u.status,
    source: "store",
    createdBy: u.createdBy,
    createdAt: u.createdAt,
  }));
  return [...envOnly, ...storeRows].sort((a, b) => a.email.localeCompare(b.email));
}

async function emailTaken(email: string): Promise<boolean> {
  const norm = normalizeEmail(email);
  if (listEnvUsers().some((u) => normalizeEmail(u.email) === norm)) return true;
  const store = await all("adminUsers");
  return store.some((u) => normalizeEmail(u.email) === norm);
}

export async function createAdminUser(input: {
  email: string;
  password: string;
  role: string;
  createdBy?: string;
}): Promise<{ user?: AdminUserRow; error?: string }> {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address" };
  }
  if (!input.password || input.password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (!(await roleExists(input.role))) {
    return { error: `Unknown role: ${input.role}` };
  }
  if (await emailTaken(email)) {
    return { error: "A user with this email already exists" };
  }
  const now = new Date().toISOString();
  const user: AdminUserRow = {
    id: genId("usr"),
    email,
    passwordHash: hashPassword(input.password),
    role: input.role,
    status: "active",
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  return { user: await insert("adminUsers", user) };
}

export async function updateAdminUser(
  id: string,
  patch: { role?: string; status?: AdminUserStatus; password?: string }
): Promise<{ user?: AdminUserRow; error?: string }> {
  const next: Partial<AdminUserRow> = { updatedAt: new Date().toISOString() };
  if (patch.role !== undefined) {
    if (!(await roleExists(patch.role))) {
      return { error: `Unknown role: ${patch.role}` };
    }
    next.role = patch.role;
  }
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.password !== undefined) {
    if (patch.password.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }
    next.passwordHash = hashPassword(patch.password);
  }
  const user = await update("adminUsers", id, next);
  if (!user) return { error: "User not found" };
  return { user };
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  return remove("adminUsers", id);
}

/**
 * Verify login credentials against store users (active only) first, then ENV
 * bootstrap users. Returns the resolved identity or null.
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ email: string; role: string } | null> {
  const norm = normalizeEmail(email);
  const candidate = hashPassword(password);

  const store = await all("adminUsers");
  const storeUser = store.find((u) => normalizeEmail(u.email) === norm);
  if (storeUser) {
    if (storeUser.status !== "active") return null;
    if (timingSafeEqualStr(candidate, storeUser.passwordHash)) {
      return { email: storeUser.email, role: storeUser.role };
    }
    return null;
  }

  const envUser = getAdminUsers().find((u) => normalizeEmail(u.email) === norm);
  if (envUser && timingSafeEqualStr(candidate, envUser.passwordHash)) {
    return { email: envUser.email, role: envUser.role };
  }
  return null;
}

// ── Roles & permission matrix ───────────────────────────────────────────────

export interface ResolvedRole {
  key: string;
  label: string;
  builtin: boolean;
  permissions: Permission[];
  userCount: number;
}

function sanitizePermissions(perms: string[]): Permission[] {
  return Array.from(new Set(perms.filter(isPermission)));
}

/** Built-in roles overlaid with store overrides + any custom roles. */
export async function listRoles(): Promise<ResolvedRole[]> {
  const storeRoles = await all("adminRoles");
  const byKey = new Map(storeRoles.map((r) => [r.key, r]));
  const users = await all("adminUsers");
  const countFor = (key: string) =>
    users.filter((u) => u.role === key).length +
    listEnvUsers().filter((u) => u.role === key).length;

  const result: ResolvedRole[] = [];
  for (const def of BUILTIN_ROLES) {
    const override = byKey.get(def.key);
    result.push({
      key: def.key,
      label: override?.label ?? def.label,
      builtin: true,
      permissions: override
        ? sanitizePermissions(override.permissions)
        : def.permissions,
      userCount: countFor(def.key),
    });
  }
  for (const r of storeRoles) {
    if (BUILTIN_ROLES.some((b) => b.key === r.key)) continue;
    result.push({
      key: r.key,
      label: r.label,
      builtin: false,
      permissions: sanitizePermissions(r.permissions),
      userCount: countFor(r.key),
    });
  }
  return result;
}

/** role key → permission set, merging defaults with store overrides. */
export async function resolveRolePermissions(): Promise<
  Record<string, Permission[]>
> {
  const map: Record<string, Permission[]> = { ...DEFAULT_ROLE_PERMISSIONS };
  const storeRoles = await all("adminRoles");
  for (const r of storeRoles) {
    map[r.key] = sanitizePermissions(r.permissions);
  }
  return map;
}

export async function roleExists(key: string): Promise<boolean> {
  if (BUILTIN_ROLES.some((b) => b.key === key)) return true;
  const storeRoles = await all("adminRoles");
  return storeRoles.some((r) => r.key === key);
}

async function upsertRoleRow(input: {
  key: string;
  label: string;
  builtin: boolean;
  permissions: Permission[];
}): Promise<AdminRoleRow> {
  const existing = (await all("adminRoles")).find((r) => r.key === input.key);
  const now = new Date().toISOString();
  if (existing) {
    const updated = await update("adminRoles", existing.id, {
      label: input.label,
      permissions: input.permissions,
      updatedAt: now,
    });
    return updated as AdminRoleRow;
  }
  return insert("adminRoles", {
    id: genId("role"),
    key: input.key,
    label: input.label,
    builtin: input.builtin,
    permissions: input.permissions,
    createdAt: now,
    updatedAt: now,
  });
}

/** Edit the permission set (and optional label) of an existing role. */
export async function setRolePermissions(
  key: string,
  permissions: string[],
  label?: string
): Promise<{ role?: ResolvedRole; error?: string }> {
  if (!(await roleExists(key))) return { error: `Unknown role: ${key}` };
  const builtin = BUILTIN_ROLES.some((b) => b.key === key);
  const def = BUILTIN_ROLES.find((b) => b.key === key);
  const resolvedLabel =
    label?.trim() ||
    def?.label ||
    (await all("adminRoles")).find((r) => r.key === key)?.label ||
    key;
  await upsertRoleRow({
    key,
    label: resolvedLabel,
    builtin,
    permissions: sanitizePermissions(permissions),
  });
  const role = (await listRoles()).find((r) => r.key === key);
  return { role };
}

export async function createCustomRole(input: {
  key: string;
  label: string;
  permissions: string[];
}): Promise<{ role?: ResolvedRole; error?: string }> {
  const key = input.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  if (!key) return { error: "Role key is required" };
  if (await roleExists(key)) {
    return { error: `Role "${key}" already exists` };
  }
  await upsertRoleRow({
    key,
    label: input.label.trim() || key,
    builtin: false,
    permissions: sanitizePermissions(input.permissions),
  });
  const role = (await listRoles()).find((r) => r.key === key);
  return { role };
}

export async function deleteCustomRole(
  key: string
): Promise<{ ok?: boolean; error?: string }> {
  if (BUILTIN_ROLES.some((b) => b.key === key)) {
    return { error: "Built-in roles cannot be deleted" };
  }
  const inUse =
    (await all("adminUsers")).some((u) => u.role === key) ||
    listEnvUsers().some((u) => u.role === key);
  if (inUse) {
    return { error: "Reassign users off this role before deleting it" };
  }
  const row = (await all("adminRoles")).find((r) => r.key === key);
  if (!row) return { error: "Role not found" };
  await remove("adminRoles", row.id);
  return { ok: true };
}
