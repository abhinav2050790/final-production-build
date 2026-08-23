// ── AI product extraction — one call, fully structured products ───────────────
// The model reads the whole document and returns products with attribute:value
// specifications (Voltage — 230V, Range — 0-100 bar, …), key features and use
// cases. Falls back to the deterministic row parser on failure.

import { IngestResult, ProductAttribute, ProductRecord } from "@/lib/types";
import { aiComplete, aiModel, extractJson } from "@/lib/ai";
import { parseCatalog, parseSpecLines } from "./products";
import { extractionKey, loadExtraction, saveExtraction } from "./extractionCache";

interface AiAttribute {
  name?: string;
  value?: string;
}

interface AiProduct {
  name?: string;
  partNumber?: string | null;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  attributes?: AiAttribute[];
  keyFeatures?: string[] | null;
  useCases?: string[] | null;
}

export interface ProductExtraction {
  products: ProductRecord[];
  mode: "ai" | "demo";
  note?: string;
  /** True when served from the frozen cache — identical to the previous run. */
  cached?: boolean;
  /** The model that actually produced this extraction (fallback chain aware). */
  model?: string;
}

/** Bump to invalidate every cached extraction after a prompt change. */
export const EXTRACTION_PROMPT_VERSION = "v3-groq-gpt-oss-120b";

interface CacheEntry {
  v: string;
  products: ProductRecord[];
  model: string;
  savedAt: string;
}

const clean = (s: unknown, max = 240): string | undefined => {
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  if (!t || /^(null|n\/?a|-|none)$/i.test(t)) return undefined;
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

function normalizeProducts(raw: AiProduct[]): ProductRecord[] {
  const out: ProductRecord[] = [];
  const seen = new Set<string>();
  for (const p of raw) {
    const name = clean(p.name, 160);
    if (!name) continue;
    const attributes: ProductAttribute[] = (p.attributes ?? [])
      .map((a) => ({ name: clean(a.name, 60), value: clean(a.value, 120) }))
      .filter((a): a is ProductAttribute => Boolean(a.name && a.value));
    const dedupeKey = `${p.partNumber ?? ""}|${name.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push({
      id: `P-${String(out.length + 1).padStart(3, "0")}`,
      name,
      partNumber: clean(p.partNumber ?? undefined, 40),
      brand: clean(p.brand ?? undefined, 60),
      category: clean(p.category ?? undefined, 60),
      description: clean(p.description ?? undefined, 300),
      attributes,
      keyFeatures: (p.keyFeatures ?? []).map((f) => clean(f, 160)).filter((f): f is string => Boolean(f)).slice(0, 8),
      useCases: (p.useCases ?? []).map((u) => clean(u, 160)).filter((u): u is string => Boolean(u)).slice(0, 8),
    });
  }
  return out.slice(0, 25);
}

export async function extractProducts(
  ingest: IngestResult,
  allowAi = true,
  refresh = false
): Promise<ProductExtraction> {
  const fallback = () => {
    const parsed = parseCatalog(ingest.rawText);
    if (parsed && parsed.products.length > 0) {
      return {
        products: parsed.products,
        mode: "demo" as const,
        note: "AI unavailable — organized raw rows with the built-in fast parser.",
      };
    }
    const specLines = parseSpecLines(ingest.rawText);
    if (specLines.length > 0) {
      return {
        products: specLines,
        mode: "demo" as const,
        note: `AI unavailable — extracted ${specLines.length} product block(s) from “Label: Value” lines with the built-in parser.`,
      };
    }
    return {
      products: [],
      mode: "demo" as const,
      note: "AI unavailable and no recognizable product rows or “Label: Value” spec lines were found in the input.",
    };
  };

  if (!allowAi) return fallback();

  // Frozen-result cache: the same document returns the exact same extraction,
  // instantly — no model roulette, no pool congestion, no waiting.
  if (!refresh) {
    const key = extractionKey(EXTRACTION_PROMPT_VERSION, ingest.rawText);
    const cached = await loadExtraction<CacheEntry>(key);
    if (cached?.v === EXTRACTION_PROMPT_VERSION && cached.products?.length) {
      return { products: cached.products, mode: "ai", cached: true, model: cached.model };
    }
  }

  // Groq free tier: 8,000 TPM counted as prompt + max_tokens per request.
  // Doc ~9k chars ≈ ≤3,100 tokens + ~350 prompt overhead + 4,500 output
  // ≈ 7,950 worst case — fits under the cap.
  const doc = ingest.segments
    .map((s) => `[${s.index}] ${s.text}`)
    .join("\n")
    .slice(0, 9000);

  const { content, model, error } = await aiComplete(
    [
      {
        role: "system",
        content:
          "You are SpecForge's product data engine. You read messy documents " +
          "(spec sheets, catalogs, datasheets, listings) and return structured " +
          "product data. Respond with a SINGLE valid JSON object only — no prose, " +
          "no markdown fences. Be precise and complete with attribute values.",
      },
      {
        role: "user",
        content:
          `Document (detected as: ${ingest.detectedType}):\n\n${doc}\n\n` +
          'Extract every distinct product. Return {"products":[{"name":"product name",' +
          '"partNumber":"or null","brand":"or null","category":"or null",' +
          '"description":"one sentence","attributes":[{"name":"Voltage","value":"230V"}],' +
          '"keyFeatures":["short benefit"],"useCases":["who uses it for what"]}]}. ' +
          "Rules: capture EVERY specification with its exact value as an attribute " +
          "(voltage, current, frequency, range, output, dimensions, weight, material, " +
          "connectivity, capacity, speed, protection class — whatever the document states); " +
          "use Title Case attribute names from the document; omit attributes that are not " +
          "stated; 2-5 key features; 2-4 use cases; max 20 products.",
      },
    ],
    // Groq answers in ~1-5s; a 45s per-attempt cap leaves room for a second
    // attempt inside aiComplete's 75s budget if one request hangs.
    { temperature: 0, maxTokens: 4500, reasoningEffort: "low", timeoutMs: 45_000 }
  );

  if (content) {
    const parsed = extractJson<{ products?: AiProduct[] }>(content);
    const products = normalizeProducts(parsed?.products ?? []);
    if (products.length > 0) {
      // Freeze this extraction: same document in → same products out, forever.
      // A refresh run overwrites the previous entry with the new roll.
      const key = extractionKey(EXTRACTION_PROMPT_VERSION, ingest.rawText);
      const usedModel = model ?? aiModel();
      await saveExtraction(key, {
        v: EXTRACTION_PROMPT_VERSION,
        products,
        model: usedModel,
        savedAt: new Date().toISOString(),
      } satisfies CacheEntry);
      return { products, mode: "ai", model: usedModel };
    }
  }

  const fb = fallback();
  return {
    ...fb,
    note: error
      ? `AI extraction failed (${error.slice(0, 140)}) — ${fb.note}`
      : fb.note,
  };
}

export function currentModelLabel(): string {
  return aiModel();
}
