import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  readAdminSession,
  type AdminSession,
} from "./auth";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_KEYS,
  type Permission,
} from "./permissions";
import { resolveRolePermissions } from "./users";

export type { Permission } from "./permissions";

/**
 * Back-compat default matrix: permission → built-in roles allowed by default.
 * Derived from the role defaults in permissions.ts. The live, editable matrix is
 * resolved from the store via `canAsync` / `resolveRolePermissions`.
 */
export const PERMISSIONS: Record<Permission, string[]> = Object.fromEntries(
  PERMISSION_KEYS.map((perm) => [
    perm,
    Object.entries(DEFAULT_ROLE_PERMISSIONS)
      .filter(([, perms]) => perms.includes(perm))
      .map(([role]) => role),
  ])
) as Record<Permission, string[]>;

/** Synchronous check against built-in defaults (no store overrides). */
export function can(role: string, permission: Permission): boolean {
  return (DEFAULT_ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

/** Store-aware check: honors edited matrices and custom roles. */
export async function canAsync(
  role: string,
  permission: Permission
): Promise<boolean> {
  const map = await resolveRolePermissions();
  return (map[role] ?? DEFAULT_ROLE_PERMISSIONS[role] ?? []).includes(
    permission
  );
}

/** Server-component / server-action session read. Returns null if unauthenticated. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return readAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
}

/**
 * API-route guard. Returns the session, or a NextResponse error to return early.
 * Usage:
 *   const auth = await requireAdmin(req, "createCoupon");
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireAdmin(
  request: NextRequest,
  permission?: Permission
): Promise<AdminSession | NextResponse> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = readAdminSession(token);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (permission && !(await canAsync(session.role, permission))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
