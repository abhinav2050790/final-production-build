"use client";

// ── Chat with your specs — floating Q&A panel over the current extraction ─────

import { useEffect, useRef, useState } from "react";

interface Turn {
  role: "user" | "ai";
  text: string;
}

interface Props {
  /** Inline spec to chat over (current run). */
  spec?: unknown;
  /** Or a shared extraction slug. */
  slug?: string;
}

export default function ChatPanel({ spec, slug }: Props) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, open]);

  const ask = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, ...(slug ? { slug } : { spec }) }),
      });
      const d = (await res.json()) as { answer?: string; error?: string };
      setTurns((t) => [
        ...t,
        { role: "ai", text: d.answer ?? `⚠ ${d.error ?? "no answer"}` },
      ]);
    } catch {
      setTurns((t) => [...t, { role: "ai", text: "⚠ connection failed — try again" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-white bg-white px-5 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgba(255,255,255,0.25)] transition hover:bg-fog"
      >
        💬 {open ? "Close" : "Ask the specs"}
      </button>

      {open && (
        <div className="glass-strong animate-fade-up fixed bottom-24 right-6 z-50 flex h-[480px] w-[min(420px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-fog-dim">
              spec.q&amp;a
            </span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          </div>

          <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
            {turns.length === 0 && (
              <div className="space-y-2 pt-6 text-center">
                <p className="text-sm font-medium text-fog-dim">Ask anything about this data.</p>
                <p className="font-mono text-[10px] leading-relaxed text-fog-faint">
                  e.g. &ldquo;which products are IP54?&rdquo;
                  <br />
                  &ldquo;compare weights of all drills&rdquo;
                  <br />
                  &ldquo;anything suitable for outdoor use?&rdquo;
                </p>
              </div>
            )}
            {turns.map((t, i) => (
              <div
                key={i}
                className={
                  t.role === "user"
                    ? "ml-auto max-w-[85%] rounded-xl bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-black"
                    : "max-w-[90%] rounded-xl border border-line bg-raised px-3.5 py-2.5 text-[12.5px] leading-relaxed text-fog"
                }
              >
                {t.text}
              </div>
            ))}
            {busy && (
              <div className="flex gap-1.5 px-2 py-2">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
                    style={{ animationDelay: `${d * 0.18}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-line p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void ask()}
              placeholder="ask about voltage, ratings…"
              className="min-w-0 flex-1 rounded-lg border border-line-strong bg-black/30 px-3 py-2 text-sm text-fog placeholder-fog-faint outline-none transition focus:border-white"
            />
            <button
              type="button"
              onClick={() => void ask()}
              disabled={busy || !input.trim()}
              className="rounded-lg bg-white px-4 text-sm font-bold text-black transition hover:bg-fog disabled:opacity-40"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
