// ── Minimal Google auth helpers — signed-cookie sessions, no deps ─────────────
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export interface SessionUser {
  email: string;
  name?: string;
  picture?: string;
  exp: number;
}

const COOKIE = "spec_session";
const MAX_AGE_S = 7 * 24 * 3600;

function secret(): string {
  return process.env.AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET || "dev-only-insecure-secret";
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(user: Omit<SessionUser, "exp">): string {
  const body: SessionUser = { ...user, exp: Date.now() + MAX_AGE_S * 1000 };
  const payload = b64url(JSON.stringify(body));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const user = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser;
    if (!user?.email || user.exp < Date.now()) return null;
    return user;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE;
export const SESSION_MAX_AGE = MAX_AGE_S;

export function newState(): string {
  return randomBytes(16).toString("base64url");
}

/** Decodes Google's id_token payload — safe here because it was received
 *  directly from Google's token endpoint over TLS (code exchange). */
export function decodeIdToken(idToken: string): { email?: string; name?: string; picture?: string } {
  try {
    const part = idToken.split(".")[1];
    return JSON.parse(Buffer.from(part, "base64url").toString());
  } catch {
    return {};
  }
}

import type { NextRequest } from "next/server";

export function sessionFromRequest(req: NextRequest): SessionUser | null {
  return verifySessionToken(req.cookies.get(COOKIE)?.value);
}
