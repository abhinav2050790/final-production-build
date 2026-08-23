// ── OG preview card for shared extractions ────────────────────────────────────
import { ImageResponse } from "next/og";
import { getPublicSpec } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spec = await getPublicSpec(slug).catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000",
          backgroundImage:
            "radial-gradient(circle, #2b2b2b 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          padding: 64,
          color: "#e8e8e8",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            letterSpacing: "0.3em",
            color: "#999",
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 14, height: 14, background: "#d71921", borderRadius: 999 }} />
          NEXSUS.SPEC
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: spec ? 58 : 44, fontWeight: 700, color: "#fff" }}>
            {spec ? spec.title : "Shared extraction"}
          </div>
          <div style={{ fontSize: 26, color: "#999" }}>
            {spec
              ? `${spec.products.length} products · ${spec.quality?.attributeCount ?? 0} attribute values`
              : "This link is unavailable"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "#666",
          }}
        >
          <span>spec sheets in · organized product data out</span>
          <span style={{ color: "#d71921" }}>view →</span>
        </div>
      </div>
    ),
    size
  );
}
