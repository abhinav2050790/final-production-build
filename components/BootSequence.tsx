"use client";

// ── System boot sequence — full-screen fake terminal login ────────────────────
// CRT power-on → typewriter log lines → progress bar → ACCESS GRANTED stamp →
// fade-out revealing the page. Click anywhere to skip. Honors reduced motion.

import { useCallback, useEffect, useRef, useState } from "react";

const LINES = [
  "NEXSUS.SPEC TERMINAL v3.7 — SECURE CHANNEL",
  "> memory check ................ 64K OK",
  "> mounting /spec/database ..... OK",
  "> linking ai core ............. ONLINE",
  "> calibrating pipeline ........ 5 STAGES READY",
  "> operator authentication ..... VERIFIED",
];

interface Props {
  /** Fire when the overlay starts dissolving — scroll to the target now. */
  onArrive: () => void;
  /** Fire when the overlay is fully gone — safe to unmount. */
  onDone: () => void;
}

export default function BootSequence({ onArrive, onDone }: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [phase, setPhase] = useState<"type" | "granted" | "fade">("type");
  const idx = useRef({ l: 0, c: 0 });
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  // Reduced motion or user preference: no theatrics, straight in.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onArrive();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typewriter engine
  useEffect(() => {
    if (phase !== "type") return;
    const t = window.setInterval(() => {
      const s = idx.current;
      if (s.l >= LINES.length) {
        window.clearInterval(t);
        timers.current.push(window.setTimeout(() => setPhase("granted"), 260));
        return;
      }
      const line = LINES[s.l];
      s.c = Math.min(line.length, s.c + 3);
      setCurrent(line.slice(0, s.c));
      if (s.c >= line.length) {
        setLines((prev) => [...prev, line]);
        setCurrent("");
        s.l += 1;
        s.c = 0;
      }
    }, 16);
    return () => window.clearInterval(t);
  }, [phase]);

  // Granted stamp → fade out and hand control back
  useEffect(() => {
    if (phase === "granted") {
      timers.current.push(
        window.setTimeout(() => {
          setPhase("fade");
          onArrive();
          timers.current.push(window.setTimeout(onDone, 520));
        }, 950)
      );
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const skip = () => {
    clearTimers();
    setLines(LINES);
    setCurrent("");
    setPhase("fade");
    onArrive();
    timers.current.push(window.setTimeout(onDone, 300));
  };

  // Lock page scroll while the system "boots"
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const progress = Math.round(((idx.current.l + (current ? 0.5 : 0)) / LINES.length) * 100);

  return (
    <div className="boot-overlay crt-on" onClick={skip} role="presentation">
      <div className="absolute inset-0 px-6 py-10 sm:px-14 sm:py-14 boot-flicker">
        <div className="scanlines" />
        <div className="mx-auto flex h-full max-w-2xl flex-col font-mono text-[13px] leading-relaxed text-fog-dim sm:text-sm">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-white">NEXSUS.SPEC OS</span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-fog-faint">
              secure login
            </span>
          </div>

          <div className="mt-6 space-y-1.5">
            {lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
            {phase === "type" && current && <p className="boot-caret">{current}</p>}
            {phase === "type" && !current && <p className="boot-caret">&nbsp;</p>}
          </div>

          {phase !== "type" && (
            <div className="stamp mt-8">
              <p className="font-mono text-2xl font-bold tracking-[0.2em] text-accent sm:text-4xl">
                ACCESS GRANTED
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-widest text-fog-faint">
                welcome, operator
              </p>
            </div>
          )}

          <div className="mt-auto">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-fog-faint">
              <span>loading workspace</span>
              <span>{Math.max(progress, phase === "type" ? progress : 100)}%</span>
            </div>
            <div
              className="boot-bar w-full bg-white/5"
              style={{ width: `${phase === "type" ? Math.max(progress, 4) : 100}%` }}
            />
            <p className="mt-3 text-[10px] uppercase tracking-widest text-fog-faint">
              click anywhere to skip
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
