import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
} from "@/lib/admin/auth";
import { verifyAdminCredentials } from "@/lib/admin/users";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await verifyAdminCredentials(body.email, body.password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      email: user.email,
      role: user.role,
    });
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionToken(user),
      adminCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
