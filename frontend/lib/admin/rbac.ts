import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { AdminRole } from "@/lib/db/types";
import {
  ADMIN_SESSION_COOKIE,
  readAdminSession,
  type AdminSession,
} from "./auth";

/** Privileged admin actions, mapped to the roles allowed to perform them (§6). */
export const PERMISSIONS = {
  viewDashboard: ["ceo", "ops", "engineering"],
  createCoupon: ["ceo", "ops"],
  revokeCoupon: ["ceo", "ops"],
  editPricing: ["ceo"],
  refundPayment: ["ceo"],
  manageCrm: ["ceo", "ops"],
  verifyCa: ["ceo", "ops"],
  deleteUserData: ["ceo", "ops"],
  editContent: ["ceo", "content"],
  viewAudit: ["ceo", "engineering"],
} as const satisfies Record<string, readonly AdminRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: AdminRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly AdminRole[]).includes(role);
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
  if (permission && !can(session.role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
