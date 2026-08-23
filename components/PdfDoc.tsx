// ── Branded PDF spec-sheet document (react-pdf) ───────────────────────────────

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SpecDocument } from "@/lib/types";

const RED = "#d71921";
const INK = "#111111";
const GRAY = "#666666";
const LINE = "#dddddd";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  coverBand: {
    backgroundColor: "#000000",
    marginHorizontal: -48,
    marginTop: -48,
    paddingHorizontal: 48,
    paddingTop: 34,
    paddingBottom: 26,
  },
  brand: {
    fontFamily: "Courier-Bold",
    fontSize: 10,
    letterSpacing: 3,
    color: "#ffffff",
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: 700, color: "#ffffff", lineHeight: 1.15 },
  redBar: { width: 56, height: 4, backgroundColor: RED, marginTop: 14 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    fontFamily: "Courier",
    fontSize: 8,
    color: "#999999",
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 18,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    padding: 10,
  },
  statNum: { fontSize: 16, fontWeight: 700 },
  statLabel: {
    fontSize: 7,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 3,
    fontFamily: "Courier",
  },
  productCard: {
    borderWidth: 1,
    borderColor: "#e2e2e2",
    marginBottom: 16,
    breakInside: "avoid",
  },
  cardHead: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
    borderLeftWidth: 3,
    borderLeftColor: RED,
  },
  productName: { fontSize: 13, fontWeight: 700, marginBottom: 3 },
  productMeta: { fontSize: 8, color: GRAY, fontFamily: "Courier" },
  sectionPad: { paddingHorizontal: 14, paddingVertical: 10 },
  desc: { fontSize: 9, lineHeight: 1.45, color: "#333333" },
  attrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.7,
    borderBottomColor: "#eeeeee",
  },
  attrName: { fontSize: 8.5, color: GRAY, paddingRight: 20 },
  attrValue: { fontSize: 9.5, fontWeight: 600, textAlign: "right", maxWidth: 260 },
  listLine: { flexDirection: "row", gap: 6, marginBottom: 3 },
  bulletOk: { color: "#2e7d32", fontWeight: 700 },
  bulletUse: { color: RED, fontWeight: 700 },
  listItem: { fontSize: 8.8, color: "#333333", flex: 1 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.7,
    borderTopColor: LINE,
    paddingTop: 8,
    fontFamily: "Courier",
    fontSize: 7.5,
    color: "#888888",
  },
});

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function SpecPdfDocument({ spec }: { spec: SpecDocument }) {
  const q = spec.quality;
  return (
    <Document
      title={spec.title}
      author="Nexsus.Spec"
      subject="Extracted product specifications"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.coverBand} fixed>
          <Text style={styles.brand}>N E X S U S . S P E C</Text>
          <Text style={styles.title}>{spec.title}</Text>
          <View style={styles.redBar} />
          <View style={styles.metaRow}>
            <Text>extracted by {spec.mode === "ai" ? spec.model ?? "live ai" : "fast parser"}</Text>
            <Text>{fmtDate(spec.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{spec.products.length}</Text>
            <Text style={styles.statLabel}>products</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{q.attributeCount}</Text>
            <Text style={styles.statLabel}>attribute values</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {spec.products.length ? Math.round(q.attributeCount / spec.products.length) : 0}
            </Text>
            <Text style={styles.statLabel}>avg per product</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{q.score}/100</Text>
            <Text style={styles.statLabel}>data quality</Text>
          </View>
        </View>

        {spec.products.map((p) => (
          <View key={p.id} style={styles.productCard} wrap={false}>
            <View style={styles.cardHead}>
              <Text style={styles.productName}>{p.name}</Text>
              {(p.brand || p.partNumber || p.category) && (
                <Text style={styles.productMeta}>
                  {[p.brand, p.category, p.partNumber ? `Part# ${p.partNumber}` : null]
                    .filter(Boolean)
                    .join("   ·   ")}
                </Text>
              )}
            </View>
            <View style={styles.sectionPad}>
              {p.description && <Text style={styles.desc}>{p.description}</Text>}

              {p.attributes.length > 0 && (
                <View style={{ marginTop: p.description ? 8 : 0 }}>
                  {p.attributes.map((a, i) => (
                    <View
                      key={`${a.name}-${i}`}
                      style={[
                        styles.attrRow,
                        ...(i === p.attributes.length - 1
                          ? [{ borderBottomWidth: 0 }]
                          : []),
                      ]}
                    >
                      <Text style={styles.attrName}>{a.name}</Text>
                      <Text style={styles.attrValue}>{a.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {!!p.keyFeatures?.length && (
                <View style={{ marginTop: 8 }}>
                  {p.keyFeatures.map((f, i) => (
                    <View key={`f-${i}`} style={styles.listLine}>
                      <Text style={styles.bulletOk}>✓</Text>
                      <Text style={styles.listItem}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}

              {!!p.useCases?.length && (
                <View style={{ marginTop: 6 }}>
                  {p.useCases.map((u, i) => (
                    <View key={`u-${i}`} style={styles.listLine}>
                      <Text style={styles.bulletUse}>▸</Text>
                      <Text style={styles.listItem}>{u}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>nexsus.spec — organized product data</Text>
          <Text
            render={({ pageNumber, totalPages }) => `page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
