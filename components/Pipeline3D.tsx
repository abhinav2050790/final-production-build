"use client";

// ── 3D isometric pipeline visualization ───────────────────────────────────────
// CSS-3D extruded stage nodes on an isometric plane. Mouse tilts the plane;
// active stages pulse, done connectors solidify, packets flow on the active link.

import { useEffect, useRef } from "react";
import { StageId, StageStatus } from "@/lib/types";

export interface PipelineStageState {
  id: StageId;
  name: string;
  icon: string;
  status: StageStatus;
  meta?: string;
}

interface Props {
  stages: PipelineStageState[];
}

const NODE_W = 122;
const NODE_H = 92;
const STEP_X = 178;
const STEP_Y = 80;
const PLANE_W = 20 + 4 * STEP_X + NODE_W + 40;
const PLANE_H = 460;

const nodeX = (i: number) => 20 + i * STEP_X;
const nodeY = (i: number) => 330 - i * STEP_Y;

interface ConnectorGeom {
  left: number;
  top: number;
  width: number;
  angle: number;
}

const CONNECTORS: ConnectorGeom[] = [0, 1, 2, 3].map((i) => {
  const x1 = nodeX(i) + NODE_W - 8;
  const y1 = nodeY(i) + NODE_H / 2;
  const x2 = nodeX(i + 1) + 8;
  const y2 = nodeY(i + 1) + NODE_H / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  return {
    left: x1,
    top: y1 - 1.5,
    width: Math.sqrt(dx * dx + dy * dy),
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
});

const BASE_RX = 58;
const BASE_RZ = -38;

export default function Pipeline3D({ stages }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const target = useRef({ rx: BASE_RX, rz: BASE_RZ, tx: 0, ty: 0 });
  const current = useRef({ rx: BASE_RX, rz: BASE_RZ, tx: 0, ty: 0 });

  // Responsive scale
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const apply = () => {
      const w = wrap.clientWidth;
      const scale = Math.max(0.42, Math.min(1, w / (PLANE_W * 0.82)));
      wrap.style.height = `${Math.round(430 * Math.min(1, scale + 0.25))}px`;
      planeRef.current?.style.setProperty("--scene-scale", String(scale));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Hover-only tilt + parallax: responds while the cursor is over the scene,
  // eases back to the rest pose on leave. rAF-lerped, no re-renders.
  useEffect(() => {
    const scene = sceneRef.current;
    const plane = planeRef.current;
    if (!scene || !plane) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const loop = () => {
      const c = current.current;
      const t = target.current;
      c.rx += (t.rx - c.rx) * 0.09;
      c.rz += (t.rz - c.rz) * 0.09;
      c.tx += (t.tx - c.tx) * 0.09;
      c.ty += (t.ty - c.ty) * 0.09;
      plane.style.transform =
        `translate(${c.tx.toFixed(2)}px, ${c.ty.toFixed(2)}px) ` +
        `rotateX(${c.rx.toFixed(2)}deg) rotateZ(${c.rz.toFixed(2)}deg) scale(var(--scene-scale, 1))`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = clamp((e.clientX - cx) / (rect.width * 0.7));
      const ny = clamp((e.clientY - cy) / (rect.height * 0.7));
      target.current.rx = BASE_RX - ny * 16;
      target.current.rz = BASE_RZ + nx * 18;
      target.current.tx = nx * 30;
      target.current.ty = ny * 18;
    };
    const onLeave = () => {
      target.current.rx = BASE_RX;
      target.current.rz = BASE_RZ;
      target.current.tx = 0;
      target.current.ty = 0;
    };
    scene.addEventListener("mousemove", onMove);
    scene.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      scene.removeEventListener("mousemove", onMove);
      scene.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const activeIndex = stages.findIndex((s) => s.status === "active");

  return (
    <div
      ref={sceneRef}
      className="scene relative w-full select-none"
      style={{ minHeight: 300 }}
    >
      <div ref={wrapRef} className="relative w-full" style={{ height: 430 }}>
        {/* HUD dressing — screen space */}
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.3em] text-fog-faint blink-cursor">
          pipeline.sys
        </span>
        <div className="scanlines" />

        <div
          ref={planeRef}
          className="plane absolute left-1/2 top-4"
          style={{
            width: PLANE_W,
            height: PLANE_H,
            marginLeft: -PLANE_W / 2,
            transform: `rotateX(${BASE_RX}deg) rotateZ(${BASE_RZ}deg) scale(var(--scene-scale, 1))`,
          }}
        >
          {/* soft glow under the pipeline */}
          <div
            className="absolute"
            style={{
              left: PLANE_W / 2 - 380,
              top: 120,
              width: 760,
              height: 460,
              transform: "translateZ(-60px)",
              background:
                "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05), rgba(215, 25, 33, 0.04) 45%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />

          {/* living floor: dot matrix + radar sweep */}
          <div className="matrix-floor" />
          <div className="radar" />

          {stages.map((s, i) => (
            <div
              key={s.id}
              className={`node node-${s.status}`}
              style={{ left: nodeX(i), top: nodeY(i) }}
            >
              {/* glow pool beneath the node */}
              {s.status === "active" && (
                <div
                  className="halo halo-red"
                  style={{
                    left: -22,
                    top: -14,
                    width: NODE_W + 44,
                    height: NODE_H + 28,
                  }}
                />
              )}
              {s.status === "done" && (
                <div
                  className="halo halo-green"
                  style={{
                    left: -16,
                    top: -10,
                    width: NODE_W + 32,
                    height: NODE_H + 20,
                  }}
                />
              )}
              <div className="node-inner" style={{ animationDelay: `${i * 0.65}s` }}>
                <div className="node-shadow" style={{ transform: "translateZ(-30px) translate(-4px, 6px)" }} />
                <div
                  className="node-layer layer-born"
                  style={{
                    transform: "translateZ(-21px) translate(3px, 4px)",
                    background: "rgba(10, 10, 10, 0.9)",
                    border: "1px solid #1e1e1e",
                    animationDelay: `${i * 0.09 + 0.21}s`,
                  }}
                />
                <div
                  className="node-layer layer-born"
                  style={{
                    transform: "translateZ(-14px) translate(2px, 3px)",
                    background: "rgba(14, 14, 14, 0.94)",
                    border: "1px solid #242424",
                    animationDelay: `${i * 0.09 + 0.14}s`,
                  }}
                />
                <div
                  className="node-layer layer-born"
                  style={{
                    transform: "translateZ(-7px) translate(1px, 1.5px)",
                    background: "rgba(17, 17, 17, 0.96)",
                    border: "1px solid #2c2c2c",
                    animationDelay: `${i * 0.09 + 0.07}s`,
                  }}
                />
                <div className="node-layer node-top">
                  <span className="text-xl leading-none" aria-hidden>
                    {s.icon}
                  </span>
                  <span className="text-[12px] font-semibold tracking-wide text-fog">
                    {s.name}
                  </span>
                  <span className="min-h-[14px] max-w-[106px] truncate font-mono text-[9px] uppercase tracking-wider text-fog-dim">
                    {s.meta ?? (s.status === "active" ? "working…" : "")}
                  </span>
                  {s.status === "done" && (
                    <span
                      className="stamp absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15 font-mono text-[10px] text-emerald-300"
                    >
                      ✓
                    </span>
                  )}
                  {s.status === "active" && (
                    <span
                      className="pulse-ring absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-accent"
                      style={{ transform: "translateZ(8px)" }}
                    />
                  )}
                </div>
                <span
                  className="absolute -left-1.5 -top-2 rounded-md border-line-strong bg-[#111111] px-1.5 py-0.5 font-mono text-[9px] text-white"
                  style={{ transform: "translateZ(14px)" }}
                >
                  0{i + 1}
                </span>
              </div>
            </div>
          ))}

          {/* shockwaves radiating from the active stage — re-keyed per stage */}
          {activeIndex >= 0 && (
            <div key={`sw-${activeIndex}`}>
              {[0, 1, 2].map((k) => (
                <span
                  key={k}
                  className={`shockwave ${k === 1 ? "s2" : k === 2 ? "s3" : ""}`}
                  style={{
                    left: nodeX(activeIndex) + NODE_W / 2,
                    top: nodeY(activeIndex) + NODE_H / 2,
                  }}
                />
              ))}
            </div>
          )}

          {CONNECTORS.map((c, i) => {
            const connectedStage = stages[i + 1];
            const isActiveLink = activeIndex === i + 1;
            const isDone =
              connectedStage?.status === "done" ||
              (stages[i].status === "done" && connectedStage?.status !== "idle");
            const cls = isActiveLink
              ? "connector connector-active"
              : isDone
                ? "connector connector-done"
                : "connector connector-idle";
            return (
              <div
                key={`c-${i}`}
                className={cls}
                style={{
                  left: c.left,
                  top: c.top,
                  width: c.width,
                  transform: `rotate(${c.angle}deg)`,
                }}
              >
                {isActiveLink && (
                  <>
                    <span className="packet" />
                    <span className="packet packet-2" />
                    <span className="packet packet-3" />
                  </>
                )}
                {/* attract mode: faint traffic even when idle */}
                {!isActiveLink && (
                  <>
                    <span
                      className="packet packet-ghost"
                      style={{ animationDelay: `${i * 1.7}s` }}
                    />
                    <span
                      className="packet packet-ghost"
                      style={{ animationDelay: `${i * 1.7 + 2.1}s` }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
