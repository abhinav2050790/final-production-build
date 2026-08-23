"use client";

// ── Data quality report ───────────────────────────────────────────────────────

import { Finding, SpecDocument } from "@/lib/types";

interface Props {
  spec: SpecDocument;
}

const SEVERITY_STYLE = {
  error: "border-accent bg-accent-subtle text-accent",
  warning: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  info: "border-line-strong bg-white/5 text-fog-dim",
};

const SEVERITY_ICON = { error: "✕", warning: "⚠", info: "ℹ" };

const CODE_LABEL: Record<string, string> = {
  NO_SPECS: "No specifications",
  FEW_SPECS: "Few specifications",
  DUPLICATE: "Likely duplicate",
  NO_PART_NUMBERS: "No part numbers",
};

export default function DataQualityTab({ spec }: Props) {
  const q = spec.quality;
  const stats = [
    { label: "Data quality score", value: `${q.score}/100`, hint: "completeness of extracted data" },
    { label: "Attribute values", value: String(q.attributeCount), hint: "total name — value pairs captured" },
    { label: "Avg per product", value: spec.products.length ? (q.attributeCount / spec.products.length).toFixed(1) : "0", hint: "attributes per product" },
    { label: "With part numbers", value: `${q.withPartNumbers}/${spec.products.length}`, hint: "products identified by part number" },
  ];

  const groups: Array<{ title: string; items: Finding[] }> = [
    { title: "Worth reviewing", items: q.findings.filter((f) => f.severity === "warning") },
    { title: "Good to know", items: q.findings.filter((f) => f.severity !== "warning") },
  ];

  return (
    <div className="space-y-5">
      <div className="glass animate-fade-up grid grid-cols-2 gap-3 rounded-2xl p-6 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="animate-fade-up rounded-xl border border-white/8 bg-white/[0.03] p-3.5 text-center"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-xl font-bold text-fog">{s.value}</p>
            <p className="mt-0.5 text-[11px] font-medium text-fog-dim">{s.label}</p>
            <p className="mt-0.5 text-[9.5px] text-fog-faint">{s.hint}</p>
          </div>
        ))}
      </div>

      {q.findings.length === 0 ? (
        <div className="glass animate-fade-up rounded-2xl p-8 text-center">
          <p className="text-2xl">🛡️</p>
          <p className="mt-2 text-sm font-medium text-emerald-300">
            Clean pass — every product has a healthy set of specifications.
          </p>
        </div>
      ) : (
        groups
          .filter((g) => g.items.length)
          .map((g) => (
            <section key={g.title} className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-fog-faint">
                {g.title} · {g.items.length}
              </h4>
              {g.items.map((f, i) => (
                <div
                  key={i}
                  className={`animate-fade-up flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border p-3.5 text-[12.5px] leading-relaxed ${SEVERITY_STYLE[f.severity]}`}
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                    {SEVERITY_ICON[f.severity]} {CODE_LABEL[f.code] ?? f.code}
                  </span>
                  <span className="flex-1 text-fog">{f.message}</span>
                </div>
              ))}
            </section>
          ))
      )}
    </div>
  );
}
