// ── /api/library/[slug] — delete my own extraction ────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";
import { dbEnabled, deleteExtraction } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const user = sessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  if (!dbEnabled()) return NextResponse.json({ error: "library not configured" }, { status: 501 });
  const { slug } = await ctx.params;
  const ok = await deleteExtraction(slug, user.email);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
