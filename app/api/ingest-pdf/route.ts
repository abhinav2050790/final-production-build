// ── PDF → text extraction (workerless, Node-safe) ─────────────────────────────
// Uses pdf-parse's CJS build (pdf.js 1.x) which runs entirely in-process —
// no worker loading, so it cannot hit the classic
// "fake worker failed: Only URLs with a scheme in: file and data are supported"
// error that pdfjs-dist v3/v4 throws inside Node API routes.

import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT = 16000; // mirrors the pipeline's ingest cap

// modern pdf.js (via unpdf) — reconstructs damaged/missing XRef tables that
// the legacy pdf-parse build throws on ("bad XRef entry" etc.)
// dynamic import avoids ESM-only bundling issues at build time.
async function parseWithUnpdf(buffer: Buffer) {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const content = Array.isArray(text) ? text.join("\n") : text;
  return {
    pages: totalPages,
    text: content.replace(/\0/g, "").replace(/[ \t]{2,}/g, " ").trim(),
  };
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

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";
    let pages = 0;
    let primaryError: unknown = null;
    try {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
      pages = parsed.numpages;
    } catch (err) {
      primaryError = err;
      const alt = await parseWithUnpdf(buffer);
      text = alt.text;
      pages = alt.pages;
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
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err);
    const detail =
      primaryError instanceof Error && /xref/i.test(primaryError.message)
        ? " (damaged PDF structure — recovered where possible)"
        : "";
    return Response.json(
      { error: `PDF parsing failed: ${message}${detail}` },
      { status: 500 }
    );
  }
}
