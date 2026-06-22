import crypto from "crypto";

export const B2C_SESSION_COOKIE = "ts_b2c_session";
/** B2C session lifetime — 30 days. */
export const B2C_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export interface B2CSession {
  userId: string;
  email: string;
  name: string;
  exp: number;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function getSessionSecret(): string {
  const secret = process.env.PAYMENT_SESSION_SECRET ?? "dev-b2c-session-secret";
  return secret;
}

function sign(encodedPayload: string): string {
  const secret = getSessionSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createB2CSessionToken(user: {
  id: string;
  email: string;
  name: string;
}): string {
  const payload: B2CSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    exp: Date.now() + B2C_SESSION_MAX_AGE_SEC * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encoded}.${sign(encoded)}`;
  return token;
}

export function readB2CSession(token: string | undefined): B2CSession | null {
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
    ) as B2CSession;
    if (
      !session ||
      typeof session.userId !== "string" ||
      typeof session.email !== "string" ||
      typeof session.exp !== "number" ||
      session.exp < Date.now()
    ) {
      return null;
    }
    return session;
  } catch (err) {
    return null;
  }
}

export function b2cCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: B2C_SESSION_MAX_AGE_SEC,
  };
}
