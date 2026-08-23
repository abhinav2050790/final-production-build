// ── /api/library — list my extractions / save one ─────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";
import { dbEnabled, listByOwner, saveExtraction } from "@/lib/db";
import type { SpecDocument } from "@/lib/types";

export async function GET(req: NextRequest) {
  const user = sessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  if (!dbEnabled()) {
    return NextResponse.json({ error: "library not configured (no DATABASE_URL)" }, { status: 501 });
  }
  try {
    const items = await listByOwner(user.email);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message.slice(0, 140) : "database error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = sessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  if (!dbEnabled()) {
    return NextResponse.json(
      { error: "cloud library needs DATABASE_URL — add it to .env.local / Vercel env vars" },
      { status: 501 }
    );
  }
  try {
    const spec = (await req.json()) as SpecDocument;
    if (!spec?.title || !Array.isArray(spec.products)) {
      return NextResponse.json({ error: "invalid spec payload" }, { status: 400 });
    }
    const record = await saveExtraction(user.email, spec);
    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message.slice(0, 140) : "database error" },
      { status: 500 }
    );
  }
}
