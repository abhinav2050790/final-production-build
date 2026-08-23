// ── Product row parser (deterministic fallback) ───────────────────────────────
// For structured catalog text (rows with "--" / wide-gap columns), used when AI
// extraction is unavailable or forced off.

import { ProductAttribute, ProductRecord } from "@/lib/types";

function splitFields(line: string): string[] {
  return line
    .split(/\s*--\s*|\t+|\s{3,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const MANUF_RE =
  /\b(inc|llc|l\.l\.c|corp|corporation|ltd|limited|co\.|company|gmbh|industries|supply|distribution|wholesale|trading|group)\b/i;
const NOISE_BRAND_RE = /^(unbranded|no [a-z0-9 ]*brand|n\/?a|-|none)$/i;
const PARTNUM_RE = /^([A-Z0-9][A-Z0-9._\/-]{4,})$/;

function labelField(value: string, brandSlot: { n: number }): string {
  if (MANUF_RE.test(value) && value.includes(" ")) return "Manufacturer";
  if (NOISE_BRAND_RE.test(value)) return "skip";
  if (value.length <= 40 && !/\d{3,}/.test(value)) {
    brandSlot.n += 1;
    return brandSlot.n === 1 ? "Brand" : `Alt brand ${brandSlot.n - 1}`;
  }
  return "Details";
}

export interface CatalogParse {
  products: ProductRecord[];
  brands: string[];
  manufacturers: string[];
}

/**
 * Detect row-style product data in raw text and parse every product row.
 * Returns null when the input doesn't look like structured product rows.
 */
export function parseCatalog(text: string): CatalogParse | null {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const rows = lines.filter((line) => {
    const fields = splitFields(line);
    return fields.length >= 3 && fields[0].length >= 6;
  });

  const loneParts = new Set(
    lines.filter((l) => PARTNUM_RE.test(l) && l.length >= 6 && l.length <= 24)
  );

  if (rows.length < 5) return null;

  const products: ProductRecord[] = [];
  const brands = new Set<string>();
  const manufacturers = new Set<string>();
  const seen = new Set<string>();

  for (const line of rows) {
    const fields = splitFields(line);
    const first = fields[0];

    const firstToken = first.split(" ")[0];
    let partNumber: string | undefined;
    let name = first;
    if (PARTNUM_RE.test(firstToken) && /\d/.test(firstToken)) {
      partNumber = firstToken;
      name = first.slice(firstToken.length).trim();
    } else {
      for (const lone of loneParts) {
        if (first.startsWith(lone)) {
          partNumber = lone;
          name = first.slice(lone.length).trim();
          break;
        }
      }
    }
    if (!name) name = partNumber ?? first;

    const attributes: ProductAttribute[] = [];
    const brandSlot = { n: 0 };
    for (const value of fields.slice(1)) {
      const label = labelField(value, brandSlot);
      if (label === "skip") continue;
      if (label === "Manufacturer") manufacturers.add(value);
      if (label.startsWith("Brand") || label.startsWith("Alt")) brands.add(value);
      attributes.push({ name: label, value });
    }

    const dedupeKey = `${partNumber ?? ""}|${name}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    products.push({
      id: `P-${String(products.length + 1).padStart(3, "0")}`,
      name: name.length > 140 ? `${name.slice(0, 138)}…` : name,
      partNumber,
      attributes,
    });
  }

  if (products.length < 5) return null;

  return {
    products,
    brands: [...brands].sort().slice(0, 24),
    manufacturers: [...manufacturers].sort().slice(0, 24),
  };
}

// ── Prose spec-sheet parser (fallback #2) ─────────────────────────────────────
// Pulls "Label: Value" (and "Label — Value") pairs from prose spec sheets and
// groups them into product blocks.

const PAIR_SPLIT_RE = /(?=[A-Z][A-Za-z &/+().-]{2,28}\s*:)/g;
const PAIR_RE = /^([A-Za-z][A-Za-z0-9 &/+().-]{2,38}?)\s*:\s*(.{2,140})$/;

function pairsFromLine(line: string): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = [];
  const chunks = line.split(PAIR_SPLIT_RE);
  for (const chunk of chunks) {
    const m = chunk.trim().match(PAIR_RE);
    if (!m) continue;
    const name = m[1].trim();
    let value = m[2].trim().replace(/[.;]+$/, "");
    if (!value || /^(n\/?a|none|-|tbd)$/i.test(value)) continue;
    if (name.length < 3) continue;
    out.push({ name, value });
  }
  return out;
}

const NAME_HINT_RE = /^(model|product|name|product name|item|description)\b/i;

export function parseSpecLines(text: string): ProductRecord[] {
  const blocks = text.split(/\n{2,}/);
  const products: ProductRecord[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const attributes: Array<{ name: string; value: string }> = [];
    const headingLines: string[] = [];
    let name: string | undefined;

    for (const line of lines) {
      const pairs = pairsFromLine(line);
      if (pairs.length > 0) {
        for (const p of pairs) {
          if (NAME_HINT_RE.test(p.name) && !name && p.value.length <= 80) {
            name = p.value;
          } else {
            attributes.push(p);
          }
        }
      } else if (line.length <= 90) {
        // candidate heading: short line without a pair
        headingLines.push(line.replace(/[.:—-]+$/, "").trim());
      }
    }

    if (attributes.length < 2) continue;
    if (!name) name = headingLines[0] ?? `Product block ${products.length + 1}`;
    name = name.replace(/[.:]+$/, "").trim().slice(0, 140);

    products.push({
      id: `P-${String(products.length + 1).padStart(3, "0")}`,
      name,
      attributes: attributes.slice(0, 30),
    });
  }

  return products;
}
