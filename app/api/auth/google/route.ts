// ── GET /api/auth/google — start the Google OAuth flow ────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { newState, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local (console.cloud.google.com → APIs & Services → Credentials → OAuth client ID, type Web).",
      },
      { status: 501 }
    );
  }

  const origin = req.nextUrl.origin;
  const state = newState();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/callback/google`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  res.cookies.set("g_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  // touch import so bundler keeps cookie name export aligned
  void SESSION_COOKIE_NAME;
  return res;
}
