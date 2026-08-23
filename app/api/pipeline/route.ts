import { runPipeline, WARMUP_SEED } from "@/lib/pipeline/runner";
import { aiConfigured, aiModel, aiProvider } from "@/lib/ai";
import { checkRate } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight capability probe so the UI can badge live AI vs demo before a run. */
export async function GET() {
  return Response.json({
    mode: aiConfigured() ? "ai" : "demo",
    provider: aiConfigured() ? aiProvider() : null,
    model: aiConfigured() ? aiModel() : null,
  });
}

/** Runs the 5-stage pipeline and streams NDJSON events as stages progress. */
export async function POST(req: Request) {
  let body: { text?: string; title?: string; demo?: boolean; warmup?: boolean; refresh?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Warmup preflight: pre-compiles the route + JIT-warms every module with a
  // tiny forced-demo run so the first real demo never eats compile latency.
  const warmup = body.warmup === true;
  const text = warmup ? WARMUP_SEED : (body.text ?? "").toString();

  if (!warmup && text.trim().length < 40) {
    return Response.json(
      { error: "Give the forge at least ~40 characters of raw input." },
      { status: 400 }
    );
  }

  // Fair-use guard: the AI keys are shared by every visitor.
  if (!warmup) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const limit = checkRate("extract", ip);
    if (!limit.ok) {
      return Response.json(
        { error: `Fair-use limit reached (${limit.retryAfterMin} min until your next free extraction). Sign in and reuse your saved extractions, or press Shift+D for offline mode.` },
        { status: 429 }
      );
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {
          // client disconnected — stop writing
        }
      };
      try {
        for await (const event of runPipeline({
          text,
          title: warmup ? undefined : body.title,
          forceDemo: warmup ? true : body.demo === true,
          refresh: warmup ? false : body.refresh === true,
        })) {
          send(event);
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Pipeline crashed unexpectedly.",
        });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
