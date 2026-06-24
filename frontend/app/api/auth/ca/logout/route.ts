import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CA_SESSION_COOKIE } from "@/lib/auth/ca";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(CA_SESSION_COOKIE);
  return NextResponse.redirect(new URL("/auth/ca-login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
