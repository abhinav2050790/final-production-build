// ── /api/chat — ask questions over an extracted spec document ─────────────────
import { NextRequest, NextResponse } from "next/server";
import { aiComplete } from "@/lib/ai";
import { sessionFromRequest } from "@/lib/auth";
import { dbEnabled, getPublicSpec } from "@/lib/db";
import { checkRate } from "@/lib/rateLimit";
import type { SpecDocument } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function compactSpec(spec: SpecDocument): string {
  const lines: string[] = [`Title: ${spec.title}`, `Products (${spec.products.length}):`];
  for (const p of spec.products) {
    lines.push(
      `- ${p.name}${p.brand ? ` | brand: ${p.brand}` : ""}${p.partNumber ? ` | part#: ${p.partNumber}` : ""}`
    );
    for (const a of p.attributes) lines.push(`    ${a.name}: ${a.value}`);
    if (p.keyFeatures?.length) lines.push(`    features: ${p.keyFeatures.join("; ")}`);
  }
  return lines.join("\n").slice(0, 7000);
}

export async function POST(req: NextRequest) {
  let body: { question?: string; slug?: string; spec?: SpecDocument };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const question = body.question?.toString().trim() ?? "";
  if (question.length < 3) return NextResponse.json({ error: "ask a real question" }, { status: 400 });

  // Resolve the spec: shared link first, else the caller's inline copy.
  let spec: SpecDocument | null = null;
  if (body.slug) {
    if (!dbEnabled()) return NextResponse.json({ error: "library not configured" }, { status: 501 });
    spec = await getPublicSpec(body.slug).catch(() => null);
  } else if (body.spec?.products) {
    spec = body.spec;
  }
  if (!spec) return NextResponse.json({ error: "no spec to chat with" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const user = sessionFromRequest(req);
  const limit = checkRate("chat", user?.email ?? ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Fair-use limit reached — ${limit.retryAfterMin} min until your next free questions.` },
      { status: 429 }
    );
  }

  const { content, error } = await aiComplete(
    [
      {
        role: "system",
        content:
          "You answer questions strictly from the extracted product spec data you are given. " +
          "Be concise and concrete. Cite product names. If the data doesn't contain the answer, say so plainly. " +
          "Never invent specifications.",
      },
      {
        role: "user",
        content: `Spec data:\n\n${compactSpec(spec)}\n\nQuestion: ${question}`,
      },
    ],
    { temperature: 0, maxTokens: 900, timeoutMs: 40_000 }
  );

  if (!content) {
    return NextResponse.json(
      { error: error ?? "the AI could not answer right now" },
      { status: 502 }
    );
  }
  return NextResponse.json({ answer: content });
}
