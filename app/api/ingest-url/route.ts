// ── /api/ingest-url — fetch a web page and reduce it to pipeline-ready text ───
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const raw = (body.url ?? "").trim();
  let url: URL;
  try {
    url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) throw new Error("protocol");
  } catch {
    return NextResponse.json({ error: "Give a full http(s) product-page or datasheet URL." }, { status: 400 });
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `The site answered HTTP ${res.status}.` }, { status: 502 });
    }
    const html = (await res.text()).slice(0, 2_000_000);

    // crude but effective DOM-less extraction
    const text = htmlToText(html);
    const clean = text.replace(/\n{3,}/g, "\n\n").trim();
    if (clean.length < 200) {
      return NextResponse.json(
        { error: "That page had almost no readable text — it may be JS-rendered. Paste the PDF instead." },
        { status: 422 }
      );
    }
    return NextResponse.json({
      text: clean.slice(0, 40_000),
      title: titleFrom(html, url.hostname),
      chars: clean.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Fetch failed: ${e instanceof Error ? e.message.slice(0, 100) : "unknown"}` },
      { status: 502 }
    );
  }
}

function titleFrom(html: string, host: string): string {
  const m = /<title[^>]*>([^<]{1,160})<\/title>/i.exec(html);
  return m ? m[1].replace(/\s+/g, " ").trim() : `Page from ${host}`;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|tr|li|h[1-6]|table|section)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<td[^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n");
}
