import { NextRequest, NextResponse } from "next/server";
import { all } from "@/lib/db/store";
import {
  hashPassword,
  createB2CSessionToken,
  B2C_SESSION_COOKIE,
  b2cCookieOptions,
} from "@/lib/auth/b2c";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const users = await all("b2cUsers");
    const user = users.find((u) => u.email === normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const candidateHash = hashPassword(password);
    const a = Buffer.from(candidateHash);
    const b = Buffer.from(user.passwordHash);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const token = createB2CSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(B2C_SESSION_COOKIE, token, b2cCookieOptions());

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
