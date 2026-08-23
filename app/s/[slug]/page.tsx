// ── /s/[slug] — public shareable extraction page ──────────────────────────────
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicSpec } from "@/lib/db";
import type { SpecDocument } from "@/lib/types";
import ProductsTab from "@/components/ProductsTab";
import DataQualityTab from "@/components/DataQualityTab";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const spec = await getPublicSpec(slug).catch(() => null);
  if (!spec) return { title: "Not found — Nexsus.Spec" };
  return {
    title: `${spec.title} — Nexsus.Spec`,
    description: `${spec.products.length} products extracted with attribute-level specs.`,
  };
}

export default async function SharePage({ params }: Props) {
  const { slug } = await params;
  const spec = (await getPublicSpec(slug).catch(() => null)) as SpecDocument | null;

  if (!spec) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-mono text-2xl font-bold uppercase tracking-widest text-white">
          404 · link not found
        </h1>
        <p className="max-w-md text-sm text-fog-dim">
          This shared extraction doesn&apos;t exist or was removed.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-fog"
        >
          Go to Nexsus.Spec
        </Link>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.3em] text-fog-faint transition hover:text-white"
          >
            nexsus.spec
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-white">{spec.title}</h1>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-fog-faint">
            {spec.products.length} products ·{" "}
            {spec.quality?.attributeCount ?? 0} attribute values · shared extraction
            {spec.model ? ` · ${spec.model}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-line-strong bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-fog-dim">
          read-only view
        </span>
      </header>

      <div className="space-y-10">
        <section>
          <ProductsTab spec={spec} onSelect={() => {}} />
        </section>
        <section>
          <DataQualityTab spec={spec} />
        </section>
      </div>

      <footer className="mt-16 border-t border-line pt-6 pb-10 text-center">
        <Link href="/" className="text-sm text-fog-dim transition hover:text-white">
          Extract your own spec sheets → nexsus.spec
        </Link>
      </footer>
    </main>
  );
}
