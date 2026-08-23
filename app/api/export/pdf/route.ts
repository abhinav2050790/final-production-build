// ── POST /api/export/pdf — render the branded spec-sheet PDF ──────────────────
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { SpecPdfDocument } from "@/components/PdfDoc";
import type { SpecDocument } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let spec: SpecDocument;
  try {
    spec = (await req.json()) as SpecDocument;
    if (!spec?.title || !Array.isArray(spec.products)) throw new Error("bad payload");
  } catch {
    return NextResponse.json({ error: "invalid spec payload" }, { status: 400 });
  }

  try {
    const buffer = await renderToBuffer(
      React.createElement(SpecPdfDocument, { spec }) as never
    );
    const safeName =
      spec.title.replace(/[^a-z0-9\- ]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() ||
      "spec-sheet";
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message.slice(0, 160) : "PDF rendering failed" },
      { status: 500 }
    );
  }
}
