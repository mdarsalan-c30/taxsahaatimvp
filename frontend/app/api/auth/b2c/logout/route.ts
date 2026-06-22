import { NextResponse } from "next/server";
import { B2C_SESSION_COOKIE } from "@/lib/auth/b2c";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(B2C_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
