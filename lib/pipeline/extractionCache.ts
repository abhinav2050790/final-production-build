// ── Disk-backed extraction cache ──────────────────────────────────────────────
// Free models are non-deterministic and the 429 fallback chain lands on a
// different model each run, so re-extracting the same document produced
// different results every time. The cache freezes the first good extraction
// per document (keyed by prompt version + full text): the same input now
// returns the identical result instantly, on every run, on any model.
// "Re-extract fresh" bypasses and overwrites the entry.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), ".specforge-cache", "extractions");

export function extractionKey(promptVersion: string, rawText: string): string {
  return createHash("sha256")
    .update(`${promptVersion}\n${rawText}`)
    .digest("hex");
}

export async function loadExtraction<T>(key: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null; // miss, corrupt entry, or first run
  }
}

export async function saveExtraction(key: string, value: unknown): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(
      path.join(CACHE_DIR, `${key}.json`),
      JSON.stringify(value, null, 2)
    );
  } catch {
    // best-effort only — cache failures must never break a run
  }
}
