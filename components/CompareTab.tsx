"use client";

// ── Compare mode — side-by-side spec matrix across selected products ──────────

import { useMemo, useState } from "react";
import type { ProductRecord, SpecDocument } from "@/lib/types";

const MAX_PICKS = 4;
const ACCENT = "#d71921";

export default function CompareTab({ spec }: { spec: SpecDocument }) {
  const [picks, setPicks] = useState<string[]>([]);

  const toggle = (id: string) => {
    setPicks((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX_PICKS ? p : [...p, id]
    );
  };

  const chosen = useMemo(
    () => spec.products.filter((p) => picks.includes(p.id)),
    [picks, spec.products]
  );

  // union of attribute names in first-seen order
  const attrNames = useMemo(() => {
    const names: string[] = [];
    for (const p of chosen)
      for (const a of p.attributes) if (!names.includes(a.name)) names.push(a.name);
    return names;
  }, [chosen]);

  const lookup = (p: ProductRecord, name: string): string | null =>
    p.attributes.find((a) => a.name === name)?.value ?? null;

  return (
    <div className="space-y-5">
      {/* picker */}
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-fog-dim">
            select up to {MAX_PICKS} products
          </h3>
          <span className="font-mono text-[10px] text-accent">{picks.length}/{MAX_PICKS}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {spec.products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`max-w-full truncate rounded-lg border px-3 py-1.5 text-xs transition ${
                picks.includes(p.id)
                  ? "border-black bg-black text-white"
                  : "border-line-strong bg-black/[0.04] text-fog-dim hover:border-black hover:text-black"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {chosen.length < 2 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-fog-dim">
            Pick at least two products to see the matrix.
          </p>
        </div>
      ) : (
        <div className="glass animate-fade-up overflow-x-auto rounded-2xl p-1">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-panel px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-fog-faint">
                  attribute
                </th>
                {chosen.map((p) => (
                  <th key={p.id} className="min-w-[160px] px-4 py-3 align-bottom">
                    <span className="block text-sm font-semibold leading-snug text-black">
                      {p.name}
                    </span>
                    {p.brand && (
                      <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-fog-faint">
                        {p.brand}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attrNames.map((name, ri) => {
                const values = chosen.map((p) => lookup(p, name));
                // highlight rows where values actually differ
                const differs =
                  values.some((v) => v !== null) &&
                  new Set(values.map((v) => v ?? "")).size > 1;
                return (
                  <tr
                    key={name}
                    style={{ animationDelay: `${Math.min(ri * 30, 400)}ms` }}
                    className={`animate-fade-up ${ri % 2 === 0 ? "bg-black/[0.03]" : ""}`}
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-wider text-fog-faint">
                      {name}
                    </td>
                    {values.map((v, ci) => (
                      <td
                        key={ci}
                        className={`px-4 py-2.5 text-[13px] ${
                          v === null
                            ? "text-fog-faint"
                            : differs
                              ? "font-medium"
                              : "text-fog"
                        }`}
                        style={
                          v !== null && differs
                            ? { color: "#111111", boxShadow: `inset 2px 0 0 ${ACCENT}` }
                            : undefined
                        }
                      >
                        {v ?? "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
