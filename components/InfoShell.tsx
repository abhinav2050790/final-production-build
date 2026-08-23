import Link from "next/link";
import type { ReactNode } from "react";

import SiteFooter from "@/components/SiteFooter";

// ── Shared shell for the info pages (about / contact / privacy / terms) ───────

export function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-6 sm:p-8">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tracking-[0.3em] text-accent">{index}</span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-black">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-fog-dim">{children}</div>
    </section>
  );
}

export default function InfoShell({
  kicker,
  title,
  blurb,
  children,
}: {
  kicker: string;
  title: string;
  blurb?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 border-b border-line pb-6">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.3em] text-fog-faint transition hover:text-black"
        >
          ← nexsus.spec
        </Link>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.35em] text-fog-faint">
          {kicker}
        </p>
        <h1 className="mt-2 font-mono text-2xl font-bold uppercase tracking-widest text-black sm:text-3xl">
          {title}
        </h1>
        {blurb && <p className="mt-3 max-w-xl text-sm leading-relaxed text-fog-dim">{blurb}</p>}
      </header>

      <div className="space-y-4">{children}</div>

      <div className="mt-12">
        <SiteFooter />
      </div>
    </main>
  );
}
