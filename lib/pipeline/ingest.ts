// ── Stage 1: Ingest — deterministic normalization & profiling ────────────────

import { IngestResult, Segment } from "@/lib/types";
import {
  normalizeText,
  segmentText,
  tokenize,
  round1,
} from "@/lib/text";
import { parseCatalog } from "./products";

export const MAX_INPUT_CHARS = 16000;

export function runIngest(rawText: string, rawTitle?: string): IngestResult {
  const warnings: string[] = [];
  const truncated = rawText.length > MAX_INPUT_CHARS;
  if (truncated) {
    warnings.push(
      `Input exceeded ${MAX_INPUT_CHARS} chars and was truncated to the first ${MAX_INPUT_CHARS}.`
    );
  }
  const text = normalizeText(truncated ? rawText.slice(0, MAX_INPUT_CHARS) : rawText);

  const segmented = segmentText(text);
  const segments: Segment[] = segmented.map((s, i) => ({
    index: i,
    text: s.text,
    speaker: s.speaker,
  }));

  const words = tokenize(text).length;
  const sentences = segments.length;

  if (words < 40) {
    warnings.push("Very short input — the forged spec will be thin. Add more context.");
  }

  // Speaker detection (transcripts)
  const speakerSet = new Set<string>();
  for (const s of segmented) if (s.speaker) speakerSet.add(s.speaker);
  const speakers = [...speakerSet];

  // Document-type detection via keyword / structure signals
  const lower = text.toLowerCase();
  const modalHits = (lower.match(/\b(must|should|needs? to|have to|required)\b/g) || []).length;
  const bulletLines = (text.match(/^\s*[-*•–]/gm) || []).length;
  const totalLines = Math.max(1, text.split("\n").filter((l) => l.trim()).length);
  const speakerLines = speakers.length
    ? segmented.filter((s) => s.speaker).length
    : 0;

  let detectedType = "freeform notes";
  let typeConfidence = 0.45;
  if (speakers.length >= 2 && speakerLines / Math.max(1, sentences) > 0.35) {
    detectedType = "meeting transcript";
    typeConfidence = Math.min(0.95, 0.6 + speakerLines / sentences * 0.35);
  } else if (bulletLines / totalLines > 0.4) {
    detectedType = "user feedback dump";
    typeConfidence = Math.min(0.92, 0.55 + (bulletLines / totalLines) * 0.4);
  } else if (modalHits >= 4) {
    detectedType = "requirements document";
    typeConfidence = Math.min(0.9, 0.5 + modalHits * 0.05);
  }

  // Product catalog detection — structured rows organize as products, not stories
  const catalog = parseCatalog(text);
  if (catalog) {
    detectedType = "product catalog";
    typeConfidence = 0.95;
  }

  // Crude language check
  let language = "en";
  if (/[\u4e00-\u9fff]/.test(text)) language = "zh";
  else if (/[\u3040-\u30ff]/.test(text)) language = "ja";
  else if (/[\uac00-\ud7af]/.test(text)) language = "ko";

  // Title: user-provided → first meaningful line → derived
  let title = (rawTitle || "").trim();
  if (!title) {
    const first = segments.find(
      (s) => s.text.length > 8 && !/^\W+$/.test(s.text)
    );
    const base = first ? first.text : "Untitled spec";
    title = base.split(/\s+/).slice(0, 7).join(" ").replace(/[,:.–—-]+$/, "");
    if (detectedType === "meeting transcript") title = `${title}…`;
  }

  return {
    title,
    rawText: text,
    normalizedChars: text.length,
    words,
    sentences,
    readingTimeMin: round1(Math.max(0.2, words / 200)),
    detectedType,
    typeConfidence: round1(typeConfidence * 100) / 100,
    language,
    speakers,
    segments,
    warnings,
    truncated,
    isCatalog: catalog !== null,
    products: catalog?.products ?? [],
    productBrands: catalog?.brands ?? [],
    productManufacturers: catalog?.manufacturers ?? [],
  };
}
