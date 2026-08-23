import type { Metadata } from "next";
import Link from "next/link";

import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Design System — Nexsus.Spec",
  description:
    "The Nothing OS design system behind Nexsus.Spec: industrial transparency, stark monochrome, dot-matrix type and purposeful red signal accents.",
};

// ── /design — the living spec. Every token & component on this page is the
// canonical reference; production UI must be composed from exactly these. ─────

const PALETTE: Array<{ group: string; swatches: Array<{ name: string; hex: string; token: string; use: string; dark?: boolean }> }> = [
  {
    group: "canvas & surfaces",
    swatches: [
      { name: "Canvas", hex: "#000000", token: "bg-ink", use: "OLED pitch black background", dark: true },
      { name: "Surface Panel", hex: "#111111", token: "bg-panel / .glass", use: "elevated cards, containers", dark: true },
      { name: "Raised Surface", hex: "#1A1A1A", token: "bg-raised", use: "selected states, modals, drawers", dark: true },
    ],
  },
  {
    group: "wireframe hairlines",
    swatches: [
      { name: "Hairline Default", hex: "#222222", token: "border-line", use: "wireframe borders at rest", dark: true },
      { name: "Hairline Strong", hex: "#333333", token: "border-line-strong", use: "hover / focus borders", dark: true },
    ],
  },
  {
    group: "text hierarchy",
    swatches: [
      { name: "Fog White", hex: "#FFFFFF / #E8E8E8", token: "text-white / text-fog", use: "primary text, headers", dark: true },
      { name: "Dimmed", hex: "#999999", token: "text-fog-dim", use: "labels, captions, body", dark: true },
      { name: "Disabled", hex: "#666666", token: "text-fog-faint", use: "disabled, decorative", dark: true },
    ],
  },
  {
    group: "signal accents — never decoration",
    swatches: [
      { name: "Nothing Red", hex: "#D71921", token: "bg-accent", use: "status signals, active indicators, high-impact CTAs" },
      { name: "Emerald Success", hex: "#22C55E", token: "bg-success", use: "positive status only" },
    ],
  },
];

const TYPE_ROWS = [
  { label: "display header", sample: "NEXSUS.SPEC", cls: "font-sans text-3xl font-bold uppercase tracking-widest text-white sm:text-4xl", note: "Space Grotesk · bold · uppercase · tracking-widest" },
  { label: "section title", sample: "Wireframe panel", cls: "text-sm font-semibold uppercase tracking-widest text-white", note: "stark white · semibold · wide tracking" },
  { label: "mono label", sample: "STAGE 01 — INGEST", cls: "font-mono text-[11px] uppercase tracking-[0.3em] text-fog-dim", note: "Space Mono · uppercase label styling" },
  { label: "body copy", sample: "Industrial transparency: every surface states exactly what it does.", cls: "text-sm leading-relaxed text-fog-dim", note: "#999999 · relaxed leading" },
  { label: "disabled", sample: "Unavailable in offline mode", cls: "text-xs text-fog-faint", note: "#666666" },
];

