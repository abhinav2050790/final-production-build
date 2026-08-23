// ── PDF → text extraction with multi-parser fallback ──────────────────────────
// Layer 1: pdf-parse (fast, handles most well-formed PDFs)
// Layer 2: pdfjs-dist legacy build (Mozilla PDF.js, recovers damaged XRef tables)
// Layer 3: raw content-stream scraper (zlib inflate + text-operator harvesting,
//          works even when the PDF structure is broken beyond pdf.js's repair).
//
// IMPORTANT: the pdfjs-dist imports below must stay bundler-visible dynamic
// imports (`await import(...)`). Do NOT switch them to eval("require") — hidden
// requires are invisible to Vercel's file tracer, the package never reaches the
// deployed lambda, and every fallback call dies with "Cannot find module".
// next.config.mjs lists pdfjs-dist in serverComponentsExternalPackages, so these
// imports compile to native requires that ship node_modules/pdfjs-dist.

import { inflateRawSync, inflateSync } from "node:zlib";

import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT = 16000; // mirrors the pipeline's ingest cap

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.js");

let pdfjsPromise: Promise<PdfjsModule> | null = null;

function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const lib = await import("pdfjs-dist/legacy/build/pdf.js");
      try {
        // @ts-ignore — the worker build ships no type declarations
        const worker = await import("pdfjs-dist/legacy/build/pdf.worker.js");
        const mod = worker as unknown as { WorkerMessageHandler?: unknown; default?: { WorkerMessageHandler?: unknown } };
        const resolved =
          mod && mod.WorkerMessageHandler
            ? mod
            : mod && mod.default && mod.default.WorkerMessageHandler
              ? mod.default
              : mod;
        (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = resolved;
      } catch {
        // fake-worker setup is optional — Node mode falls back on its own
      }
      return lib;
    })();
  }
  return pdfjsPromise;
}

// ── Layer 2: pdfjs-dist (structure recovery for damaged XRef tables) ─────────
async function parseWithPdfjs(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: false,
    disableFontFace: true,
    isEvalSupported: false,
    // runtime-only option (untyped in v3) — lets weakly-encrypted files through
    ignoreEncryption: true,
  } as Parameters<typeof pdfjs.getDocument>[0]);
  const doc = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = (content.items as Array<{ str?: string }>)
        .filter((item) => typeof item.str === "string")
        .map((item) => item.str!);
      pageTexts.push(strings.join(" "));
    } catch {
      pageTexts.push(""); // unreadable single page — keep the rest
    }
  }
  await loadingTask.destroy();

  const text = pageTexts.join("\n").replace(/\0/g, "").trim();
  return { text, pages: doc.numPages };
}

// ── Layer 3: raw content-stream scraper ───────────────────────────────────────
// Ignores the PDF's object index entirely: finds every stream blob, inflates it,
// and pulls human text out of the content-stream operators (Tj / TJ / ' / ").

function decodeLiteralString(body: string): string {
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = body[++i];
    if (next === undefined) break;
    if (next >= "0" && next <= "7") {
      let oct = next;
      while (oct.length < 3 && body[i + 1] >= "0" && body[i + 1] <= "7") oct += body[++i];
      out += String.fromCharCode(parseInt(oct, 8));
    } else if (next === "\r") {
      if (body[i + 1] === "\n") i++;
    } else {
      out += { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[next] ?? next;
    }
  }
  return out;
}

function harvestTextOperators(content: string): string {
  const out: string[] = [];
  let pending: string[] = [];

  const flush = () => {
    if (pending.length > 0) {
      out.push(pending.join(""));
      pending = [];
    }
  };

  const tokenRe = /\((?:\\[\s\S]|[^\\()])*\)|<[0-9A-Fa-f\s]*>|\bT[JjdD]\b|\bT\*\b|\bET\b|[']/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(content)) !== null) {
    const tok = m[0];
    if (tok.startsWith("(")) {
      pending.push(decodeLiteralString(tok.slice(1, -1)));
    } else if (tok.startsWith("<")) {
      const hex = tok.slice(1, -1).replace(/\s+/g, "");
      for (let i = 0; i + 1 < hex.length; i += 2) {
        pending.push(String.fromCharCode(parseInt(hex.slice(i, i + 2), 16)));
      }
    } else if (tok === "T*" || tok === "Td" || tok === "TD" || tok === "'" || tok === "ET") {
      flush();
      if (out.length > 0) out[out.length - 1] += "\n";
    } else if (tok === "TJ" || tok === "Tj") {
      flush();
    }
    if (out.length > 4000) break;
  }
  flush();
  return out.join(" ");
}

