import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyCACredentials,
  createCASessionToken,
  CA_SESSION_COOKIE,
  caCookieOptions,
} from "@/lib/auth/ca";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if they are an individual (B2C) user
    const { all } = await import("@/lib/db/store");
    const b2cUsers = await all("b2cUsers");
    const isB2CUser = b2cUsers.some((u) => u.email === normalizedEmail);

    if (isB2CUser) {
      return NextResponse.json(
        { error: "This email is registered as an individual user. Please log in through the normal login page." },
        { status: 401 }
      );
    }

    let tenant;
    try {
      tenant = await verifyCACredentials(email, password);
    } catch (err: any) {
      if (err.message === "CA_NOT_VERIFIED") {
        return NextResponse.json(
          { error: "Your CA application is still pending admin approval or has been rejected." },
          { status: 403 }
        );
      }
      throw err;
    }

    if (!tenant) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = createCASessionToken(tenant);
    const cookieStore = await cookies();
    cookieStore.set(CA_SESSION_COOKIE, token, caCookieOptions());

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("CA login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
