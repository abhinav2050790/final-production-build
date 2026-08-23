"use client";

// ── Product detail drawer — full page for one product ─────────────────────────
// Mirrors the reference design: description block, specifications table,
// key features, use cases.

import { useEffect, useState } from "react";
import { ProductRecord } from "@/lib/types";

interface Props {
  product: ProductRecord | null;
  onClose: () => void;
}

export default function ProductDetailDrawer({ product, onClose }: Props) {
  const [rendered, setRendered] = useState<ProductRecord | null>(null);

  useEffect(() => {
    if (product) setRendered(product);
  }, [product]);

  const open = product !== null;
  const p = product ?? rendered;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`glass-strong fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {p && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-white/8 p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-snug text-white">{p.name}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.brand && (
                    <span className="rounded-md border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
                      {p.brand}
                    </span>
                  )}
                  {p.category && (
                    <span className="rounded-md border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-300">
                      {p.category}
                    </span>
                  )}
                  {p.partNumber && (
                    <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-fog">
                      Part #{p.partNumber}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close product details"
                className="shrink-0 rounded-lg border border-line bg-white/5 px-2.5 py-1 text-sm text-fog-dim transition hover:border-white/25 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-5">
              {/* Description */}
              {p.description && (
                <section>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-fog-faint">
                    Product description
                  </h3>
                  <p className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-[13px] leading-relaxed text-fog">
                    {p.description}
                  </p>
                </section>
              )}

              {/* Specifications */}
              {p.attributes.length > 0 && (
                <section>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-fog-faint">
                    Specifications · {p.attributes.length}
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-white/8">
                    {p.attributes.map((a, i) => (
                      <div
                        key={`${a.name}-${i}`}
                        className={`flex items-baseline justify-between gap-4 px-4 py-2.5 text-[12.5px] leading-snug ${
                          i % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"
                        }`}
                      >
                        <span className="shrink-0 text-fog-faint">{a.name}</span>
                        <span className="text-right font-semibold text-fog">{a.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Key features */}
              {(p.keyFeatures?.length ?? 0) > 0 && (
                <section>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-fog-faint">
                    Key features
                  </h3>
                  <ul className="space-y-2">
                    {p.keyFeatures!.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl border-line bg-raised p-3 text-[12.5px] leading-relaxed text-fog-dim"
                      >
                        <span className="mt-0.5 text-emerald-400">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Use cases */}
              {(p.useCases?.length ?? 0) > 0 && (
                <section>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-fog-faint">
                    Use cases
                  </h3>
                  <ul className="space-y-2">
                    {p.useCases!.map((u, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl border-line bg-raised p-3 text-[12.5px] leading-relaxed text-fog-dim"
                      >
                        <span className="mt-0.5 text-cyan-400">▸</span>
                        {u}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
