import type { Metadata } from "next";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Design System — Nexsus.Spec",
  description:
    "The Nothing OS light-edition design system behind Nexsus.Spec: industrial transparency, stark monochrome, dot-matrix type and purposeful red signal accents on a white canvas.",
};

// ── /design — the living spec (LIGHT EDITION). Every token & component below
// is the canonical reference; production UI composes from exactly these. ──────

const PALETTE: Array<{ group: string; swatches: Array<{ name: string; hex: string; token: string; split?: boolean }> }> = [
  {
    group: "canvas & surfaces",
    swatches: [
      { name: "Canvas", hex: "#FFFFFF", token: "bg-ink", split: false },
      { name: "Surface Panel", hex: "#F7F7F7", token: "bg-panel / .glass", split: false },
      { name: "Raised Surface", hex: "#EFEFEF", token: "bg-raised", split: false },
    ],
  },
  {
    group: "wireframe hairlines",
    swatches: [
      { name: "Hairline Default", hex: "#E4E4E4", token: "border-line" },
      { name: "Hairline Strong", hex: "#999999", token: "border-line-strong" },
    ],
  },
  {
    group: "text hierarchy",
    swatches: [
      { name: "Ink Black", hex: "#111111 / #000000", token: "text-fog / text-black", split: true },
      { name: "Dimmed", hex: "#555555", token: "text-fog-dim" },
      { name: "Disabled", hex: "#9A9A9A", token: "text-fog-faint" },
    ],
  },
  {
    group: "signal accents — never decoration",
    swatches: [
      { name: "Nothing Red", hex: "#D71921", token: "bg-accent" },
      { name: "Emerald Success", hex: "#22C55E", token: "bg-success" },
    ],
  },
];

const TYPE_ROWS = [
  { label: "display header", sample: "NEXSUS.SPEC", cls: "font-sans text-3xl font-bold uppercase tracking-widest text-black sm:text-4xl", note: "Space Grotesk · bold · uppercase · tracking-widest" },
  { label: "section title", sample: "Wireframe panel", cls: "text-sm font-semibold uppercase tracking-widest text-black", note: "stark black · semibold · wide tracking" },
  { label: "mono label", sample: "STAGE 01 — INGEST", cls: "font-mono text-[11px] uppercase tracking-[0.3em] text-fog-dim", note: "Space Mono · uppercase label styling" },
  { label: "body copy", sample: "Industrial transparency: every surface states exactly what it does.", cls: "text-sm leading-relaxed text-fog-dim", note: "#555555 · relaxed leading" },
  { label: "disabled", sample: "Unavailable in offline mode", cls: "text-xs text-fog-faint", note: "#9A9A9A" },
];

