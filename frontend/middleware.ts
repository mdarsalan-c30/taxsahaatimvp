import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/auth";

/**
 * Edge gate for the admin area: redirect to login when the session cookie is
 * absent. This is a first line of defense only — the admin layout and every
 * /api/admin route independently verify the signed session in the Node runtime
 * (see lib/admin/rbac.ts). Defense in depth.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const hasCookie = request.cookies.has(ADMIN_SESSION_COOKIE);
  if (!hasCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
