import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Nothing-inspired monochrome system — LIGHT EDITION ─────────────
        ink: "#ffffff", // white canvas
        panel: "#f7f7f7", // elevated surface
        raised: "#efefef", // second elevation
        line: {
          DEFAULT: "#e4e4e4", // decorative hairline
          strong: "#999999", // intentional wireframe border
        },
        fog: {
          DEFAULT: "#111111", // primary text
          dim: "#555555", // labels, captions
          faint: "#9a9a9a", // disabled, decorative
        },
        accent: {
          DEFAULT: "#d71921", // Nothing red — signal only, never decoration
          subtle: "rgba(215, 25, 33, 0.10)",
        },
        success: "#22C55E", // emerald — positive status only
      },
      fontFamily: {
        sans: ["var(--font-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-spacemono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px 2px rgba(215, 25, 33, 0.35)",
        "glow-cyan": "0 0 24px 2px rgba(255, 255, 255, 0.18)",
      },
      borderRadius: {
        none: "0",
      },
    },
  },
  plugins: [],
};

export default config;
