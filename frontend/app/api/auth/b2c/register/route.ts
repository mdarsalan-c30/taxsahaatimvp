import { NextRequest, NextResponse } from "next/server";
import { all, insert, genId } from "@/lib/db/store";
import { B2CUser } from "@/lib/db/types";
import {
  hashPassword,
  createB2CSessionToken,
  B2C_SESSION_COOKIE,
  b2cCookieOptions,
} from "@/lib/auth/b2c";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const users = await all("b2cUsers");
    const existing = users.find((u) => u.email === normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const newUser: B2CUser = {
      id: genId("b2c"),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    await insert("b2cUsers", newUser);

    // Create session
    const token = createB2CSessionToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const cookieStore = await cookies();
    cookieStore.set(B2C_SESSION_COOKIE, token, b2cCookieOptions());

    return NextResponse.json({ ok: true, user: { name: newUser.name, email: newUser.email } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
