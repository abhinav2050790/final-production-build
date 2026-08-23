"use client";

// ── Product data dashboard — every product, attribute:value, in one place ─────

import { useMemo, useState } from "react";
import { ProductRecord, SpecDocument } from "@/lib/types";

interface Props {
  spec: SpecDocument;
  onSelect: (product: ProductRecord) => void;
}

type SortKey = "name" | "attributes" | "brand";

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "name", label: "Name (A–Z)" },
  { id: "attributes", label: "Most specifications" },
  { id: "brand", label: "Brand" },
];

export default function ProductsTab({ spec, onSelect }: Props) {
  const products = spec.products;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  const brandCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const b = p.brand?.trim();
      if (b) map.set(b, (map.get(b) ?? 0) + 1);
    }
    return [...map.entries()].sort((x, y) => y[1] - x[1]);
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (brandFilter !== "all" && p.brand !== brandFilter) return false;
      if (!q) return true;
      return [
        p.name,
        p.partNumber ?? "",
        p.brand ?? "",
        p.category ?? "",
        p.description ?? "",
        ...p.attributes.map((a) => `${a.name} ${a.value}`),
        ...(p.keyFeatures ?? []),
        ...(p.useCases ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const sorted = [...list];
    switch (sort) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "attributes":
        sorted.sort((a, b) => b.attributes.length - a.attributes.length);
        break;
      case "brand":
        sorted.sort(
          (a, b) => (a.brand ?? "~").localeCompare(b.brand ?? "~") || a.name.localeCompare(b.name)
        );
        break;
    }
    return sorted;
  }, [products, query, brandFilter, sort]);

  if (!products.length) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <p className="text-2xl">🔍</p>
        <p className="mt-2 text-sm font-medium text-fog">
          No products were found in this document.
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-fog-faint">
          {spec.modeNote ??
            "The document may not contain product data — try a clearer spec sheet or catalog."}
        </p>
        <p className="mt-2 text-xs text-fog-faint">
          If the AI was rate-limited, waiting a minute and re-running usually fixes it
          — or press Shift+D and re-run to use the built-in instant parser.
        </p>
      </div>
    );
  }

  const stats = [
    { n: products.length, label: "products", hint: "all in one place" },
    { n: spec.quality.attributeCount, label: "attribute values", hint: "voltage, range, size…" },
    { n: brandCounts.length, label: "brands", hint: "distinct brands" },
    { n: `${spec.quality.score}/100`, label: "data quality", hint: "completeness check" },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="glass animate-fade-up grid grid-cols-2 gap-3 rounded-2xl p-5 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="animate-fade-up rounded-xl border border-black/8 bg-black/[0.03] p-3.5 text-center"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-2xl font-bold text-fog">{s.n}</p>
            <p className="mt-0.5 text-[11px] font-medium text-fog-dim">{s.label}</p>
            <p className="mt-0.5 text-[9.5px] text-fog-faint">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass flex flex-wrap items-center gap-2.5 rounded-2xl p-3.5">
        <div className="relative min-w-[180px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog-faint">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, attributes (voltage, range…), part numbers…"
            className="w-full rounded-lg border border-line bg-black/30 py-2 pl-9 pr-3 text-sm text-fog placeholder-fog-faint outline-none transition focus:border-black focus:ring-1 focus:ring-black/40"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-line bg-black/30 px-3 py-2 text-sm text-fog outline-none transition focus:border-violet-400/50"
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id} className="bg-panel">
              Sort: {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Brand filter chips */}
      {brandCounts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setBrandFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              brandFilter === "all"
                ? "border-violet-400/60 bg-violet-500/15 text-black"
                : "border-line bg-black/[0.04] text-fog hover:border-black/30"
            }`}
          >
            All <span className="text-fog-faint">{products.length}</span>
          </button>
          {brandCounts.slice(0, 12).map(([b, n]) => (
            <button
              key={b}
              type="button"
              onClick={() => setBrandFilter(b)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                brandFilter === b
                  ? "border-violet-400/60 bg-violet-500/15 text-black"
                : "border-line bg-black/[0.04] text-fog hover:border-black/30"
              }`}
            >
              {b} <span className="text-fog-faint">{n}</span>
            </button>
          ))}
        </div>
      )}

      <p className="px-1 text-xs text-fog-faint">
        Showing {visible.length} of {products.length} products
        {query && ` matching “${query}”`}
        {brandFilter !== "all" && ` · brand: ${brandFilter}`}
      </p>

      {/* Product cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            className="glass animate-fade-up group rounded-2xl p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-line-strong"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-semibold leading-snug text-fog group-hover:text-black">
                {p.name}
              </h3>
              <span className="shrink-0 text-[10px] text-fog-faint">#{i + 1}</span>
            </div>

            {(p.brand || p.category || p.partNumber) && (
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
                  <span className="rounded-md border border-black/15 bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] text-fog">
                    {p.partNumber}
                  </span>
                )}
              </div>
            )}

            {p.description && (
              <p className="mt-2 text-[12px] leading-relaxed text-fog-dim">{p.description}</p>
            )}

            {p.attributes.length > 0 && (
              <ul className="mt-2.5 space-y-1 border-t border-black/5 pt-2.5">
                {p.attributes.slice(0, 5).map((a) => (
                  <li key={a.name} className="flex items-baseline justify-between gap-3 text-[12px] leading-snug">
                    <span className="text-fog-faint">{a.name}</span>
                    <span className="text-right font-medium text-fog">{a.value}</span>
                  </li>
                ))}
                {p.attributes.length > 5 && (
                  <li className="text-[11px] text-fog-faint">
                    +{p.attributes.length - 5} more — click for full details
                  </li>
                )}
              </ul>
            )}

            {(p.keyFeatures?.length ?? 0) > 0 && (
              <p className="mt-2.5 text-[11px] text-emerald-300/80">
                ✓ {p.keyFeatures!.length} key features · {p.useCases?.length ?? 0} use cases
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
