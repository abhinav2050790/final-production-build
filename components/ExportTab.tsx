"use client";

// ── Export tab — branded PDF report + raw data format downloads ───────────────

import { useState } from "react";
import { SpecDocument } from "@/lib/types";

interface Props {
  spec: SpecDocument;
}

type Format = "markdown" | "json" | "csv";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "products"
  );
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function kb(size: number): string {
  return `${(size / 1024).toFixed(1)} KB`;
}

export default function ExportTab({ spec }: Props) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [xlsxBusy, setXlsxBusy] = useState(false);
  const [xlsxError, setXlsxError] = useState<string | null>(null);

  const slimSpec = (): SpecDocument => {
    const payload = JSON.parse(JSON.stringify(spec)) as SpecDocument;
    delete (payload.input as unknown as { rawText?: string }).rawText;
    delete (payload.input as unknown as { segments?: unknown }).segments;
    return payload;
  };

  const downloadPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slimSpec()),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(spec.title)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setPdfBusy(false);
    }
  };

  const downloadXlsx = async () => {
    if (xlsxBusy) return;
    setXlsxBusy(true);
    setXlsxError(null);
    try {
      const res = await fetch("/api/export/xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slimSpec()),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugify(spec.title)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setXlsxError(e instanceof Error ? e.message : "Excel export failed");
    } finally {
      setXlsxBusy(false);
    }
  };

  const cards: Array<{
    id: Format;
    icon: string;
    name: string;
    desc: string;
    inside: string;
    mime: string;
    ext: string;
  }> = [
    {
      id: "markdown",
      icon: "📝",
      name: "Readable product pages",
      desc: "A clean text document — every product with its full specification table, features and use cases.",
      inside: `${spec.products.length} products · ${spec.quality.attributeCount} attribute values`,
      mime: "text/markdown",
      ext: "md",
    },
    {
      id: "json",
      icon: "🧬",
      name: "Developer hand-off",
      desc: "The complete machine-readable product data for engineers to import or build against.",
      inside: "every product with attributes, features and use cases, structured and typed",
      mime: "application/json",
      ext: "json",
    },
    {
      id: "csv",
      icon: "📊",
      name: "Spreadsheet catalog",
      desc: "One row per product — drop it straight into Excel, Sheets or a database.",
      inside: `${spec.products.length} rows with part numbers, brands and all attributes`,
      mime: "text/csv",
      ext: "csv",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Primary: formatted PDF report ─────────────────────────────────── */}
      <div className="glass animate-fade-up overflow-hidden rounded-2xl border-white/20">
        <div className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-black font-mono text-[11px] font-bold tracking-widest text-white">
            PDF
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white">
              Formatted spec-sheet report
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-fog-dim">
              A polished, print-ready PDF document: branded cover with summary
              stats, one styled card per product with its full attribute table,
              features and use cases — page numbers included.
            </p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-fog-faint">
              {spec.products.length} products · {spec.quality.attributeCount} values ·
              generated fresh from this run
            </p>
            {pdfError && (
              <p className="mt-2 rounded-lg border-accent border bg-accent-subtle px-3 py-1.5 font-mono text-[10px] text-accent">
                {pdfError}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void downloadPdf()}
            disabled={pdfBusy}
            className="w-full shrink-0 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-fog disabled:opacity-50 sm:w-auto"
          >
            {pdfBusy ? "⏳ rendering…" : "⬇ Download PDF"}
          </button>
        </div>
      </div>

      {/* ── Excel workbook ────────────────────────────────────────────────── */}
      <div className="glass animate-fade-up flex flex-col rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-2xl">📗</span>
          <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 font-mono text-[10px] text-fog-dim">
            3 sheets
          </span>
        </div>
        <h3 className="mt-2.5 text-sm font-semibold text-fog">Native Excel workbook</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-fog-dim">
          A real .xlsx file built for Excel — filterable Catalog sheet, a
          pivot-ready Specs sheet with every attribute:value pair, and a
          summary page.
        </p>
        <p className="mt-2 flex-1 text-[11px] leading-relaxed text-fog-faint">
          Includes: {spec.products.length} products ·{" "}
          {spec.products.reduce((n, p) => n + p.attributes.length, 0)} spec rows · autofilters + frozen headers.
        </p>
        {xlsxError && (
          <p className="mt-2 rounded-lg border-accent border bg-accent-subtle px-3 py-1.5 font-mono text-[10px] text-accent">
            {xlsxError}
          </p>
        )}
        <button
          type="button"
          onClick={() => void downloadXlsx()}
          disabled={xlsxBusy}
          className="mt-4 w-full rounded-lg border border-line-strong bg-white/5 px-3 py-2.5 text-xs font-semibold text-fog transition hover:border-white hover:text-white disabled:opacity-50"
        >
          {xlsxBusy ? "⏳ building…" : "⬇ Download XLSX"}
        </button>
      </div>

      {/* ── Raw data formats ──────────────────────────────────────────────── */}
      <p className="px-1 pt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog-faint">
        raw data formats
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((f, i) => {
          const size = new Blob([spec.exports[f.id]]).size;
          return (
            <div
              key={f.id}
              className="glass animate-fade-up flex flex-col rounded-2xl p-5"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{f.icon}</span>
                <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 font-mono text-[10px] text-fog-dim">
                  {kb(size)}
                </span>
              </div>
              <h3 className="mt-2.5 text-sm font-semibold text-fog">{f.name}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-fog-dim">{f.desc}</p>
              <p className="mt-2 flex-1 text-[11px] leading-relaxed text-fog-faint">
                Includes: {f.inside}.
              </p>
              <button
                type="button"
                onClick={() =>
                  download(`${slugify(spec.title)}.${f.ext}`, spec.exports[f.id], f.mime)
                }
                className="mt-4 w-full rounded-lg border border-line-strong bg-white/5 px-3 py-2.5 text-xs font-semibold text-fog transition hover:border-white hover:text-white"
              >
                ⬇ Download {f.ext.toUpperCase()}
              </button>
            </div>
          );
        })}
      </div>

      <p className="px-1 text-center text-xs text-fog-faint">
        Same {spec.products.length} products — the PDF is for people, the files below are for machines.
      </p>
    </div>
  );
}