function Section({ index, title, blurb, children }: { index: string; title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section className="animate-fade-up border-t border-line pt-8">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tracking-[0.35em] text-accent">{index}</span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white">{title}</h2>
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
          className="font-mono text-[11px] uppercase tracking-[0.3em] text-fog-faint transition hover:text-white"
        >
          ← nexsus.spec
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-widest text-white sm:text-3xl">
            design system
          </h1>
          {/* Status indicator: animated pulse pill, red inner dot = live state */}
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-panel px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-fog-dim">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            </span>
            system live
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog-dim">
          Nothing OS principles: industrial transparency, stark monochrome
          contrast, dot-matrix typography, and a single red signal reserved for
          what matters. This page is the specification — everything below is
          built from the same tokens the app uses.
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
                    <div key={s.name} className="border border-line bg-panel transition hover:border-white">
                      <div className="h-14 w-full" style={{ backgroundColor: s.hex.includes(" ") ? undefined : s.hex }}>
                        {s.hex.includes(" ") && (
                          <div className="flex h-full w-full">
                            <div className="w-1/2 bg-white" />
                            <div className="w-1/2 bg-[#e8e8e8]" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-white">{s.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-fog-dim">{s.hex}</p>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-fog-faint">{s.token}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* usage chips for accents */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between border border-accent/40 bg-accent-subtle px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white">red = signal</span>
                <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-white shadow-glow">active</span>
              </div>
              <div className="flex items-center justify-between border border-success/40 px-4 py-3" style={{ backgroundColor: "rgba(34,197,94,0.08)" }}>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white">green = success</span>
                <span className="rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-black" style={{ backgroundColor: "#22C55E" }}>done</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 02 Typography ──────────────────────────────────────────────── */}
        <Section
          index="02"
          title="typography & hierarchy"
          blurb="Display headers in Space Grotesk, bold, stark white, uppercase with widest tracking. Data and labels in Space Mono, uppercase."
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
        <Section index="03" title="subtle grid background" blurb="32×32px hairline overlay at 3% white — structure without noise. The app canvas layers this under the dot-matrix texture.">
          <div className="grid-32 relative h-44 border border-line bg-black">
            <span className="corner tl" /><span className="corner tr" />
            <span className="absolute bottom-3 right-4 font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint">
              .grid-32 — 32px × 32px — rgba(255,255,255,0.03)
            </span>
          </div>
        </Section>

        {/* ── 04 Wireframe cards ─────────────────────────────────────────── */}
        <Section index="04" title="wireframe cards" blurb="#111111 surface inside a #222222 hairline. Hover promotes the border to white — the Nothing interaction grammar.">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-line bg-[#111111] p-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fog-faint">at rest</span>
              <p className="mt-2 text-sm font-semibold text-white">#222222 border</p>
              <p className="mt-1 text-xs leading-relaxed text-fog-dim">Flat panel, no blur, no glass.</p>
            </div>
            <div className="border border-[#333333] bg-[#111111] p-5 transition hover:border-white">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fog-faint">hover me</span>
              <p className="mt-2 text-sm font-semibold text-white">border → white</p>
              <p className="mt-1 text-xs leading-relaxed text-fog-dim">hover:border-white on every interactive card.</p>
            </div>
            <div className="border border-white bg-raised p-5 shadow-glow">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">selected</span>
              <p className="mt-2 text-sm font-semibold text-white">raised + signal glow</p>
              <p className="mt-1 text-xs leading-relaxed text-fog-dim">Active state earns red light.</p>
            </div>
          </div>
        </Section>

        {/* ── 05 Buttons ─────────────────────────────────────────────────── */}
        <Section index="05" title="interactive buttons" blurb="Three grammars only. Primary acts, secondary moves, accent signals urgency.">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint">primary</p>
              <button type="button" className="mt-3 w-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E8E8E8]">
                Extract product data
              </button>
              <p className="mt-3 font-mono text-[9px] text-fog-faint">bg-white · text-black · hover:#E8E8E8</p>
            </div>
            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint">secondary</p>
              <button type="button" className="mt-3 w-full border border-[#333333] bg-transparent px-6 py-3 text-sm text-white transition hover:border-white">
                How it works
              </button>
              <p className="mt-3 font-mono text-[9px] text-fog-faint">transparent · #333 border · hover:white</p>
            </div>
            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint">accent signal</p>
              <button type="button" className="mt-3 w-full bg-[#D71921] px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-red-700">
                ⏺ Start live run
              </button>
              <p className="mt-3 font-mono text-[9px] text-fog-faint">#D71921 · glow · hover:red-700</p>
            </div>
          </div>
        </Section>

        {/* ── 06 Status indicators ───────────────────────────────────────── */}
        <Section index="06" title="status indicators" blurb="Pulse pills communicate live machine state. Red = live/attention, emerald = success, dim = idle.">
          <div className="flex flex-wrap items-center gap-3 border border-line bg-panel p-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent-subtle px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              </span>
              extracting
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-success/40 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              complete
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-fog-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-fog-faint" />
              idle
            </span>
          </div>
        </Section>

        {/* ── 07 Composition rules ───────────────────────────────────────── */}
        <Section index="07" title="composition laws">
          <ul className="divide-y divide-line border border-line bg-panel">
            {[
              "Black canvas, #111111 panels, #222222 hairlines — depth comes from borders, never shadows of grey blur.",
              "Red appears only as signal: active stage, live pill, destructive confirm, primary CTA. Count your reds per screen.",
              "Every interactive surface answers hover with border-white.",
              "Mono uppercase microcopy carries metadata; grotesk bold carries meaning.",
              "Dot-matrix texture and scanlines are atmosphere — keep them under 6% opacity.",
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
