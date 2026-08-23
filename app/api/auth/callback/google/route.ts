// ── GET /api/auth/callback/google — exchange code, set session ────────────────
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  decodeIdToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("g_state")?.value;

  if (!clientId || !clientSecret || !code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL(`/?authError=${encodeURIComponent("Google sign-in failed or expired — try again.")}`, req.nextUrl.origin)
    );
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${req.nextUrl.origin}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error(await tokenRes.text());
    const tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokens.id_token) throw new Error("no id_token in response");

    const claims = decodeIdToken(tokens.id_token);
    if (!claims.email) throw new Error("no email in id_token");

    const token = createSessionToken({
      email: claims.email,
      name: claims.name,
      picture: claims.picture,
    });

    const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: req.nextUrl.protocol === "https:",
    });
    res.cookies.delete("g_state");
    return res;
  } catch {
    return NextResponse.redirect(
      new URL(`/?authError=${encodeURIComponent("Could not complete Google sign-in.")}`, req.nextUrl.origin)
    );
  }
}
