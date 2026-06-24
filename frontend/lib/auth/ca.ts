import crypto from "crypto";
import { all } from "@/lib/db/store";
import type { Tenant } from "@/lib/db/types";

export const CA_SESSION_COOKIE = "ts_ca_session";
export const CA_SESSION_MAX_AGE_SEC = 60 * 60 * 12; // 12 hours

export interface CASession {
  tenantId: string;
  email: string;
  firmName: string;
  exp: number;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getSessionSecret(): string {
  return process.env.PAYMENT_SESSION_SECRET ?? "dev-ca-session-secret";
}

function sign(encodedPayload: string): string {
  const secret = getSessionSecret();
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createCASessionToken(tenant: Tenant): string {
  const payload: CASession = {
    tenantId: tenant.id,
    email: tenant.email!,
    firmName: tenant.firmName,
    exp: Date.now() + CA_SESSION_MAX_AGE_SEC * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readCASession(token: string | undefined): CASession | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CASession;
    if (
      !session ||
      typeof session.tenantId !== "string" ||
      typeof session.email !== "string" ||
      typeof session.exp !== "number" ||
      session.exp < Date.now()
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function caCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CA_SESSION_MAX_AGE_SEC,
  };
}

export async function verifyCACredentials(email: string, password: string): Promise<Tenant | null> {
  const tenants = await all("tenants");
  const tenant = tenants.find((t) => t.email?.toLowerCase() === email.trim().toLowerCase());
  if (!tenant || !tenant.passwordHash) return null;
  if (tenant.status !== "verified") throw new Error("CA_NOT_VERIFIED");

  const candidate = hashPassword(password);
  const a = Buffer.from(candidate);
  const b = Buffer.from(tenant.passwordHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  
  return tenant;
}
