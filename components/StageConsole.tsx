"use client";

// ── Live progress: stage cards + plain-language activity feed ─────────────────
// No terminal, no timestamps, no jargon — technical detail lives in the audit
// drawer, one click away.

import { StageId } from "@/lib/types";
import { PipelineStageState } from "./Pipeline3D";

export interface ConsoleLine {
  stage: StageId;
  message: string;
  level: "info" | "warn" | "success";
  at: number;
}

interface Props {
  lines: ConsoleLine[];
  stages: PipelineStageState[];
  onAudit?: () => void;
}

const LEVEL_DOT: Record<ConsoleLine["level"], string> = {
  info: "bg-violet-400",
  warn: "bg-amber-400",
  success: "bg-emerald-400",
};

/** Translate technical pipeline messages into plain language. */
const FRIENDLY: Array<[RegExp, string]> = [
  [/forge session started.*/i, "Starting up the forge"],
  [/Same document as before.*/i, "Same document as before — showing the identical saved result"],
  [/Normalizing whitespace & line endings…/i, "Cleaning up your text"],
  [/Segmented into (\d+) sentence-level segments/i, "Split your input into $1 readable chunks"],
  [/Document profile: (.+)/i, "This looks like: $1"],
  [/The AI \(.*\) is reading the document…/i, "The AI is reading your document…"],
  [/Offline mode — using the built-in fast parser…/i, "Offline mode — using the built-in fast parser…"],
  [/Found (\d+) products with (\d+) attribute values/i, "Found $1 products with $2 attribute values"],
  [/AI unavailable — organized raw rows.*/i, "Couldn't reach the AI — organized raw rows with the built-in parser"],
  [/no parseable product rows.*/i, "Couldn't find product data in this document"],
  [/rate limited|HTTP 429/i, "The AI is rate-limited (too many runs just now) — wait a minute or press Shift+D for offline mode"],
  [/Normalizing attribute names.*/i, "Standardizing attribute names (voltage, frequency, range…)"],
  [/Built (\d+) product pages.*/i, "Built $1 product pages with features and use cases"],
  [/Checking data quality.*/i, "Checking data quality — gaps, duplicates, coverage…"],
  [/input exceeded|very long, only the first part/i, "Your input was very long — only the first part was used"],
  [/Rendering (Markdown|JSON|CSV).*/i, "Preparing your download documents"],
  [/Artifacts ready.*/i, "All documents are ready to download"],
];

function friendly(message: string): string {
  for (const [re, replacement] of FRIENDLY) {
    const out = message.replace(re, replacement);
    if (out !== message) return out;
  }
  return message;
}

export default function StageConsole({ lines, stages, onAudit }: Props) {
  const working = stages.some((s) => s.status === "active");
  const recent = lines.slice(-6);

  return (
    <div className="space-y-4">
      {/* Stage summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {stages.map((s) => (
          <div
            key={s.id}
            className={`glass animate-fade-up rounded-xl p-3 transition-colors duration-300 ${
              s.status === "active"
                ? "border-accent shadow-glow"
                : s.status === "done"
                  ? "border-emerald-400/30"
                  : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{s.icon}</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  s.status === "active"
                    ? "animate-pulse bg-accent"
                    : s.status === "done"
                      ? "bg-emerald-400"
                      : "bg-fog-faint"
                }`}
              />
            </div>
            <p className="mt-1.5 text-xs font-semibold text-fog">{s.name}</p>
            <p className="mt-0.5 h-8 text-[10px] leading-snug text-fog-dim">
              {s.meta ?? (s.status === "active" ? "working…" : "waiting")}
            </p>
          </div>
        ))}
      </div>

      {/* Plain-language activity feed */}
      <div className="glass-strong animate-fade-up rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {working ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
            ) : (
              <span className={`h-2.5 w-2.5 rounded-full ${lines.length ? "bg-emerald-400" : "bg-fog-faint"}`} />
            )}
            <h3 className="text-sm font-semibold text-fog">
              {working ? "Working…" : lines.length ? "Done" : "What's happening"}
            </h3>
          </div>
          {onAudit && (
            <button
              type="button"
              onClick={onAudit}
              className="rounded-lg border border-line bg-white/5 px-3 py-1.5 text-xs text-fog transition hover:border-white hover:text-white"
            >
              🧾 Technical details
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-fog-faint">
            Waiting for your input — paste notes or attach a file to begin.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {recent.map((l, i) => (
              <li
                key={`${l.at}-${i}`}
                className={`animate-fade-up flex items-start gap-2.5 text-sm leading-snug ${
                  i === recent.length - 1 ? "text-fog" : "text-fog-dim"
                }`}
              >
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${LEVEL_DOT[l.level]}`} />
                {friendly(l.message)}
              </li>
            ))}
          </ul>
        )}
        {lines.length > recent.length && (
          <p className="mt-3 text-xs text-fog-faint">
            +{lines.length - recent.length} earlier steps — full history in Technical details
          </p>
        )}
      </div>
    </div>
  );
}
