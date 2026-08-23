"use client";

// ── Nexsus.Spec — product data extractor, single-page app shell ───────────────

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ParticleHero from "@/components/ParticleHero";
import Pipeline3D, { PipelineStageState } from "@/components/Pipeline3D";
import StageConsole, { ConsoleLine } from "@/components/StageConsole";
import InputPanel from "@/components/InputPanel";
import ProductsTab from "@/components/ProductsTab";
import ProductDetailDrawer from "@/components/ProductDetailDrawer";
import DataQualityTab from "@/components/DataQualityTab";
import ExportTab from "@/components/ExportTab";
import AuditDrawer from "@/components/AuditDrawer";
import AuthBadge from "@/components/AuthBadge";
import ChatPanel from "@/components/ChatPanel";
import RoomIntro from "@/components/RoomIntro";
import CompareTab from "@/components/CompareTab";
import {
  AuditRun,
  PipelineEvent,
  ProductRecord,
  SpecDocument,
  StageId,
  StageStatus,
  STAGES,
} from "@/lib/types";

type Tab = "products" | "compare" | "quality" | "export";

function initialStages(): PipelineStageState[] {
  return STAGES.map((s) => ({ id: s.id, name: s.name, icon: s.icon, status: "idle" as StageStatus }));
}

export default function Home() {
  const [stages, setStages] = useState<PipelineStageState[]>(initialStages);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [spec, setSpec] = useState<SpecDocument | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [model, setModel] = useState<string | null>(null);
  const [demoForced, setDemoForced] = useState(false);
  const demoForcedRef = useRef(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("products");
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [audit, setAudit] = useState<AuditRun | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);
  const lastInputRef = useRef<{ text: string; title: string } | null>(null);

  // ── Cinematic room intro ───────────────────────────────────────────────
  const [introGone, setIntroGone] = useState(true);
  const handleIntroDone = useCallback(() => setIntroGone(true), []);
  useEffect(() => setIntroGone(false), []);

  // ── Cloud library ──────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const saveToLibrary = useCallback(async () => {
    if (!spec || saving) return;
    setSaving(true);
    try {
      const payload = JSON.parse(JSON.stringify(spec)) as SpecDocument;
      // slim the payload — the share view never needs the raw corpus
      delete (payload.input as unknown as { rawText?: string }).rawText;
      delete (payload.input as unknown as { segments?: unknown }).segments;
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = (await res.json()) as { record?: { slug: string }; error?: string };
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setSavedSlug(d.record!.slug);
      setToast(`Saved to library ✓ /s/${d.record!.slug}`);
    } catch (e) {
      setToast(`⚠ ${e instanceof Error ? e.message : "could not save"}`);
    } finally {
      setSaving(false);
    }
  }, [spec, saving]);

  const updateProduct = useCallback((updated: ProductRecord) => {
    setSpec((s) =>
      s
        ? { ...s, products: s.products.map((p) => (p.id === updated.id ? updated : p)) }
        : s
    );
    setSelectedProduct(updated);
  }, []);

  const effectiveMode: "ai" | "demo" = aiAvailable && !demoForced ? "ai" : "demo";

  // Capability probe + warmup preflight
  useEffect(() => {
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((d: { mode?: "ai" | "demo"; provider?: string | null; model?: string | null }) => {
        setAiAvailable(d.mode === "ai");
        setModel(d.model ?? null);
      })
      .catch(() => setAiAvailable(false));
    fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ warmup: true }),
    }).catch(() => {});
  }, []);

  // Shift+D toggles forced demo mode (ignored while typing in inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isShiftD =
        e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey &&
        (e.key === "D" || e.key === "d" || e.code === "KeyD");
      if (!isShiftD) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      ) {
        return;
      }
      const next = !demoForcedRef.current;
      demoForcedRef.current = next;
      setDemoForced(next);
      setToast(
        next
          ? "⇄ Fast offline mode — AI skipped (Shift+D to re-enable live AI)"
          : "⇄ Live AI re-enabled"
      );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const handleEvent = useCallback((ev: PipelineEvent) => {
    switch (ev.type) {
      case "stage_start":
        setStages((prev) =>
          prev.map((s) => (s.id === ev.stage ? { ...s, status: "active", meta: undefined } : s))
        );
        setAudit((prev) =>
          prev
            ? { ...prev, entries: [...prev.entries, { at: Date.now(), stage: ev.stage, kind: "stage_start" }] }
            : prev
        );
        break;
      case "log":
        setLines((prev) => [
          ...(prev.length > 200 ? prev.slice(-200) : prev),
          { stage: ev.stage, message: ev.message, level: ev.level ?? "info", at: Date.now() },
        ]);
        setAudit((prev) =>
          prev
            ? {
                ...prev,
                entries: [
                  ...prev.entries,
                  { at: Date.now(), stage: ev.stage, kind: "log", message: ev.message, level: ev.level ?? "info" },
                ],
              }
            : prev
        );
        break;
      case "stage_end":
        setStages((prev) =>
          prev.map((s) => (s.id === ev.stage ? { ...s, status: "done", meta: ev.summary } : s))
        );
        setAudit((prev) =>
          prev
            ? {
                ...prev,
                entries: [
                  ...prev.entries,
                  { at: Date.now(), stage: ev.stage, kind: "stage_end", summary: ev.summary, durationMs: ev.durationMs },
                ],
              }
            : prev
        );
        break;
      case "complete":
        setSpec(ev.spec);
        setAudit((prev) =>
          prev
            ? {
                ...prev,
                title: ev.spec.title,
                mode: ev.spec.mode,
                totals: {
                  products: ev.spec.products.length,
                  score: ev.spec.quality.score,
                  durationMs: Date.now() - prev.startedAt,
                },
                entries: [
                  ...prev.entries,
                  {
                    at: Date.now(),
                    stage: "complete",
                    kind: "stage_end",
                    summary: `${ev.spec.products.length} products · ${ev.spec.quality.attributeCount} attribute values · quality ${ev.spec.quality.score}/100`,
                  },
                ],
              }
            : prev
        );
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        break;
      case "error":
        setError(ev.message);
        break;
    }
  }, []);

  const run = useCallback(
    async (text: string, title: string, refresh = false) => {
      setRunning(true);
      setError(null);
      setSpec(null);
      setTab("products");
      setStages(initialStages());
      lastInputRef.current = { text, title };
      setAudit({
        startedAt: Date.now(),
        title: title.trim() || "Untitled run",
        mode: demoForcedRef.current || !aiAvailable ? "demo" : "ai",
        entries: [],
      });
      setLines([
        {
          stage: "ingest",
          message: "forge session started — streaming pipeline events",
          level: "info",
          at: Date.now(),
        },
      ]);
      studioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      try {
        const res = await fetch("/api/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, title, demo: demoForcedRef.current, refresh }),
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? `Pipeline request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const lineStr = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!lineStr) continue;
            try {
              handleEvent(JSON.parse(lineStr) as PipelineEvent);
            } catch {
              // skip malformed line
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong while extracting.");
      } finally {
        setRunning(false);
      }
    },
    [handleEvent, aiAvailable]
  );

  const activeStageLabel =
    STAGES.find((s) => stages.find((x) => x.id === s.id)?.status === "active")?.name ?? null;

  const tabBtn = (id: Tab, label: string, icon: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        tab === id
          ? "border border-white bg-white text-black"
          : "border border-transparent text-fog-dim hover:text-white"
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <main className="relative">
      {!introGone && <RoomIntro onDone={handleIntroDone} />}

      {/* ── Google account badge ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute right-4 top-4 z-40 flex flex-col items-end gap-2 sm:right-6 sm:top-6">
        <AuthBadge />
        <Link
          href="/library"
          className="pointer-events-auto rounded-lg border border-line-strong bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-fog-dim transition hover:border-white hover:text-white"
        >
          📚 my library
        </Link>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <ParticleHero />
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255, 255, 255, 0.14), rgba(215, 25, 33, 0.08) 55%, transparent 70%)",
          }}
        />
        <div className="animate-fade-up-slow relative z-10 max-w-4xl">
          <h1 className="text-[14vw] font-bold leading-none tracking-tight text-white sm:text-[8rem]">
            Nexsus.Spec
          </h1>
          <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/5 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-fog-dim">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Real-AI extraction · spec sheets, datasheets & catalogs in — organized product data out
          </span>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-fog-dim sm:text-lg">
            Nexsus.spec reads spec sheets, datasheets and product catalogs and
            organizes every product into clean pages — every attribute with its
            value, key features and use cases, ready to search, filter and export.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#studio"
              className="rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-fog"
            >
              ⚡ Extract product data
            </a>
            <a
              href="#how"
              className="rounded-xl border border-line-strong bg-transparent px-7 py-3.5 text-sm font-medium text-fog transition hover:border-white"
            >
              How it works
            </a>
          </div>
          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
            {[
              { n: "5", l: "pipeline stages" },
              { n: "3", l: "export formats" },
              { n: "100%", l: "attribute:value data" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl px-4 py-4">
                <p className="font-mono text-2xl font-bold text-white">{s.n}</p>
                <p className="mt-0.5 text-[11px] text-fog-dim">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 z-10 animate-bounce text-fog-faint">↓</div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-white">
          The <span className="gradient-text">five-stage</span> forge
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-fog-dim">
          Every document passes through the same assembly line. Watch it flow
          live in 3D — each stage reports what it did.
        </p>
        <div className="mt-10 grid gap-3 md:grid-cols-5">
          {STAGES.map((s, i) => (
            <div
              key={s.id}
              className="glass animate-fade-up rounded-2xl p-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                <span className="font-mono text-[10px] text-fog-faint">STAGE 0{i + 1}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{s.name}</h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-fog-dim">{s.tagline}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Studio ───────────────────────────────────────────────────────── */}
      <section id="studio" ref={studioRef} className="mx-auto max-w-7xl scroll-mt-6 px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <InputPanel
            running={running}
            mode={effectiveMode}
            model={model}
            forcedDemo={demoForced}
            activeStageLabel={activeStageLabel}
            error={error}
            onRun={run}
          />

          <div className="flex flex-col gap-6">
            <div className="glass relative overflow-hidden rounded-2xl pt-4">
              <div className="flex items-center justify-between px-5 pb-1">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-fog-dim">
                  Pipeline <span className="text-fog-faint">/ isometric view</span>
                </h2>
                <span className="hidden font-mono text-[10px] text-fog-faint sm:block">
                  move cursor to tilt
                </span>
              </div>
              <Pipeline3D stages={stages} />
            </div>
            <StageConsole
              lines={lines}
              stages={stages}
              onAudit={
                audit && audit.entries.length > 0
                  ? () => setAuditOpen(true)
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {spec && (
        <section ref={resultsRef} className="mx-auto max-w-7xl scroll-mt-4 px-6 pb-24">
          <div className="animate-fade-up glass mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white">{spec.title}</h2>
                <span
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                    spec.mode === "ai"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-amber-400/40 bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {spec.mode === "ai" ? `extracted by live AI · ${spec.model ?? "ai"}` : "fast parser"}
                </span>
                {spec.cached && (
                  <span className="rounded-full border border-line-strong bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-fog-dim">
                    ✔ cached · identical result
                  </span>
                )}
                <span className="rounded-full border border-line bg-white/5 px-2.5 py-1 text-[10px] text-fog-dim">
                  {spec.products.length} products · {spec.quality.attributeCount} values
                </span>
              </div>
              {spec.modeNote && (
                <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-amber-300/80">
                  {spec.modeNote}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {lastInputRef.current && (
                <button
                  type="button"
                  onClick={() =>
                    run(lastInputRef.current!.text, lastInputRef.current!.title, true)
                  }
                  disabled={running}
                  className="rounded-xl border border-line-strong bg-white/5 px-4 py-2 text-sm font-medium text-fog transition hover:border-white hover:text-white disabled:opacity-50"
                  title="Re-run the AI on this document and save a fresh result"
                >
                  ↻ Re-extract fresh
                </button>
              )}
              <button
                type="button"
                onClick={() => void saveToLibrary()}
                disabled={saving}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  savedSlug
                    ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border border-line-strong bg-white/5 text-fog hover:border-white hover:text-white"
                } disabled:opacity-50`}
                title="Save this extraction to your cloud library and get a share link"
              >
                {savedSlug ? "✓ saved" : saving ? "saving…" : "☁ Save to library"}
              </button>
              {savedSlug && (
                <Link
                  href={`/s/${savedSlug}`}
                  target="_blank"
                  className="rounded-xl border border-line-strong bg-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-fog-dim transition hover:border-white hover:text-white"
                >
                  /s/{savedSlug} ↗
                </Link>
              )}
              <button
                type="button"
                onClick={() => setAuditOpen(true)}
                disabled={!audit || audit.entries.length === 0}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  audit && audit.entries.length > 0
                    ? "border border-line-strong bg-white/5 text-fog hover:border-white hover:text-white"
                    : "pointer-events-none border border-transparent text-fog-faint"
                }`}
              >
                🧾 Audit trail
              </button>
              <div className="flex gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
                {tabBtn("products", "Products", "🧱")}
                {tabBtn("compare", "Compare", "⚖️")}
                {tabBtn("quality", "Data quality", "🛡️")}
                {tabBtn("export", "Export", "📦")}
              </div>
            </div>
          </div>

          <div key={tab} className="animate-fade-up">
            {tab === "products" && (
              <ProductsTab spec={spec} onSelect={setSelectedProduct} />
            )}
            {tab === "compare" && <CompareTab spec={spec} />}
            {tab === "quality" && <DataQualityTab spec={spec} />}
            {tab === "export" && <ExportTab spec={spec} />}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-10 text-center" />

      <ProductDetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onChange={updateProduct}
      />

      {spec && <ChatPanel spec={spec} />}

      <AuditDrawer
        run={audit}
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
      />

      {toast && (
        <div
          key={toast}
          className="glass-strong animate-fade-up fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border-line-strong px-5 py-2.5 font-mono text-xs font-medium text-white"
          role="status"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
