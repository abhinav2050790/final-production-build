"use client";

// ── Cinematic room intro — operator rolls in, sits, camera dollies forward ────
// through the already-live screen into the real homepage. Plays once per
// session. Click anywhere to skip. Reduced-motion users skip automatically.

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "dark" | "enter" | "slide" | "sit" | "push" | "handoff" | "gone";

const RED = "#d71921";

const TIMELINE: Array<[Phase, number]> = [
  ["enter", 1100], // slow fade up from black — screen already glowing
  ["slide", 2700], // chair rolls toward the desk
  ["sit", 4300], // settles into seat
  ["push", 5000], // long cinematic dolly straight into the screen
  ["handoff", 7600], // pass through the glass — homepage takes over
];

export default function RoomIntro({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<Phase>("dark");
  const [mounted, setMounted] = useState(false);
  const timers = useRef<number[]>([]);

  // latest-ref: keeps `finish` identity stable so Home re-renders can never
  // tear down and restart the timeline effect mid-play
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setPhase("gone");
    onDoneRef.current?.();
  }, [clearTimers]);

  useEffect(() => {
    // one per browser session; reduced-motion visitors go straight in.
    // `?intro` forces playback regardless (demo/testing).
    let seen = false;
    let reduced = false;
    try {
      seen = sessionStorage.getItem("nx_intro_seen") === "1";
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      // storage blocked — play anyway, just don't persist
    }
    const forced =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("intro");

    if ((seen || reduced) && !forced) {
      finish();
      return;
    }
    setMounted(true);
    try {
      sessionStorage.setItem("nx_intro_seen", "1");
    } catch {}

    for (const [p, t] of TIMELINE) {
      timers.current.push(window.setTimeout(() => setPhase(p), t));
    }
    // 8400ms lets the 700ms handoff dissolve complete before unmount
    timers.current.push(window.setTimeout(finish, 8400));

    return () => clearTimers();
  }, [finish, clearTimers]);

  const skip = useCallback(() => {
    clearTimers();
    // ride the existing handoff dissolve (700ms) instead of cutting hard
    setPhase("handoff");
    timers.current.push(window.setTimeout(finish, 720));
  }, [clearTimers, finish]);

  const ORDER: Phase[] = ["dark", "enter", "slide", "sit", "push", "handoff", "gone"];
  const reached = (p: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(p);

  if (!mounted || phase === "gone") return null;

  const pushing = reached("push");

  return (
    <div
      onClick={skip}
      className={`fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-black transition-opacity duration-700 ${
        phase === "handoff" ? "opacity-0" : "opacity-100"
      }`}
      role="presentation"
    >
      {/* ── The room ─────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 transition-opacity duration-[900ms]"
        style={{ opacity: reached("enter") ? 1 : 0 }}
      >
        {/* base darkness */}
        <div className="absolute inset-0 bg-[#040404]" />

        {/* warm dull key light — lamp off-frame left */}
        <div
          className="absolute -left-40 top-1/4 h-[130%] w-[70%] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255,150,70,0.10), rgba(255,110,40,0.04) 45%, transparent 70%)",
          }}
        />

        {/* red RGB strip glow behind the monitor */}
        <div
          className={`absolute left-1/2 top-[40%] h-28 w-[90%] -translate-x-1/2 rounded-full blur-2xl transition-all duration-[3000ms] ${
            reached("sit") ? "opacity-100" : "opacity-55"
          }`}
          style={{
            background:
              "radial-gradient(ellipse, rgba(215,25,33,0.5), rgba(215,25,33,0.18) 45%, transparent 72%)",
            animation: "rgbBreathe 3.2s ease-in-out infinite",
          }}
        />
        {/* the physical strip */}
        <div
          className="absolute left-1/2 top-[49%] h-[3px] w-[72%] -translate-x-1/2 rounded-full"
          style={{
            background: "#ff2222",
            boxShadow: "0 0 22px 6px rgba(255,30,30,0.55)",
          }}
        />

        {/* faint ceiling spill */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.02] to-transparent" />

        {/* ── Camera rig: pure forward dolly, origin locked to the screen ── */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transformOrigin: "50% 52%",
            transform: pushing ? "scale(7)" : "scale(1)",
            transition: pushing
              ? "transform 2600ms cubic-bezier(0.55, 0.08, 0.18, 1)"
              : "transform 700ms ease-out",
          }}
        >
          {/* desk surface */}
          <div className="absolute bottom-[22%] left-[4%] h-[10px] w-[92%] rounded-sm bg-[#141210] shadow-[0_-2px_12px_rgba(255,140,60,0.06)]" />
          {/* desk front edge */}
          <div className="absolute bottom-[12%] left-[7%] h-[10%] w-[86%] bg-[#0b0a09]" />

          {/* monitor — dead center, already awake, homepage live on glass */}
          <div className="absolute bottom-[31%] left-1/2 -translate-x-1/2">
            {/* bezel + screen */}
            <div className="rounded-md border border-[#1c1c1c] bg-black p-1.5 shadow-[0_0_90px_rgba(215,25,33,0.20)]">
              <div
                className={`relative h-48 w-72 overflow-hidden rounded-sm sm:h-52 sm:w-80 transition-[filter] duration-[1500ms] ${
                  pushing ? "brightness-105" : "brightness-[0.85]"
                }`}
                style={{
                  background: "linear-gradient(160deg, #0d0d0d 0%, #101010 100%)",
                }}
              >
                {/* screen content — the site is already on */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span className="font-mono text-[7px] uppercase tracking-[0.35em] text-fog-dim">
                    session start
                  </span>
                  <span
                    className="font-mono text-xs font-bold tracking-[0.25em] text-white sm:text-sm"
                    style={{ textShadow: "0 0 12px rgba(255,255,255,0.35)" }}
                  >
                    NEXSUS.SPEC
                  </span>
                  <div className="h-px w-16 bg-accent" />
                  <span className="font-mono text-[6px] uppercase tracking-[0.3em] text-fog-faint">
                    extracting product data…
                  </span>
                </div>
                {/* dot-matrix texture */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #262626 0.8px, transparent 0.8px)",
                    backgroundSize: "10px 10px",
                    opacity: 0.3,
                  }}
                />
                {/* glass reflection */}
                <div className="pointer-events-none absolute -left-6 -top-8 h-48 w-28 rotate-[20deg] bg-gradient-to-b from-white/[0.05] to-transparent" />
              </div>
            </div>
            {/* stand below the screen */}
            <div className="mx-auto h-9 w-2 bg-[#101010]" />
            <div className="mx-auto h-1.5 w-24 rounded-full bg-[#161616]" />
          </div>

          {/* keyboard glow, centered on the desk */}
          <div className="absolute bottom-[23.5%] left-1/2 h-1.5 w-56 -translate-x-1/2 rounded-full bg-[#1a1512] shadow-[0_0_18px_rgba(255,120,50,0.08)]" />

          {/* ── Gaming chair + operator, rolls in from the right ─────────── */}
          <div
            className="absolute bottom-[20%] right-[13%]"
            style={{
              transform:
                phase === "slide" || reached("slide")
                  ? "translateX(0) rotate(0deg)"
                  : "translateX(190px) rotate(-6deg)",
              transition:
                "transform 1700ms cubic-bezier(0.22, 1.1, 0.36, 1)",
              transitionDelay: phase === "slide" ? "180ms" : "0ms",
            }}
          >
            <svg width="190" height="230" viewBox="0 0 190 230" fill="none">
              {/* chair back */}
              <g>
                <rect x="118" y="18" width="44" height="128" rx="18" fill="#0d0d0f" />
                <rect x="124" y="26" width="32" height="112" rx="13" fill="#131316" />
                {/* red piping on chair */}
                <rect x="121" y="22" width="2.5" height="118" rx="1" fill={RED} opacity="0.55" />
                {/* headrest */}
                <rect x="126" y="6" width="30" height="20" rx="9" fill="#111114" />
              </g>

              {/* operator — young, hooded, relaxed posture (silhouette + rim light) */}
              <g
                style={{
                  transform:
                    phase === "sit" || reached("sit")
                      ? "translateY(0px)"
                      : "translateY(-26px)",
                  transition: "transform 1000ms cubic-bezier(0.3, 1.2, 0.4, 1)",
                }}
              >
                {/* torso leaning slightly forward */}
                <path
                  d="M96 78 C88 92 84 118 86 142 L134 146 C138 116 132 90 120 76 C112 68 102 70 96 78 Z"
                  fill="#0a0a0c"
                />
                {/* hoodie rim light (red from behind) */}
                <path
                  d="M120 76 C130 88 136 112 134 144"
                  stroke={RED}
                  strokeWidth="1.6"
                  opacity="0.5"
                  strokeLinecap="round"
                />
                {/* head */}
                <circle cx="106" cy="58" r="17" fill="#0b0b0d" />
                {/* hair / beanie edge highlight */}
                <path
                  d="M92 52 A17 17 0 0 1 119 47"
                  stroke="#e8e8e8"
                  strokeOpacity="0.14"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                {/* arm reaching keyboard */}
                <path
                  d="M98 104 C82 112 66 122 54 132 L58 140 C74 130 90 122 104 116 Z"
                  fill="#0a0a0c"
                />
                {/* forearm rim */}
                <path
                  d="M56 133 C72 123 88 114 102 108"
                  stroke="#ffb37a"
                  strokeOpacity="0.22"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                {/* second arm resting */}
                <path
                  d="M104 110 C94 120 86 128 78 134 L82 141 C92 134 100 126 110 118 Z"
                  fill="#08080a"
                />
              </g>

              {/* seat + stem + base */}
              <rect x="112" y="142" width="52" height="16" rx="7" fill="#101013" />
              <rect x="134" y="158" width="8" height="34" fill="#0e0e10" />
              <path
                d="M138 192 L108 214 M138 192 L168 214 M138 192 L122 216 M138 192 L154 216"
                stroke="#0e0e10"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* wheel dots */}
              {[
                [108, 217],
                [168, 217],
                [122, 219],
                [154, 219],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="#131315" />
              ))}
            </svg>
          </div>
        </div>

        {/* ── Ending stitch: red scan sweep as homepage takes over ───────── */}
        <div
          className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent/25 to-transparent"
          style={{
            top: phase === "handoff" ? "110%" : "-20%",
            transition: "top 650ms cubic-bezier(0.6, 0, 0.3, 1)",
            filter: "blur(6px)",
          }}
        />
      </div>

      {/* film grain vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />

      {/* skip affordance */}
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-6 right-6 rounded-lg border border-line-strong bg-black/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-fog-faint backdrop-blur transition hover:border-white hover:text-white"
      >
        skip intro ⏭
      </button>
    </div>
  );
}