function Section({ index, title, blurb, children }: { index: string; title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section className="animate-fade-up border-t border-line pt-8">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tracking-[0.35em] text-accent">{index}</span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-black">{title}</h2>
      </div>
      {blurb && <p className="mt-2 max-w-xl text-xs leading-relaxed text-fog-dim">{blurb}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* ── Header with live system pill ──────────────────────────────────── */}
      <header className="mb-12 border-b border-line pb-8">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.3em] text-fog-faint transition hover:text-black"
        >
          ← nexsus.spec
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-widest text-black sm:text-3xl">
            design system
          </h1>
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-panel px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-fog-dim">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            </span>
            system live
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog-dim">
          Nothing OS light edition: white canvas, black type, hairline
          structure, and a single red signal reserved for what matters. This
          page is the specification — everything below uses the same tokens as
          the app.
        </p>
      </header>

      <div className="space-y-12">
        {/* ── 01 Palette ─────────────────────────────────────────────────── */}
        <Section
          index="01"
          title="color palette tokens"
          blurb="Fixed values. Red is a signal, not a decoration — if it isn't status, active or high-impact CTA, it isn't red."
        >
          <div className="space-y-5">
            {PALETTE.map((g) => (
              <div key={g.group}>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-fog-faint">
                  {g.group}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {g.swatches.map((s) => (
                    <div key={s.name} className="border border-line bg-white transition hover:border-black">
                      <div className="h-14 w-full" style={{ backgroundColor: s.hex.includes(" ") ? undefined : s.hex }}>
                        {s.split && (
                          <div className="flex h-full w-full">
                            <div className="w-1/2 bg-black" />
                            <div className="w-1/2 bg-[#111111]" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-black">{s.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-fog-dim">{s.hex}</p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-fog-faint">{s.token}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between border border-accent/40 bg-accent-subtle px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-black">red = signal</span>
                <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-white shadow-glow">active</span>
              </div>
              <div className="flex items-center justify-between border border-success/40 px-4 py-3" style={{ backgroundColor: "rgba(34,197,94,0.08)" }}>
                <span className="font-mono text-[10px] uppercase tracking-widest text-black">green = success</span>
                <span className="rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-black" style={{ backgroundColor: "#22C55E" }}>done</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 02 Typography ──────────────────────────────────────────────── */}
        <Section
          index="02"
          title="typography & hierarchy"
          blurb="Display headers in Space Grotesk, bold, black, uppercase with widest tracking. Data and labels in Space Mono, uppercase."
        >
          <div className="divide-y divide-line border border-line bg-panel">
            {TYPE_ROWS.map((t) => (
              <div key={t.label} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className={t.cls}>{t.sample}</p>
                </div>
                <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.25em] text-fog-faint sm:w-56 sm:text-right">
                  {t.note}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 03 Grid background ─────────────────────────────────────────── */}
        <Section index="03" title="subtle grid background" blurb="32×32px hairline overlay at 5% black on the white canvas — structure without noise.">
          <div className="grid-32 relative h-44 border border-line bg-white">
            <span className="corner tl" /><span className="corner tr" />
            <span className="absolute bottom-3 right-4 font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint">
              .grid-32 — 32px × 32px — rgba(17,17,17,0.05)
            </span>
          </div>
        </Section>

        {/* ── 04 Wireframe cards ─────────────────────────────────────────── */}
        <Section index="04" title="wireframe cards" blurb="#F7F7F7 surface inside an #E4E4E4 hairline. Hover promotes the border to black — the Nothing interaction grammar.">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-line bg-[#f7f7f7] p-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fog-faint">at rest</span>
              <p className="mt-2 text-sm font-semibold text-black">#E4E4E4 border</p>
              <p className="mt-1 text-xs leading-relaxed text-fog-dim">Flat panel, no blur, no glass.</p>
            </div>
            <div className="border border-[#cccccc] bg-[#f7f7f7] p-5 transition hover:border-black">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fog-faint">hover me</span>
              <p className="mt-2 text-sm font-semibold text-black">border → black</p>
              <p className="mt-1 text-xs leading-relaxed text-fog-dim">hover:border-black on every interactive card.</p>
            </div>
            <div className="border border-black bg-raised p-5 shadow-glow">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">selected</span>
              <p className="mt-2 text-sm font-semibold text-black">raised + signal glow</p>
              <p className="mt-1 text-xs leading-relaxed text-fog-dim">Active state earns red light.</p>
            </div>
          </div>
        </Section>

        {/* ── 05 Buttons ─────────────────────────────────────────────────── */}
        <Section index="05" title="interactive buttons" blurb="Three grammars only. Primary acts, secondary moves, accent signals urgency. On white canvas the primary inverts to black.">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint">primary</p>
              <button type="button" className="mt-3 w-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#333333]">
                Extract product data
              </button>
              <p className="mt-3 font-mono text-[9px] text-fog-faint">bg-black · text-white · hover:#333333</p>
            </div>
            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint">secondary</p>
              <button type="button" className="mt-3 w-full border border-line-strong bg-transparent px-6 py-3 text-sm text-black transition hover:border-black">
                How it works
              </button>
              <p className="mt-3 font-mono text-[9px] text-fog-faint">transparent · #999 border · hover:black</p>
            </div>
            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint">accent signal</p>
              <button type="button" className="mt-3 w-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-red-700">
                ⏺ Start live run
              </button>
              <p className="mt-3 font-mono text-[9px] text-fog-faint">#D71921 · glow · hover:red-700</p>
            </div>
          </div>
        </Section>

        {/* ── 06 Status indicators ───────────────────────────────────────── */}
        <Section index="06" title="status indicators" blurb="Pulse pills communicate live machine state. Red = live/attention, emerald = success, dim = idle.">
          <div className="flex flex-wrap items-center gap-3 border border-line bg-panel p-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent-subtle px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-black">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              </span>
              extracting
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-success/40 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-600" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              complete
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-black/[0.03] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-fog-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-fog-faint" />
              idle
            </span>
          </div>
        </Section>

        {/* ── 07 Composition rules ───────────────────────────────────────── */}
        <Section index="07" title="composition laws">
          <ul className="divide-y divide-line border border-line bg-panel">
            {[
              "White canvas, #F7F7F7 panels, #E4E4E4 hairlines — depth comes from borders, never grey blur.",
              "Red appears only as signal: active stage, live pill, destructive confirm, primary CTA. Count your reds per screen.",
              "Every interactive surface answers hover with border-black.",
              "Mono uppercase microcopy carries metadata; grotesk bold carries meaning.",
              "The cinematic intro stays a dark room by design — one deliberate dark scene per visit.",
            ].map((r) => (
              <li key={r} className="flex gap-3 p-4 text-xs leading-relaxed text-fog-dim">
                <span className="mt-0.5 font-mono text-accent">▸</span>
                {r}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-14">
        <SiteFooter />
      </div>
    </main>
  );
}
