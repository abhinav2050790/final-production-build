import Link from "next/link";

// ── Site-wide footer — Nothing OS: flat, mono, dot-matrix quiet ────────────────

const LINKS = [
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
  { href: "/privacy", label: "privacy" },
  { href: "/terms", label: "terms" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5">
        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] uppercase tracking-[0.3em] text-fog-faint transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="h-px w-24 bg-line-strong" />
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-fog-faint">
          nexsus.spec — nothing you can&apos;t extract
        </p>
      </div>
    </footer>
  );
}
