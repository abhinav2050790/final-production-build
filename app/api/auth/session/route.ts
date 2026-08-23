// ── GET /api/auth/session — who am I? ─────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = sessionFromRequest(req);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { email: user.email, name: user.name ?? null, picture: user.picture ?? null },
  });
}
