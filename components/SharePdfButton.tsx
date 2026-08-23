"use client";

// ── PDF download for shared extraction views ──────────────────────────────────

import { useState } from "react";
import type { SpecDocument } from "@/lib/types";

export default function SharePdfButton({ spec }: { spec: SpecDocument }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload = JSON.parse(JSON.stringify(spec)) as SpecDocument;
      delete (payload.input as unknown as { rawText?: string }).rawText;
      delete (payload.input as unknown as { segments?: unknown }).segments;
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(spec.title || "spec-sheet")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-fog disabled:opacity-50"
      >
        {busy ? "⏳ rendering…" : "⬇ Download PDF report"}
      </button>
      {error && (
        <span className="rounded-lg border-accent border bg-accent-subtle px-3 py-1.5 font-mono text-[10px] text-accent">
          {error}
        </span>
      )}
    </div>
  );
}
