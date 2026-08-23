"use client";

// ── Cinematic room intro — operator rolls in, sits, camera dollies forward ────
// through the already-live screen into the real homepage. Plays once per
// session. Click anywhere to skip. Reduced-motion users skip automatically.
//
// Camera note: the dolly is an animated SVG `viewBox`, NOT a CSS scale().
// A transform scale stretches the layer's one-time rasterization (blur grows
// with zoom); a viewBox change re-renders every vector at full resolution per
// frame, so image sharpness stays constant through the whole push.

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

// ── Camera path (user units, 16:9 stage) ──────────────────────────────────────
const VB_W = 1600;
const VB_H = 900;
const CAM_FROM = { x: 800, y: 450 }; // wide shot center
const CAM_TO = { x: 800, y: 538 }; // ends locked on the screen center
const END_W = 240; // final window smaller than the 340u-wide screen → through the glass
const PUSH_MS = 2600;

// matches the previous cubic-bezier(0.55, 0.08, 0.18, 1)
function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-5) break;
      t -= e / dx(t);
    }
    return sy(Math.min(Math.max(t, 0), 1));
  };
}
const pushEase = cubicBezier(0.55, 0.08, 0.18, 1);

export default function RoomIntro({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<Phase>("dark");
  const [mounted, setMounted] = useState(false);
  const timers = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const screenFlashRef = useRef<SVGRectElement>(null);

  // latest-ref: keeps `finish` identity stable so Home re-renders can never
  // tear down and restart the timeline effect mid-play
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
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

  // the dolly — viewBox interpolation, re-rendered sharp on every frame
  useEffect(() => {
    if (phase !== "push") return;
    const svg = svgRef.current;
    if (!svg) return;
    const start = performance.now();
    const fromX = VB_W / 2;
    const fromY = VB_H / 2;
    const tick = (now: number) => {
      const t = Math.min((now - start) / PUSH_MS, 1);
      const e = pushEase(t);
      const w = VB_W + (END_W - VB_W) * e;
      const h = VB_H + (END_W * (VB_H / VB_W) - VB_H) * e;
      const fx = fromX + (CAM_TO.x - fromX) * e;
      const fy = fromY + (CAM_TO.y - fromY) * e;
      svg.setAttribute("viewBox", `${fx - w / 2} ${fy - h / 2} ${w} ${h}`);
      if (screenFlashRef.current)
        screenFlashRef.current.style.opacity = String(0.06 * e);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [phase]);

  const skip = useCallback(() => {
    clearTimers();
    // ride the existing handoff dissolve (700ms) instead of cutting hard
    setPhase("handoff");
    timers.current.push(window.setTimeout(finish, 720));
  }, [clearTimers, finish]);

  const ORDER: Phase[] = ["dark", "enter", "slide", "sit", "push", "handoff", "gone"];
  const reached = (p: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(p);

  if (!mounted || phase === "gone") return null;

  const slid = phase === "slide" || reached("slide");
  const sat = phase === "sit" || reached("sit");

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

        {/* vector stage — camera moves the viewBox, resolution never changes */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <radialGradient id="ii-lamp" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,150,70,0.10)" />
              <stop offset="45%" stopColor="rgba(255,110,40,0.04)" />
              <stop offset="70%" stopColor="rgba(255,110,40,0)" />
            </radialGradient>
            <radialGradient id="ii-strip" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(215,25,33,0.5)" />
              <stop offset="45%" stopColor="rgba(215,25,33,0.18)" />
              <stop offset="72%" stopColor="rgba(215,25,33,0)" />
            </radialGradient>
            <radialGradient id="ii-monitorAmb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(215,25,33,0.26)" />
              <stop offset="70%" stopColor="rgba(215,25,33,0)" />
            </radialGradient>
            <linearGradient id="ii-screen" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%" stopColor="#0d0d0d" />
              <stop offset="100%" stopColor="#101010" />
            </linearGradient>
            <linearGradient id="ii-reflect" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id="ii-deskWarm" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,140,60,0.08)" />
              <stop offset="100%" stopColor="rgba(255,140,60,0)" />
            </linearGradient>
            <radialGradient id="ii-kbGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,120,50,0.12)" />
              <stop offset="100%" stopColor="rgba(255,120,50,0)" />
            </radialGradient>
            <linearGradient id="ii-ceiling" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <pattern id="ii-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="#262626" />
            </pattern>
            <clipPath id="ii-screenClip">
              <rect x="631" y="426" width="338" height="225" rx="4" />
            </clipPath>
          </defs>

          {/* warm dull key light — lamp off-frame left */}
          <ellipse cx="180" cy="400" rx="720" ry="520" fill="url(#ii-lamp)" />

          {/* faint ceiling spill */}
          <rect x="0" y="0" width={VB_W} height="96" fill="url(#ii-ceiling)" />

          {/* red RGB strip glow behind the monitor */}
          <ellipse
            cx="800"
            cy="365"
            rx="780"
            ry="98"
            fill="url(#ii-strip)"
            className={`transition-opacity duration-[3000ms] ${
              sat ? "opacity-100" : "opacity-55"
            }`}
            style={{ animation: "rgbBreathe 3.2s ease-in-out infinite" }}
          />
          {/* the physical strip */}
          <rect x="224" y="437" width="1152" height="8" rx="4" fill="#ff2222" opacity="0.28" />
          <rect x="224" y="439" width="1152" height="4" rx="2" fill="#ff2222" />

          {/* soft red ambience cast by the monitor */}
          <ellipse cx="800" cy="545" rx="430" ry="190" fill="url(#ii-monitorAmb)" />

          {/* desk front edge + surface */}
          <rect x="112" y="702" width="1376" height="90" fill="#0b0a09" />
          <rect x="64" y="690" width="1472" height="12" rx="3" fill="#141210" />
          <rect x="64" y="668" width="1472" height="24" fill="url(#ii-deskWarm)" />

          {/* keyboard glow, centered on the desk */}
          <ellipse cx="800" cy="692" rx="330" ry="26" fill="url(#ii-kbGlow)" />
          <rect x="538" y="682" width="524" height="8" rx="4" fill="#1a1512" />

          {/* ── Monitor — dead center, already awake, homepage live on glass ── */}
          {/* stand */}
          <rect x="796" y="656" width="9" height="38" fill="#101010" />
          <rect x="744" y="692" width="113" height="7" rx="3.5" fill="#161616" />
          {/* bezel */}
          <rect
            x="624"
            y="419"
            width="352"
            height="239"
            rx="7"
            fill="#000000"
            stroke="#1c1c1c"
            strokeWidth="1.5"
          />
          {/* screen */}
          <rect x="631" y="426" width="338" height="225" rx="4" fill="url(#ii-screen)" />
          <g clipPath="url(#ii-screenClip)">
            <rect x="631" y="426" width="338" height="225" fill="url(#ii-dots)" opacity="0.3" />
            {/* glass reflection */}
            <rect
              x="600"
              y="395"
              width="120"
              height="290"
              transform="rotate(20 660 540)"
              fill="url(#ii-reflect)"
            />
            {/* brightness lift as we approach the glass */}
            <rect ref={screenFlashRef} x="631" y="426" width="338" height="225" fill="#ffffff" opacity="0" />
          </g>
          {/* screen content — live site boot screen */}
          <g textAnchor="middle" className="font-mono" fill="#999999">
            <text x="800" y="512" fontSize="9" letterSpacing="6.3">
              SESSION START
            </text>
            <text
              x="800"
              y="543"
              fontSize="17"
              fontWeight="700"
              letterSpacing="7.5"
              fill="#ffffff"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.5"
              paintOrder="stroke"
            >
              NEXSUS.SPEC
            </text>
            <rect x="762" y="556" width="76" height="1.4" fill={RED} />
            <text x="800" y="577" fontSize="7.5" letterSpacing="5.4" fill="#666666">
              EXTRACTING PRODUCT DATA…
            </text>
          </g>

          {/* ── Gaming chair + operator, rolls in from the right ─────────────── */}
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "50% 60%",
              transform: slid
                ? "translateX(0px) rotate(0deg)"
                : "translateX(222px) rotate(-6deg)",
              transition: "transform 1700ms cubic-bezier(0.22, 1.1, 0.36, 1)",
              transitionDelay: phase === "slide" ? "180ms" : "0ms",
            }}
          >
            <g transform="translate(1169 451) scale(1.171)">
              <g
                style={{
                  transform: sat ? "translateY(0px)" : "translateY(-30px)",
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

              {/* chair back */}
              <rect x="118" y="18" width="44" height="128" rx="18" fill="#0d0d0f" />
              <rect x="124" y="26" width="32" height="112" rx="13" fill="#131316" />
              <rect x="121" y="22" width="2.5" height="118" rx="1" fill={RED} opacity="0.55" />
              <rect x="126" y="6" width="30" height="20" rx="9" fill="#111114" />

              {/* seat + stem + base */}
              <rect x="112" y="142" width="52" height="16" rx="7" fill="#101013" />
              <rect x="134" y="158" width="8" height="34" fill="#0e0e10" />
              <path
                d="M138 192 L108 214 M138 192 L168 214 M138 192 L122 216 M138 192 L154 216"
                stroke="#0e0e10"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {[
                [108, 217],
                [168, 217],
                [122, 219],
                [154, 219],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="#131315" />
              ))}
            </g>
          </g>
        </svg>

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
