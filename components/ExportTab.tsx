"use client";

// ── Export tab — friendly download cards for the product data ─────────────────

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
      desc: "A clean, readable document — every product with its full specification table, features and use cases.",
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
                <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 text-[10px] text-fog-dim">
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
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-violet-600/90 to-cyan-500/90 px-3 py-2.5 text-xs font-semibold text-white transition hover:brightness-110"
              >
                ⬇ Download {f.ext.toUpperCase()}
              </button>
            </div>
          );
        })}
      </div>

      <p className="px-1 text-center text-xs text-fog-faint">
        All three contain the same {spec.products.length} products — just packaged for
        different readers.
      </p>
    </div>
  );
}
