"use client";

// ── /library — my saved extractions (requires Google sign-in + DATABASE_URL) ──

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";

interface Item {
  slug: string;
  title: string;
  product_count: number;
  created_at: string;
}

export default function LibraryPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    setItems(null);
    setError(null);
    fetch("/api/library")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
        setItems(d.items as Item[]);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const remove = async (slug: string) => {
    await fetch(`/api/library/${slug}`, { method: "DELETE" }).catch(() => {});
    setItems((prev) => prev?.filter((i) => i.slug !== slug) ?? null);
  };

  const copyShare = async (slug: string) => {
    const url = `${window.location.origin}/s/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(slug);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between border-b border-line pb-6">
        <div>
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.3em] text-fog-faint transition hover:text-black"
          >
            ← nexsus.spec
          </Link>
          <h1 className="mt-2 font-mono text-2xl font-bold uppercase tracking-widest text-black">
            my library
          </h1>
          <p className="mt-1.5 text-xs text-fog-dim">
            Every extraction you save, tied to your Google account.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-line-strong bg-black/[0.04] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-fog-dim transition hover:border-black hover:text-black"
        >
          ↻ refresh
        </button>
      </div>

      {error && (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="font-mono text-sm text-accent">{error}</p>
          <p className="mt-2 text-xs text-fog-faint">
            {error.includes("sign in")
              ? "Use the Sign in with Google button on the home page."
              : "Ask the team lead to add DATABASE_URL to the deployment."}
          </p>
        </div>
      )}

      {!error && items === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-20 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-sm text-fog-dim">Nothing saved yet.</p>
          <p className="mt-2 text-xs text-fog-faint">
            Run an extraction and press “Save to library” — it lands here.
          </p>
        </div>
      )}

      {items !== null && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li
              key={it.slug}
              className="glass animate-fade-up flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl p-4"
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/s/${it.slug}`}
                  className="block truncate text-sm font-semibold text-black transition hover:text-accent"
                >
                  {it.title}
                </Link>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-fog-faint">
                  {it.product_count} products · {new Date(it.created_at).toLocaleString()} ·{" "}
                  /s/{it.slug}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copyShare(it.slug)}
                className="rounded-lg border border-line-strong bg-black/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-fog-dim transition hover:border-black hover:text-black"
              >
                {copied === it.slug ? "✓ copied" : "share"}
              </button>
              <button
                type="button"
                onClick={() => void remove(it.slug)}
                className="rounded-lg border border-line-strong bg-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-fog-faint transition hover:border-accent hover:text-accent"
              >
                delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-14">
        <SiteFooter />
      </div>
    </main>
  );
}
