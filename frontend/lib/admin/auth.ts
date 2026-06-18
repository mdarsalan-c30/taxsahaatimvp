import crypto from "crypto";
import type { AdminRole } from "@/lib/db/types";

export const ADMIN_SESSION_COOKIE = "ts_admin_session";
/** Admin session lifetime — 12 hours. */
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 12;

export interface AdminUser {
  email: string;
  passwordHash: string;
  role: AdminRole;
}

export interface AdminSession {
  email: string;
  role: AdminRole;
  exp: number;
}

const VALID_ROLES: AdminRole[] = ["ceo", "ops", "engineering", "content"];

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getSessionSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ??
    process.env.PAYMENT_SESSION_SECRET ??
    process.env.RAZORPAY_KEY_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET required in production");
  }
  return "dev-admin-session-secret";
}

/**
 * Admin users come from the ADMIN_USERS env var (JSON array of
 * {email, passwordHash, role}). In development, if none is configured, a single
 * bootstrap CEO is provided so the dashboard is usable out of the box.
 */
export function getAdminUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AdminUser[];
      return parsed.filter(
        (u) =>
          typeof u.email === "string" &&
          typeof u.passwordHash === "string" &&
          VALID_ROLES.includes(u.role)
      );
    } catch {
      // fall through to bootstrap
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const devPassword = process.env.ADMIN_DEV_PASSWORD ?? "admin1234";
    return [
      {
        email: "admin@taxsaathi.local",
        passwordHash: hashPassword(devPassword),
        role: "ceo",
      },
    ];
  }

  return [];
}

export function verifyCredentials(
  email: string,
  password: string
): AdminUser | null {
  const users = getAdminUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!user) return null;
  const candidate = hashPassword(password);
  const a = Buffer.from(candidate);
  const b = Buffer.from(user.passwordHash);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return user;
}

function sign(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createAdminSessionToken(user: AdminUser): string {
  const payload: AdminSession = {
    email: user.email,
    role: user.role,
    exp: Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readAdminSession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSession;
    if (
      !session ||
      typeof session.email !== "string" ||
      !VALID_ROLES.includes(session.role) ||
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

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  };
}
