// ── Pipeline orchestrator — product data edition ──────────────────────────────
// Ingest → AI Extract → Organize → Check → Export. One AI call per run.

import { Finding, PipelineEvent, ProductRecord, SpecDocument, StageId } from "@/lib/types";
import { runIngest } from "./ingest";
import { extractProducts } from "./extractProducts";
import { renderExports } from "./export";
import { aiModel } from "@/lib/ai";
import { sleep } from "./pacing";

export interface PipelineInput {
  text: string;
  title?: string;
  /** Skip live AI entirely — forced demo mode (Shift+D) or warmup runs. */
  forceDemo?: boolean;
  /** Ignore the saved extraction for this document and re-run the live AI. */
  refresh?: boolean;
}

export const WARMUP_SEED =
  "Spec sheet: PowerLine UPS 850VA. Input voltage 230V AC. Output voltage 230V AC. " +
  "Frequency 50Hz. Battery 12V 7Ah sealed lead acid. Backup time 20 minutes. " +
  "Weight 6.2 kg. Warranty 2 years.";

// ── Organize (deterministic): canonical attribute names + grouping ────────────

function canonicalName(name: string): string {
  // split glued CamelCase ("InputVoltage" → "Input Voltage") before mapping
  const spaced = name
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ");
  const lower = spaced.toLowerCase();
  if (/^input volt/.test(lower)) return "Input voltage";
  if (/^output volt/.test(lower)) return "Output voltage";
  if (/^volt/.test(lower)) return "Voltage";
  if (/^current\b|^amp/.test(lower)) return "Current";
  if (/^freq/.test(lower)) return "Frequency";
  if (/^power (consumption|draw|rating)/.test(lower)) return "Power consumption";
  if (/^capacity\b/.test(lower)) return "Capacity";
  if (/^backup/.test(lower)) return "Backup time";
  if (/^battery/.test(lower)) return "Battery";
  if (/^part (no|number|num|#)/.test(lower)) return "Part number";
  if (/^model (no|number|#)/.test(lower)) return "Model number";
  if (/^dim/.test(lower)) return "Dimensions";
  if (/^wt\b|weigh/.test(lower)) return "Weight";
  if (/^watt|^power\b/.test(lower)) return "Power";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function organizeProducts(products: ProductRecord[]): ProductRecord[] {
  // drop phantom products (no attributes, no description, no features)
  const real = products.filter(
    (p) => p.attributes.length > 0 || (p.description?.length ?? 0) > 0 || (p.keyFeatures?.length ?? 0) > 0
  );
  return real.map((p) => {
    const seen = new Set<string>();
    const attributes = p.attributes
      .map((a) => ({ ...a, name: canonicalName(a.name) }))
      .filter((a) => {
        const key = a.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return { ...p, attributes };
  });
}

// ── Data quality (deterministic) ─────────────────────────────────────────────

function dataQuality(products: ProductRecord[]): SpecDocument["quality"] {
  const findings: Finding[] = [];
  let attributeCount = 0;
  const withPartNumbers = products.filter((p) => p.partNumber).length;

  products.forEach((p) => {
    attributeCount += p.attributes.length;
    if (p.attributes.length === 0) {
      findings.push({
        severity: "warning",
        code: "NO_SPECS",
        message: `“${p.name}” has no attribute values — the document may not state specs for it.`,
      });
    } else if (p.attributes.length < 3) {
      findings.push({
        severity: "info",
        code: "FEW_SPECS",
        message: `“${p.name}” has only ${p.attributes.length} attributes.`,
      });
    }
  });

  const names = new Map<string, number>();
  for (const p of products) {
    const key = p.name.toLowerCase().slice(0, 50);
    names.set(key, (names.get(key) ?? 0) + 1);
  }
  let duplicates = 0;
  for (const [name, n] of names) {
    if (n > 1) {
      duplicates += 1;
      findings.push({
        severity: "warning",
        code: "DUPLICATE",
        message: `“${name}” appears ${n} times — possible duplicate products.`,
      });
    }
  }

  if (products.length && withPartNumbers === 0) {
    findings.push({
      severity: "info",
      code: "NO_PART_NUMBERS",
      message: "No part numbers were found for any product.",
    });
  }

  const avgAttrs = products.length ? attributeCount / products.length : 0;
  const score = products.length
    ? Math.max(
        5,
        Math.round(
          Math.min(100, avgAttrs * 15) * 0.8 +
            (withPartNumbers / products.length) * 100 * 0.1 +
            (duplicates === 0 ? 10 : 0)
        )
      )
    : 0;

  return { score, findings, attributeCount, withPartNumbers };
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export async function* runPipeline(
  input: PipelineInput
): AsyncGenerator<PipelineEvent> {
  const durations: Record<string, number> = {};
  const allowAi = input.forceDemo !== true;

  const emitStart = function* (stage: StageId): Generator<PipelineEvent> {
    yield { type: "stage_start", stage, at: Date.now() };
  };

  // ── Stage 1: Ingest ──────────────────────────────────────────────────────
  yield* emitStart("ingest");
  let stageT = Date.now();
  yield { type: "log", stage: "ingest", message: "Normalizing whitespace & line endings…" };
  await sleep(120);
  const ingest = runIngest(input.text, input.title);
  yield {
    type: "log",
    stage: "ingest",
    message: `Document profile: ${ingest.detectedType} · ${ingest.words} words`,
  };
  durations.ingest = Date.now() - stageT;
  yield {
    type: "stage_end",
    stage: "ingest",
    durationMs: durations.ingest,
    summary: `${ingest.words} words · ${ingest.detectedType}`,
  };

  // ── Stage 2: Extract (the single AI call) ────────────────────────────────
  yield* emitStart("extract");
  stageT = Date.now();
  if (allowAi) {
    yield { type: "log", stage: "extract", message: `The AI (${aiModel()}) is reading the document…` };
  } else {
    yield { type: "log", stage: "extract", message: "Offline mode — using the built-in fast parser…" };
  }
  const extraction = await extractProducts(ingest, allowAi, input.refresh === true);
  if (extraction.cached) {
    yield {
      type: "log",
      stage: "extract",
      message: `Same document as before — returning the identical saved result (${extraction.model ?? "ai"} extraction)`,
      level: "success",
    };
  }
  if (extraction.mode === "ai" && !extraction.cached) {
    yield {
      type: "log",
      stage: "extract",
      message: `Found ${extraction.products.length} products with ${extraction.products.reduce((a, p) => a + p.attributes.length, 0)} attribute values`,
      level: "success",
    };
  } else if (extraction.mode !== "ai" && extraction.note) {
    yield { type: "log", stage: "extract", message: extraction.note, level: "warn" };
  }
  durations.extract = Date.now() - stageT;
  const attrTotal = extraction.products.reduce((a, p) => a + p.attributes.length, 0);
  yield {
    type: "stage_end",
    stage: "extract",
    durationMs: durations.extract,
    summary: extraction.products.length
      ? `${extraction.products.length} products · ${attrTotal} attribute values`
      : "no products found",
  };

  // ── Stage 3: Organize (deterministic) ────────────────────────────────────
  yield* emitStart("enrich");
  stageT = Date.now();
  yield { type: "log", stage: "enrich", message: "Normalizing attribute names (voltage, frequency, range…)" };
  await sleep(120);
  const products = organizeProducts(extraction.products);
  yield {
    type: "log",
    stage: "enrich",
    message: `Built ${products.length} product pages · features & use cases attached`,
    level: "success",
  };
  durations.enrich = Date.now() - stageT;
  yield {
    type: "stage_end",
    stage: "enrich",
    durationMs: durations.enrich,
    summary: `${products.length} product pages organized`,
  };

  // ── Stage 4: Check ───────────────────────────────────────────────────────
  yield* emitStart("validate");
  stageT = Date.now();
  yield { type: "log", stage: "validate", message: "Checking data quality: gaps, duplicates, coverage…" };
  await sleep(120);
  const quality = dataQuality(products);
  const warns = quality.findings.filter((f) => f.severity === "warning").length;
  yield {
    type: "log",
    stage: "validate",
    message: `Quality score ${quality.score}/100 · ${quality.findings.length} notes (${warns} warnings)`,
    level: warns ? "warn" : "success",
  };
  durations.validate = Date.now() - stageT;
  yield {
    type: "stage_end",
    stage: "validate",
    durationMs: durations.validate,
    summary: `score ${quality.score}/100 · ${quality.findings.length} notes`,
  };

  // ── Stage 5: Export ──────────────────────────────────────────────────────
  yield* emitStart("export");
  stageT = Date.now();
  yield { type: "log", stage: "export", message: "Rendering Markdown spec sheet…" };
  await sleep(110);
  yield { type: "log", stage: "export", message: "Rendering JSON machine format…" };
  await sleep(90);
  yield { type: "log", stage: "export", message: "Rendering CSV backlog…" };
  await sleep(90);
  const doc: Omit<SpecDocument, "exports"> = {
    title: ingest.title,
    createdAt: new Date().toISOString(),
    mode: extraction.mode,
    modeNote: extraction.mode === "ai" ? undefined : extraction.note,
    model: extraction.mode === "ai" ? (extraction.model ?? aiModel()) : undefined,
    cached: extraction.cached === true,
    input: ingest,
    products,
    quality,
    stageDurations: durations as Record<StageId, number>,
  };
  const exports = renderExports(doc);
  const kb = (s: string) => `${(new Blob([s]).size / 1024).toFixed(1)} KB`;
  yield {
    type: "log",
    stage: "export",
    message: `Artifacts ready — markdown ${kb(exports.markdown)} · JSON ${kb(exports.json)} · CSV ${kb(exports.csv)}`,
    level: "success",
  };
  durations.export = Date.now() - stageT;
  yield {
    type: "stage_end",
    stage: "export",
    durationMs: durations.export,
    summary: `markdown ${kb(exports.markdown)} · json ${kb(exports.json)} · csv ${kb(exports.csv)}`,
  };

  yield {
    type: "complete",
    spec: { ...doc, stageDurations: durations as Record<StageId, number>, exports },
  };
}
