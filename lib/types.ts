// ── Shared types for the SpecForge pipeline ──────────────────────────────────

export type StageId = "ingest" | "extract" | "enrich" | "validate" | "export";

export type StageStatus = "idle" | "active" | "done";

export interface StageDef {
  id: StageId;
  name: string;
  icon: string;
  tagline: string;
}

export const STAGES: StageDef[] = [
  { id: "ingest", name: "Ingest", icon: "📥", tagline: "Normalize, segment & profile the raw input" },
  { id: "extract", name: "Extract", icon: "🔎", tagline: "The AI reads the document & mines products" },
  { id: "enrich", name: "Organize", icon: "🗂️", tagline: "Normalize attributes & build product pages" },
  { id: "validate", name: "Check", icon: "🛡️", tagline: "Data quality: gaps, duplicates, coverage" },
  { id: "export", name: "Export", icon: "📦", tagline: "Render Markdown, JSON & CSV artifacts" },
];

// ── Ingest ────────────────────────────────────────────────────────────────────

export interface Segment {
  index: number;
  text: string;
  speaker?: string;
}

// ── Product catalog (structured input mode) ───────────────────────────────────

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  partNumber?: string;
  brand?: string;
  category?: string;
  description?: string;
  attributes: ProductAttribute[];
  keyFeatures?: string[];
  useCases?: string[];
}

export interface IngestResult {
  title: string;
  rawText: string;
  normalizedChars: number;
  words: number;
  sentences: number;
  readingTimeMin: number;
  detectedType: string;
  typeConfidence: number;
  language: string;
  speakers: string[];
  segments: Segment[];
  warnings: string[];
  truncated: boolean;
  isCatalog: boolean;
  products: ProductRecord[];
  productBrands: string[];
  productManufacturers: string[];
}

// ── Data quality findings ─────────────────────────────────────────────────────

export interface Finding {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  storyIds?: string[];
}

// ── Export / final document ───────────────────────────────────────────────────

export interface ExportArtifacts {
  markdown: string;
  json: string;
  csv: string;
}

export interface SpecDocument {
  title: string;
  createdAt: string;
  mode: "ai" | "demo";
  modeNote?: string;
  model?: string;
  /** True when served from the frozen extraction cache (identical repeat run). */
  cached?: boolean;
  input: IngestResult;
  products: ProductRecord[];
  quality: {
    score: number; // 0..100
    findings: Finding[];
    attributeCount: number;
    withPartNumbers: number;
  };
  exports: ExportArtifacts;
  stageDurations: Record<StageId, number>;
}

// ── Audit trail (reasoning chain of a run) ────────────────────────────────────

export interface AuditEntry {
  at: number;
  stage: StageId | "complete";
  kind: "stage_start" | "log" | "stage_end";
  level?: "info" | "warn" | "success";
  message?: string;
  summary?: string;
  durationMs?: number;
}

export interface AuditRun {
  startedAt: number;
  title: string;
  mode: "ai" | "demo";
  entries: AuditEntry[];
  totals?: { products: number; score: number; durationMs: number };
}

// ── Streaming events (server → client, NDJSON) ────────────────────────────────

export type PipelineEvent =
  | { type: "stage_start"; stage: StageId; at: number }
  | {
      type: "stage_end";
      stage: StageId;
      durationMs: number;
      summary: string;
      data?: unknown;
    }
  | {
      type: "log";
      stage: StageId;
      message: string;
      level?: "info" | "warn" | "success";
    }
  | { type: "complete"; spec: SpecDocument }
  | { type: "error"; message: string };
