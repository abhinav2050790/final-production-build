"use client";

// ── Raw input panel — paste, samples, PDF/TXT attach, mode badge, forge ───────

import { useMemo, useRef, useState } from "react";
import { SAMPLES } from "@/lib/samples";

interface Props {
  running: boolean;
  mode: "ai" | "demo" | null;
  provider?: string | null;
  model: string | null;
  forcedDemo?: boolean;
  activeStageLabel: string | null;
  error: string | null;
  onRun: (text: string, title: string) => void;
}

const MAX_CHARS = 16000; // mirrors the server-side ingest cap

export default function InputPanel({
  running,
  mode,
  provider,
  model,
  forcedDemo,
  activeStageLabel,
  error,
  onRun,
}: Props) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [fetchingPage, setFetchingPage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const ready = text.trim().length >= 40;
  const busy = running || uploading;

  const fetchPage = async () => {
    if (!/^https?:\/\//i.test(pageUrl.trim())) {
      setUploadError("Paste a full http(s) URL of the product page.");
      return;
    }
    setFetchingPage(true);
    setUploadError(null);
    try {
      const res = await fetch("/api/ingest-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pageUrl.trim() }),
      });
      const d = (await res.json()) as { text?: string; title?: string; chars?: number; error?: string };
      if (!res.ok || !d.text) {
        setUploadError(d.error ?? `Fetch failed (HTTP ${res.status}).`);
        return;
      }
      applyExtracted(d.text, `fetched ${d.chars} chars from the page`, d.title);
    } catch {
      setUploadError("Could not reach that page.");
    } finally {
      setFetchingPage(false);
    }
  };

  const loadSample = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setText(s.text);
    setTitle(s.title);
    setActiveSample(id);
    setUploadNote(null);
    setUploadError(null);
  };

  const applyExtracted = (
    raw: string,
    note: string,
    titleFromName?: string
  ) => {
    const clipped = raw.length > MAX_CHARS;
    setText(clipped ? raw.slice(0, MAX_CHARS) : raw);
    setUploadNote(clipped ? `${note} (truncated to first ${MAX_CHARS.toLocaleString()} chars)` : note);
    setUploadError(null);
    setActiveSample(null);
    if (titleFromName && !title.trim()) setTitle(titleFromName);
  };

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setUploadError(null);

    const pdfs = list.filter(
      (f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf"
    );
    const txts = list.filter(
      (f) =>
        /\.(txt|md|csv|json|log)$/i.test(f.name) ||
        f.type.startsWith("text/") ||
        f.type === "application/json"
    );
    const skipped = list.length - pdfs.length - txts.length;

    if (pdfs.length === 0 && txts.length === 0) {
      setUploadError(
        "Unsupported file — attach PDF, TXT, MD, CSV, JSON or LOG files."
      );
      return;
    }

    setUploading(true);
    const sections: string[] = [];
    const docNames: string[] = [];
    const failed: string[] = [];
    const recoveredFallbacks: string[] = [];
    let pages = 0;
    try {
      for (const f of txts) {
        const content = await f.text();
        sections.push(`──── ${f.name} ────\n${content.trim()}`);
        docNames.push(f.name);
      }

      for (let i = 0; i < pdfs.length; i++) {
        const f = pdfs[i];
        setUploadNote(
          pdfs.length > 1 ? `⏳ extracting PDF ${i + 1}/${pdfs.length} — ${f.name}` : null
        );
        try {
          const body = new FormData();
          body.append("file", f);
          const res = await fetch("/api/ingest-pdf", { method: "POST", body });
          const data = (await res.json()) as {
            text?: string;
            pages?: number;
            chars?: number;
            truncated?: boolean;
            degraded?: boolean;
            name?: string;
            error?: string;
          };
          if (!res.ok || !data.text) {
            throw new Error(data.error ?? `Extraction failed (${res.status}).`);
          }
          pages += data.pages ?? 0;
          sections.push(
            `──── ${data.name ?? f.name} ────\n${data.text}`
          );
          docNames.push(data.name ?? f.name);
          if (data.degraded) recoveredFallbacks.push(data.name ?? f.name);
        } catch (err) {
          failed.push(
            `${f.name} (${err instanceof Error ? err.message : "read failed"})`
          );
        }
      }

      if (sections.length === 0) {
        setUploadError(failed[0] ?? "Nothing could be extracted from those files.");
        return;
      }

      const combined = sections.join("\n\n");
      const bits = [
        `📄 ${docNames.length} document${docNames.length === 1 ? "" : "s"} loaded`,
        pages > 0 ? `${pages} pages` : null,
        `${combined.length.toLocaleString()} chars`,
        recoveredFallbacks.length > 0
          ? `recovered ${recoveredFallbacks.length} damaged file${recoveredFallbacks.length === 1 ? "" : "s"}`
          : null,
        failed.length > 0 ? `${failed.length} file${failed.length === 1 ? "" : "s"} failed` : null,
        skipped > 0 ? `${skipped} unsupported file${skipped === 1 ? "" : "s"} skipped` : null,
      ].filter(Boolean);
      applyExtracted(
        combined,
        bits.join(" · "),
        docNames.length === 1
          ? docNames[0].replace(/\.(pdf|txt|md|csv|json|log)$/i, "")
          : undefined
      );
      if (failed.length > 0) {
        setUploadError(`Could not read: ${failed.join(" · ")}`);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="glass animate-fade-up flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-fog-dim">
          Raw input
        </h2>
        {mode && (
          <span
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
              mode === "ai"
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : forcedDemo
                  ? "border-line-strong bg-white/5 text-fog-dim"
                  : "border-amber-400/40 bg-amber-400/10 text-amber-300"
            }`}
          >
            {mode === "ai"
              ? `● ${provider ?? "AI"} live${model ? ` · ${model}` : ""}`
              : forcedDemo
                ? "● Demo forced (Shift+D) — AI skipped"
                : "● Demo mode — set an API key for live AI"}
          </span>
        )}
      </div>

      <p className="-mt-2 text-[10.5px] text-fog-faint">
        Live AI processes your input in real time. Press{" "}
        <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[9.5px] text-fog">
          Shift+D
        </kbd>{" "}
        anytime to force the deterministic offline engine instead.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => loadSample(s.id)}
            disabled={busy}
            className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
              activeSample === s.id
                ? "border-white bg-white text-black"
                : "border-line-strong bg-white/5 text-fog-dim hover:border-white hover:text-white"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={busy}
        placeholder="Spec title (optional)"
        className="w-full rounded-lg border border-line-strong bg-black/30 px-3 py-2 text-sm text-fog placeholder-fog-faint outline-none transition focus:border-white focus:ring-1 focus:ring-white/40 disabled:opacity-60"
      />

      <div
        className="relative"
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) void handleFiles(e.dataTransfer?.files);
        }}
      >
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value === "") {
              setActiveSample(null);
              setUploadNote(null);
            }
          }}
          disabled={busy}
          placeholder={
            "Paste anything raw here…\n\n• a product spec sheet\n• a datasheet extract\n• catalog rows from a PDF\n• or drop one or many PDFs on this box\n\nThe forge will organize every product and attribute."
          }
          className={`scrollbar-thin h-64 w-full resize-y rounded-lg border bg-black/30 p-3 text-[13px] leading-relaxed text-fog placeholder-fog-faint outline-none transition focus:border-white focus:ring-1 focus:ring-white/40 disabled:opacity-60 ${
            dragOver
              ? "border-white ring-2 ring-white/40"
              : "border-line-strong"
          }`}
        />
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">
            ⬇ Drop PDFs / TXT files to ingest
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-fog-faint">
        <span className="min-w-0 truncate">
          {uploadNote ? (
            <span className="text-fog-dim">{uploadNote}</span>
          ) : (
            <>
              {words} words · {text.length} chars
              {!ready && text.length > 0 && " · need ≥ 40 chars"}
            </>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.csv,.json,.log,application/pdf,text/plain,text/markdown,text/csv,application/json"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-white bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_18px_rgba(255,255,255,0.25)] transition hover:bg-fog disabled:opacity-40"
          >
            {uploading ? "⏳ extracting…" : "📎 ADD PDF / TEXT"}
          </button>
          <button
            type="button"
            onClick={() => {
              setText("");
              setTitle("");
              setActiveSample(null);
              setUploadNote(null);
              setUploadError(null);
            }}
            disabled={busy || (!text && !title)}
            className="text-fog-faint underline-offset-2 transition hover:text-white hover:underline disabled:opacity-40"
          >
            clear
          </button>
        </span>
      </div>

      {/* URL ingestion */}
      <div className="flex gap-2">
        <input
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void fetchPage()}
          disabled={busy}
          placeholder="…or paste a product-page URL and pull its text"
          className="min-w-0 flex-1 rounded-lg border border-line bg-black/30 px-3 py-2 font-mono text-[12px] text-fog placeholder-fog-faint outline-none transition focus:border-white disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void fetchPage()}
          disabled={busy || fetchingPage || !pageUrl.trim()}
          className="shrink-0 rounded-lg border border-line-strong bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-fog-dim transition hover:border-white hover:text-white disabled:opacity-40"
        >
          {fetchingPage ? "fetching…" : "fetch ↧"}
        </button>
      </div>

      {uploadError && (
        <div className="animate-fade-up rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 font-mono text-xs leading-relaxed text-amber-300">
          {uploadError}
        </div>
      )}

      {error && (
        <div className="animate-fade-up rounded-lg border-accent border bg-accent-subtle px-3 py-2 font-mono text-xs text-accent">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={busy || !ready}
        onClick={() => onRun(text, title)}
        className={`group relative w-full overflow-hidden rounded-xl px-4 py-3.5 text-sm font-semibold transition ${
          busy || !ready
            ? "cursor-not-allowed bg-white/5 text-fog-faint"
            : "bg-white text-black hover:bg-fog"
        }`}
      >
        {running ? (
          <span className="flex items-center justify-center gap-2.5">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {activeStageLabel ? `Forging — ${activeStageLabel}…` : "Starting forge…"}
          </span>
        ) : uploading ? (
          <span className="flex items-center justify-center gap-2.5">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Extracting PDF text…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">⚡ Forge Specification</span>
        )}
        {!busy && ready && <span className="shimmer pointer-events-none absolute inset-0" />}
      </button>
    </div>
  );
}
