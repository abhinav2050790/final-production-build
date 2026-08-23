"use client";

// ── Product detail drawer — full page for one product ─────────────────────────
// Description block, specifications table with evidence snippets,
// key features, use cases — plus inline human-fix editing.

import { useEffect, useState } from "react";
import { ProductRecord } from "@/lib/types";

interface Props {
  product: ProductRecord | null;
  onClose: () => void;
  /** Called after the user edits and saves — parent updates the spec state. */
  onChange?: (updated: ProductRecord) => void;
}

export default function ProductDetailDrawer({ product, onClose, onChange }: Props) {
  const [rendered, setRendered] = useState<ProductRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProductRecord | null>(null);

  useEffect(() => {
    if (product) setRendered(product);
  }, [product]);

  // close edit mode whenever a different product opens
  useEffect(() => {
    setEditing(false);
    setDraft(null);
  }, [product?.id]);

  const open = product !== null;
  const p = editing && draft ? draft : product ?? rendered;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const startEdit = () => {
    if (!p) return;
    setDraft(JSON.parse(JSON.stringify(p)) as ProductRecord);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!draft) return;
    onChange?.(draft);
    setRendered(draft);
    setEditing(false);
  };

  const field = (
    label: keyof ProductRecord & ("name" | "brand" | "category" | "partNumber" | "description"),
    maxLen: number
  ) => (
    <input
      value={String(p![label] ?? "")}
      maxLength={maxLen}
      onChange={(e) => setDraft((d) => (d ? { ...d, [label]: e.target.value || undefined } : d))}
      className="w-full rounded-lg border border-line-strong bg-black/30 px-3 py-1.5 text-sm text-fog outline-none focus:border-black"
    />
  );

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
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div className="min-w-0 flex-1">
                {editing ? (
                  field("name", 160)
                ) : (
                  <h2 className="text-lg font-bold leading-snug text-black">{p.name}</h2>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {editing ? (
                    <>
                      {field("brand", 60)}
                      {field("partNumber", 40)}
                    </>
                  ) : (
                    <>
                      {p.brand && (
                        <span className="rounded-md border border-line-strong bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fog-dim">
                          {p.brand}
                        </span>
                      )}
                      {p.category && (
                        <span className="rounded-md border border-line-strong bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fog-dim">
                          {p.category}
                        </span>
                      )}
                      {p.partNumber && (
                        <span className="rounded-md border border-black/15 bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] text-fog">
                          Part #{p.partNumber}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {onChange &&
                  (editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setDraft(null);
                        }}
                        className="rounded-lg border border-line bg-black/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-fog-dim transition hover:text-black"
                      >
                        cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded-lg border border-black bg-black px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white transition hover:bg-[#333333]"
                      >
                        save
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startEdit}
                      title="Fix this record by hand"
                      className="rounded-lg border border-line bg-black/[0.04] px-2.5 py-1 text-sm text-fog-dim transition hover:border-black hover:text-black"
                    >
                      ✎
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close product details"
                  className="shrink-0 rounded-lg border border-line bg-black/[0.04] px-2.5 py-1 text-sm text-fog-dim transition hover:border-black/25 hover:text-black"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-5">
              {/* Description */}
              {(editing || p.description) && (
                <section>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-fog-faint">
                    Product description
                  </h3>
                  {editing ? (
                    field("description", 300)
                  ) : (
                    <p className="rounded-xl border border-line bg-raised p-4 text-[13px] leading-relaxed text-fog">
                      {p.description}
                    </p>
                  )}
                </section>
              )}

              {/* Specifications */}
              {p.attributes.length > 0 && (
                <section>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-fog-faint">
                    Specifications · {p.attributes.length}
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-line">
                    {p.attributes.map((a, i) => (
                      <div
                        key={`${a.name}-${i}`}
                        className={`px-4 py-2.5 text-[12.5px] leading-snug ${
                          i % 2 === 0 ? "bg-black/[0.03]" : "bg-transparent"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="shrink-0 text-fog-faint">{a.name}</span>
                          {editing ? (
                            <input
                              value={a.value}
                              onChange={(e) =>
                                setDraft((d) =>
                                  d
                                    ? {
                                        ...d,
                                        attributes: d.attributes.map((x, xi) =>
                                          xi === i ? { ...x, value: e.target.value } : x
                                        ),
                                      }
                                    : d
                                )
                              }
                              className="w-40 rounded-md border border-line-strong bg-black/30 px-2 py-1 text-right text-[12px] text-fog outline-none focus:border-black"
                            />
                          ) : (
                            <span className="text-right font-semibold text-fog">{a.value}</span>
                          )}
                        </div>
                        {!editing && a.source && (
                          <details className="group mt-1.5">
                            <summary className="cursor-pointer list-none font-mono text-[9.5px] uppercase tracking-wider text-accent/80 transition hover:text-accent">
                              ▸ source in document
                            </summary>
                            <p className="mt-1 border-l-2 border-line-strong pl-2.5 font-mono text-[9.5px] leading-relaxed text-fog-faint">
                              {a.source}
                            </p>
                          </details>
                        )}
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
                        <span className="mt-0.5 font-mono text-emerald-400">✓</span>
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
                        <span className="mt-0.5 font-mono text-accent">▸</span>
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
