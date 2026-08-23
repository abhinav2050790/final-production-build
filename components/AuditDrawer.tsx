"use client";

// ── Full-screen audit drawer — the reasoning chain of the last run ────────────
// Vertical timeline: one section per pipeline stage, with every streamed event
// (start, logs, end + duration/summary) in order, plus a terminal node.

import { useEffect } from "react";
import { AuditEntry, AuditRun, StageId, STAGES } from "@/lib/types";

interface Props {
  run: AuditRun | null;
  open: boolean;
  onClose: () => void;
}

const STAGE_ACCENT: Record<string, string> = {
  ingest: "border-line-strong text-white",
  extract: "border-line-strong text-white",
  enrich: "border-line-strong text-white",
  validate: "border-line-strong text-white",
  export: "border-line-strong text-white",
  complete: "border-emerald-400/60 text-emerald-300",
};

const STAGE_LINE: Record<string, string> = {
  ingest: "from-white/40",
  extract: "from-white/40",
  enrich: "from-white/40",
  validate: "from-white/40",
  export: "from-white/40",
};

const LEVEL_DOT: Record<string, string> = {
  info: "bg-slate-500",
  warn: "bg-amber-400",
  success: "bg-emerald-400",
};

function fmtOffset(at: number, startedAt: number): string {
  return `+${((at - startedAt) / 1000).toFixed(1)}s`;
}

function fmtDur(ms?: number): string {
  if (ms === undefined) return "";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function fmtClock(at: number): string {
  return new Date(at).toLocaleTimeString("en-US", { hour12: false });
}

function stageIcon(id: string): string {
  if (id === "complete") return "✓";
  return STAGES.find((s) => s.id === id)?.icon ?? "•";
}

function stageName(id: string): string {
  if (id === "complete") return "Complete";
  return STAGES.find((s) => s.id === id)?.name ?? id;
}

function entryLine(e: AuditEntry): string {
  if (e.kind === "stage_start") return "stage started";
  if (e.kind === "stage_end") return e.summary ?? "stage finished";
  return e.message ?? "";
}

export default function AuditDrawer({ run, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!run || !open) return null;

  const order: Array<StageId | "complete"> = [
    ...STAGES.map((s) => s.id),
    "complete",
  ];
  const groups = order
    .map((id) => ({ id, entries: run.entries.filter((e) => e.stage === id) }))
    .filter((g) => g.entries.length > 0);

  const totalMs =
    run.totals?.durationMs ??
    (run.entries.length
      ? run.entries[run.entries.length - 1].at - run.startedAt
      : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass-strong animate-fade-up relative flex h-full max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl">
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white">🧾 Audit trail</h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  run.mode === "ai"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-300"
                }`}
              >
                {run.mode === "ai" ? "live AI" : "demo heuristics"}
              </span>
              {run.totals && (
                <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 text-[10px] text-fog-dim">
                  {run.totals.products} products · quality {run.totals.score}/100
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-fog-dim">
              {run.title} · started {fmtClock(run.startedAt)} · {fmtDur(totalMs)} total ·{" "}
              {run.entries.length} recorded events
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit drawer"
            className="shrink-0 rounded-lg border border-line bg-white/5 px-2.5 py-1 text-sm text-fog-dim transition hover:border-white/25 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* timeline */}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-6">
          {groups.map((g, gi) => {
            const end = g.entries.find((e) => e.kind === "stage_end");
            const isLast = gi === groups.length - 1;
            return (
              <section key={g.id} className="animate-fade-up relative pb-8 pl-14 last:pb-2" style={{ animationDelay: `${gi * 60}ms` }}>
                {/* rail */}
                {!isLast && (
                  <span
                    className={`absolute left-5 top-11 bottom-0 w-px bg-gradient-to-b ${STAGE_LINE[g.id] ?? "from-slate-500/60"} to-slate-600/20`}
                  />
                )}
                {/* icon */}
                <span
                  className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl border bg-[#111111] text-lg ${STAGE_ACCENT[g.id]}`}
                >
                  {stageIcon(g.id)}
                </span>
                {/* stage header */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-fog">
                    {stageName(g.id)}
                  </h3>
                  {end?.durationMs !== undefined && (
                    <span className="rounded-full border border-line bg-white/5 px-2 py-0.5 font-mono text-[10px] text-fog-dim">
                      {fmtDur(end.durationMs)}
                    </span>
                  )}
                </div>
                {/* entries */}
                <ul className="mt-2.5 space-y-1.5">
                  {g.entries.map((e, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 font-mono text-[11.5px] leading-relaxed ${
                        e.kind === "stage_end"
                          ? "border border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200"
                          : "text-fog"
                      }`}
                    >
                      <span className="shrink-0 text-fog-faint">
                        {fmtOffset(e.at, run.startedAt)}
                      </span>
                      {e.kind === "log" && (
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${LEVEL_DOT[e.level ?? "info"]}`} />
                      )}
                      <span className="min-w-0 break-words">{entryLine(e)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {/* footer */}
        <div className="border-t border-white/8 px-6 py-3 text-[11px] text-fog-faint">
          Every event above was streamed live from the pipeline — nothing is
          reconstructed after the fact. Esc or click outside to close.
        </div>
      </div>
    </div>
  );
}
