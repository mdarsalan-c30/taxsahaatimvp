import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "ts_admin_session";
/** Admin session lifetime — 12 hours. */
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 12;

export interface AdminUser {
  email: string;
  passwordHash: string;
  role: string;
}

export interface AdminSession {
  email: string;
  /** Built-in or custom role key; permissions are resolved from the role config. */
  role: string;
  exp: number;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getSessionSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ??
    process.env.PAYMENT_SESSION_SECRET ??
    process.env.RAZORPAY_KEY_SECRET;
  console.log("[DEBUG] getSessionSecret resolved:", secret ? "CUSTOM_SECRET_PRESENT" : "dev-admin-session-secret");
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
          typeof u.role === "string" &&
          u.role.length > 0
      );
    } catch {
      // fall through to bootstrap
    }
  }

  // Return the default bootstrap user as a fallback
  const devPassword = process.env.ADMIN_DEV_PASSWORD ?? "ITR2026";
  return [
    {
      email: "emailnikhil95@gmail.com",
      passwordHash: hashPassword(devPassword),
      role: "ceo",
    },
  ];
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
  const secret = getSessionSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createAdminSessionToken(user: {
  email: string;
  role: string;
}): string {
  const payload: AdminSession = {
    email: user.email,
    role: user.role,
    exp: Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encoded}.${sign(encoded)}`;
  console.log("[DEBUG] createAdminSessionToken payload:", payload, "token signature sample:", token.slice(-10));
  return token;
}

export function readAdminSession(token: string | undefined): AdminSession | null {
  console.log("[DEBUG] readAdminSession input token exists:", !!token);
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    console.log("[DEBUG] readAdminSession split failed");
    return null;
  }
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.log("[DEBUG] readAdminSession signature mismatch! signature:", signature.slice(-5), "expected:", expected.slice(-5));
    return null;
  }
  try {
    const session = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as AdminSession;
    console.log("[DEBUG] readAdminSession parsed session email:", session?.email, "exp:", session?.exp, "expired:", session?.exp < Date.now());
    if (
      !session ||
      typeof session.email !== "string" ||
      typeof session.role !== "string" ||
      session.role.length === 0 ||
      typeof session.exp !== "number" ||
      session.exp < Date.now()
    ) {
      console.log("[DEBUG] readAdminSession check failed: session properties invalid or expired");
      return null;
    }
    return session;
  } catch (err) {
    console.log("[DEBUG] readAdminSession JSON parse error:", err);
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
