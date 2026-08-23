// ── POST /api/export/xlsx — native Excel workbook (.xlsx) ─────────────────────
// Two data sheets built for real Excel usage:
//   Catalog — one row per product (wide format, human-readable)
//   Specs   — one row per attribute:value pair (long format → pivot/filter ready)
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { ProductRecord, SpecDocument } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function attr(p: ProductRecord, name: string): string {
  return p.attributes.find((a) => a.name.toLowerCase().startsWith(name.toLowerCase()))?.value ?? "";
}

export async function POST(req: NextRequest) {
  let spec: SpecDocument;
  try {
    spec = (await req.json()) as SpecDocument;
    if (!spec?.title || !Array.isArray(spec.products)) throw new Error("bad payload");
  } catch {
    return NextResponse.json({ error: "invalid spec payload" }, { status: 400 });
  }

  try {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Catalog (one row per product) ──────────────────────────────
    const catalogRows = spec.products.map((p, i) => ({
      "#": i + 1,
      Product: p.name,
      Brand: p.brand ?? "",
      "Part Number": p.partNumber ?? "",
      Category: p.category ?? "",
      Description: p.description ?? "",
      Attributes: p.attributes.map((a) => `${a.name}: ${a.value}`).join(" | "),
      "Key Features": (p.keyFeatures ?? []).join(" • "),
      "Use Cases": (p.useCases ?? []).join(" • "),
    }));
    const catalog = XLSX.utils.json_to_sheet(
      catalogRows.length > 0
        ? catalogRows
        : [{ "#": "", Product: "", Brand: "", "Part Number": "", Category: "", Description: "", Attributes: "", "Key Features": "", "Use Cases": "" }]
    );
    catalog["!cols"] = [
      { wch: 4 }, { wch: 34 }, { wch: 16 }, { wch: 18 },
      { wch: 18 }, { wch: 46 }, { wch: 60 }, { wch: 50 }, { wch: 40 },
    ];
    catalog["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(catalogRows.length, 1), c: 8 } }) };
    catalog["!freeze"] = { xSplit: "0", ySplit: "1" };
    XLSX.utils.book_append_sheet(wb, catalog, "Catalog");

    // ── Sheet 2: Specs (one row per attribute value) ─────────────────────────
    const specRows: Array<{
      Product: string;
      Brand: string;
      "Part Number": string;
      Attribute: string;
      Value: string;
      Evidence: string;
    }> = [];
    for (const p of spec.products) {
      for (const a of p.attributes) {
        specRows.push({
          Product: p.name,
          Brand: p.brand ?? "",
          "Part Number": p.partNumber ?? "",
          Attribute: a.name,
          Value: a.value,
          Evidence: a.source ?? "",
        });
      }
    }
    const specs = XLSX.utils.json_to_sheet(
      specRows.length > 0 ? specRows : [{ Product: "", Brand: "", "Part Number": "", Attribute: "", Value: "", Evidence: "" }]
    );
    specs["!cols"] = [{ wch: 34 }, { wch: 16 }, { wch: 18 }, { wch: 30 }, { wch: 28 }, { wch: 60 }];
    specs["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(specRows.length, 1), c: 5 } }) };
    specs["!freeze"] = { xSplit: "0", ySplit: "1" };
    XLSX.utils.book_append_sheet(wb, specs, "Specs");

    // ── Sheet 3: Summary ─────────────────────────────────────────────────────
    const summary = XLSX.utils.aoa_to_sheet([
      ["Nexsus.Spec export"],
      [],
      ["Document", spec.title],
      ["Extracted", new Date(spec.createdAt).toLocaleString()],
      ["Mode", spec.mode === "ai" ? `live AI${spec.model ? ` · ${spec.model}` : ""}` : "offline parser"],
      ["Products", spec.products.length],
      ["Attribute values", spec.products.reduce((n, p) => n + p.attributes.length, 0)],
      ["Quality score", `${spec.quality.score}/100`],
    ]);
    summary["!cols"] = [{ wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, summary, "Summary");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const safeName =
      spec.title.replace(/[^a-z0-9\- ]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() ||
      "product-catalog";
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": MIME,
        "Content-Disposition": `attachment; filename="${safeName}.xlsx"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message.slice(0, 160) : "Excel export failed" },
      { status: 500 }
    );
  }
}
