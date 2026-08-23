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
        // ── Nothing-inspired monochrome system ────────────────────────────
        ink: "#000000", // OLED black canvas
        panel: "#111111", // elevated surface
        raised: "#1a1a1a", // second elevation
        line: {
          DEFAULT: "#222222", // decorative hairline
          strong: "#333333", // intentional wireframe border
        },
        fog: {
          DEFAULT: "#e8e8e8", // primary text
          dim: "#999999", // labels, captions
          faint: "#666666", // disabled, decorative
        },
        accent: {
          DEFAULT: "#d71921", // Nothing red — signal only, never decoration
          subtle: "rgba(215, 25, 33, 0.15)",
        },
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