function printableRatio(s: string): number {
  if (s.length === 0) return 0;
  let good = 0;
  for (const ch of s) {
    if (/[\t\n\r \x20-\x7E\u00A0-\u024F]/.test(ch)) good++;
  }
  return good / s.length;
}

function scrapeRawStreams(buffer: Buffer): string {
  const latin = buffer.toString("latin1");
  const pieces: string[] = [];
  const seenLines = new Set<string>();

  const streamRe = /stream(?:\r\n|\n|\r)/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(latin)) !== null) {
    const start = m.index + m[0].length;
    let end = latin.indexOf("endstream", start);
    if (end < 0) continue;
    while (end > start && (latin[end - 1] === "\n" || latin[end - 1] === "\r")) end--;
    const raw = buffer.subarray(start, end);

    let content: Buffer | null = null;
    try {
      content = inflateSync(raw);
    } catch {
      try {
        content = inflateRawSync(raw);
      } catch {
        const head = raw.subarray(0, 4).toString("latin1");
        if (head.startsWith("(") || head.startsWith("[") || head.startsWith("BT")) content = raw;
      }
    }
    if (!content) continue;

    const asText = content.toString("latin1");
    if (!/\bT[jJ]\b/.test(asText)) continue;

    let harvested = harvestTextOperators(asText);
    harvested = harvested.replace(/[^\t\n\r\x20-\x7E\u00A0-\u024F]+/g, " ");
    if (printableRatio(harvested) < 0.85 || harvested.replace(/[^A-Za-z0-9]/g, "").length < 12) {
      continue; // CID/binary garbage — not useful text
    }

    for (const line of harvested.split("\n")) {
      const clean = line.replace(/\s+/g, " ").trim();
      if (clean.length < 2) continue;
      if (seenLines.has(clean)) continue;
      seenLines.add(clean);
      pieces.push(clean);
    }

    streamRe.lastIndex = end; // do not rescan inside this blob
  }

  return pieces.join("\n");
}

function classifyError(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : String(err);
  if (/password/i.test(msg) || /encrypted/i.test(msg)) {
    return "This PDF is password-protected. Remove the password and try again.";
  }
  return null;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 10 MB.` },
      { status: 413 }
    );
  }
  const name = file.name || "document.pdf";
  if (!/\.pdf$/i.test(name) && file.type !== "application/pdf") {
    return Response.json(
      { error: "Only PDF files are supported (use the text box for everything else)." },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let pages = 0;
  let text = "";
  let degraded = false;
  let lastError: unknown = null;

  // ── Layer 1: pdf-parse (fast path) ──────────────────────────────────────────
  try {
    const parsed = await pdfParse(buffer);
    text = parsed.text;
    pages = parsed.numpages;
  } catch {
    // fall through
  }

  // ── Layer 2: pdfjs-dist (damaged-structure recovery) ────────────────────────
  if (text.replace(/\s/g, "").length < 30) {
    try {
      const alt = await parseWithPdfjs(buffer);
      if (alt.text.replace(/\s/g, "").length > text.replace(/\s/g, "").length) {
        text = alt.text;
        pages = alt.pages || pages;
      }
    } catch (err) {
      lastError = err;
      console.error(`[ingest-pdf] pdfjs-dist failed for ${name}:`, err);
    }
  }

  // ── Layer 3: raw stream scrape (last resort — never throws) ─────────────────
  if (text.replace(/\s/g, "").length < 30) {
    try {
      const scraped = scrapeRawStreams(buffer);
      if (scraped.replace(/\s/g, "").length > text.replace(/\s/g, "").length) {
        text = scraped;
        degraded = true;
      }
    } catch (err) {
      console.error(`[ingest-pdf] raw scraper failed for ${name}:`, err);
    }
  }

  text = text.replace(/\0/g, "").replace(/[ \t]{2,}/g, " ").trim();

  if (text.replace(/\s/g, "").length < 30) {
    const friendly = classifyError(lastError);
    return Response.json(
      {
        error:
          friendly ??
          (lastError
            ? "This PDF is too damaged to read — even the recovery parsers found nothing usable. Try re-exporting or printing it to a fresh PDF."
            : "No extractable text found — this PDF is likely scanned images and would need OCR. Paste the text manually instead."),
      },
      { status: 422 }
    );
  }

  const truncated = text.length > MAX_TEXT;
  return Response.json({
    text: truncated ? text.slice(0, MAX_TEXT) : text,
    pages,
    chars: text.length,
    truncated,
    degraded,
    name,
  });
}
