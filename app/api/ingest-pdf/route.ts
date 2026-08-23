// ── PDF → text extraction with multi-parser fallback ──────────────────────────
// Layer 1: pdf-parse (CJS, fast, handles most PDFs)
// Layer 2: pdfjs-dist v3 (Mozilla PDF.js, handles damaged/missing XRef tables)
// Both run in-process — no web workers, no "fake worker" errors.

// eslint-disable-next-line @typescript-eslint/no-require-imports
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT = 16000; // mirrors the pipeline's ingest cap

// ── pdfjs-dist v3 fallback ───────────────────────────────────────────────────
// eval("require") bypasses webpack bundling — same trick pdfjs-dist uses
// internally for Node.js fake-worker detection.
async function parseWithPdfjs(buffer: Buffer): Promise<{ text: string; pages: number }> {
  // @ts-ignore dynamic require hidden from bundler
  const pdfjsLib = eval("require")("pdfjs-dist/build/pdf.js");
  // @ts-ignore
  const workerMod = eval("require")("pdfjs-dist/build/pdf.worker.js");
  (globalThis as any).pdfjsWorker = { WorkerMessageHandler: workerMod.WorkerMessageHandler };

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .filter((item: any) => "str" in item)
      .map((item: any) => item.str);
    pageTexts.push(strings.join(" "));
  }

  const text = pageTexts
    .join("\n")
    .replace(/\0/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return { text, pages: doc.numPages };
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

  // ── Layer 1: pdf-parse (fast path) ──────────────────────────────────────────
  let text = "";
  let pages = 0;

  try {
    const parsed = await pdfParse(buffer);
    text = parsed.text;
    pages = parsed.numpages;
  } catch {
    // pdf-parse failed — fall through to Layer 2
  }

  // ── Layer 2: pdfjs-dist fallback (handles damaged PDFs) ─────────────────────
  if (text.length < 30) {
    try {
      const alt = await parseWithPdfjs(buffer);
      text = alt.text;
      pages = alt.pages;
    } catch (fallbackErr) {
      const msg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      return Response.json(
        { error: `PDF parsing failed: both parsers could not read this file. ${msg}` },
        { status: 500 }
      );
    }
  }

  text = text.replace(/\0/g, "").replace(/[ \t]{2,}/g, " ").trim();

  if (text.length < 30) {
    return Response.json(
      {
        error:
          "No extractable text found — this PDF is likely scanned images and would need OCR. Paste the text manually instead.",
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
    name,
  });
}
