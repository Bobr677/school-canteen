import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "obed_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SECRET = process.env.SESSION_SECRET || "obedklass-local-dev-secret";

interface SessionPayload {
  classId: string;
  exp: number;
}

function signBody(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

export function createSessionToken(classId: string): string {
  const payload: SessionPayload = { classId, exp: Date.now() + MAX_AGE_SECONDS * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signBody(body)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = signBody(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.classId !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload.classId;
  } catch {
    return null;
  }
}

export function getSessionClassId(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    if (part.slice(0, eq) === COOKIE_NAME) {
      try {
        return verifySessionToken(decodeURIComponent(part.slice(eq + 1)));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export interface SessionCookieOptions {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
  secure: boolean;
}

export function sessionCookie(token: string): SessionCookieOptions {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  };
}

export function clearSessionCookie(): SessionCookieOptions {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  };
}
