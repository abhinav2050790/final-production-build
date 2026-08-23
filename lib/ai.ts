// ── Unified AI provider client (OpenAI-compatible) ───────────────────────────
// Resolves whichever provider key is configured, in priority order:
//   AI_* (generic OpenAI-compatible override) → GLM → Google Gemini →
//   OpenRouter → NVIDIA NIM.
// Any failure returns { content: null } so callers fall back to demo
// heuristics without taking the pipeline down.

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

const trim = (s: string | undefined): string => (s ?? "").trim();

// All configured providers, best-first. The first entry serves every request;
// the rest are automatic failover when the primary is rate-limited — each
// provider has its OWN free quota, so a Groq TPM wall doesn't touch Gemini's.
// Secondary providers read their own *_MODEL var (never AI_MODEL, which
// belongs to the primary).
function providersFromEnv(): ProviderConfig[] {
  const list: ProviderConfig[] = [];

  const genericKey = trim(process.env.AI_API_KEY);
  if (genericKey) {
    list.push({
      name: "AI",
      baseUrl: trim(process.env.AI_BASE_URL) || "https://api.openai.com/v1",
      model: trim(process.env.AI_MODEL) || "gpt-4o-mini",
      apiKey: genericKey,
    });
  }

  const cerebrasKey = trim(process.env.CEREBRAS_API_KEY);
  if (cerebrasKey) {
    list.push({
      name: "Cerebras",
      baseUrl: "https://api.cerebras.ai/v1",
      model: trim(process.env.CEREBRAS_MODEL) || "gpt-oss-120b",
      apiKey: cerebrasKey,
    });
  }

  const glmKey = trim(process.env.GLM_API_KEY);
  if (glmKey) {
    list.push({
      name: "GLM",
      baseUrl: trim(process.env.GLM_BASE_URL) || "https://open.bigmodel.cn/api/paas/v4",
      model: trim(process.env.GLM_MODEL) || "glm-4-flash",
      apiKey: glmKey,
    });
  }

  const googleKey = trim(process.env.GOOGLE_API_KEY);
  if (googleKey) {
    list.push({
      name: "Gemini",
      // Gemini's OpenAI-compatible endpoint
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      model: trim(process.env.GOOGLE_MODEL) || "gemini-3.6-flash",
      apiKey: googleKey,
    });
  }

  const openRouterKey = trim(process.env.OPENROUTER_API_KEY);
  if (openRouterKey) {
    list.push({
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: trim(process.env.OPENROUTER_MODEL) || "z-ai/glm-5.2:free",
      apiKey: openRouterKey,
    });
  }

  const nemoKey = trim(process.env.NEMOTRON_API_KEY);
  if (nemoKey) {
    list.push({
      name: "NVIDIA NIM",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      model: trim(process.env.NEMOTRON_MODEL) || "meta/llama-3.3-70b-instruct",
      apiKey: nemoKey,
    });
  }

  return list;
}

export function resolveProvider(): ProviderConfig | null {
  return providersFromEnv()[0] ?? null;
}

export function aiConfigured(): boolean {
  return resolveProvider() !== null;
}

export function aiProvider(): string {
  return resolveProvider()?.name ?? "AI";
}

export function aiModel(): string {
  return resolveProvider()?.model ?? "ai";
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** "low" cuts reasoning tokens (Gemini accepts it; speeds up JSON generation). */
  reasoningEffort?: "low" | "medium" | "high";
  /** Request JSON-mode (response_format) for reliable structured output. */
  jsonMode?: boolean;
}

async function callOnce(
  provider: ProviderConfig,
  messages: AiMessage[],
  opts: AiOptions & { effectiveJsonMode?: boolean }
): Promise<
  { ok: true; content: string } | { ok: false; reason: string; retryAfterMs?: number }
> {
  const controller = new AbortController();
  // generous default: slow free-pool generations beat abort-and-restart
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000);
  try {
    const res = await fetch(`${provider.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        // temperature 0 by default: consistency across runs matters more than
        // creativity for structured extraction
        temperature: opts.temperature ?? 0,
        max_tokens: opts.maxTokens ?? 3500,
        ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
        ...(opts.effectiveJsonMode === false
          ? {}
          : opts.jsonMode
            ? { response_format: { type: "json_object" } }
            : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const ra = Number(res.headers.get("retry-after"));
      return {
        ok: false,
        reason: `HTTP ${res.status} ${body.slice(0, 160)}`,
        ...(Number.isFinite(ra) && ra > 0 ? { retryAfterMs: ra * 1000 } : {}),
      };
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
    };
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    if (!content) {
      // Reasoning models can burn the whole token budget thinking before any
      // visible output — surface that distinctly instead of "empty completion".
      return {
        ok: false,
        reason:
          choice?.finish_reason === "length"
            ? "token budget exhausted during reasoning before any output"
            : "empty completion",
      };
    }
    return { ok: true, content };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: msg.includes("abort") ? "request timed out" : msg };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Model fallback chain. Free OpenRouter pools throttle by the minute, so when
 * the primary model 429s we immediately try the next free model.
 */
function modelChain(provider: ProviderConfig): string[] {
  const chain = [provider.model];
  if (provider.name === "OpenRouter") {
    const freePool = [
      "z-ai/glm-5.2:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
    ];
    for (const m of freePool) if (!chain.includes(m)) chain.push(m);
  }
  return chain;
}

/**
 * Call the configured providers. Consistency-first policy:
 *  - ONE pinned model per project as the primary (the same-model fallback
 *    chain only runs when AI_ALLOW_CHAIN=1 — switching models mid-project is
 *    what makes results differ run to run).
 *  - When the primary is rate-limited, fail over to the next configured free
 *    provider (separate quota = separate wall). Whatever succeeds gets frozen
 *    in the extraction cache, so results stay reproducible afterwards.
 *  - Retries the SAME model on 429 once (honouring Retry-After); a second
 *    consecutive 429 means that provider's per-minute token window is spent —
 *    waiting longer there won't help, so move on.
 *  - If a provider rejects JSON mode, retries once without it.
 */
export async function aiComplete(
  messages: AiMessage[],
  opts: AiOptions = {}
): Promise<{ content: string | null; model?: string; error?: string }> {
  const providers = providersFromEnv();
  if (providers.length === 0) {
    return { content: null, error: "no provider key configured" };
  }

  const allowChain = process.env.AI_ALLOW_CHAIN === "1";
  const startedAt = Date.now();
  // Extended budget: when every provider's per-minute window is spent, we hold
  // the request and retry the primary once the window resets (~60s) instead of
  // failing the user. Total worst-case wait ≈ 2 minutes.
  const deadline = Date.now() + 115_000;
  let lastReason = "unknown error";

  for (const provider of providers) {
    const models = allowChain ? modelChain(provider) : [provider.model];
    // JSON mode is opt-IN by default: several free OpenRouter models emit lazy
    // empty objects ({"products": []}) when forced into json_object mode.
    // Groq/Cerebras (gpt-oss-120b) implement it properly, so enable it there.
    let jsonMode =
      opts.jsonMode === true ||
      /api\.groq\.com|api\.cerebras\.ai/i.test(provider.baseUrl);

    for (const model of models) {
      let rateLimitStrikes = 0;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (Date.now() > deadline) {
          return {
            content: null,
            error: `the AI is too busy right now (last: ${lastReason.slice(0, 80)}) — retry in a minute, or press Shift+D for offline mode`,
          };
        }
        const res = await callOnce(
          { ...provider, model },
          messages,
          { ...opts, jsonMode, effectiveJsonMode: jsonMode }
        );
        if (res.ok) return { content: res.content, model };
        lastReason = `${provider.name}: ${res.reason}`;

        // provider doesn't support response_format → drop it and retry now
        if (jsonMode && /response_format/i.test(res.reason)) {
          jsonMode = false;
          continue;
        }
        if (res.reason.includes("429")) {
          rateLimitStrikes++;
          if (rateLimitStrikes >= 2) break; // this minute is spent here → next provider
          // wait out part of the window but always leave ~12s for one more try
          const remaining = deadline - Date.now() - 12_000;
          const wait = Math.min(res.retryAfterMs ?? 25_000, Math.max(0, remaining));
          if (wait > 1000) await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }

  // Every provider is rate limited — hold until the per-minute window resets
  // and give the primary one final shot before surfacing an error.
  const elapsed = Date.now() - startedAt;
  if (/429/.test(lastReason) && elapsed < 68_000) {
    const waitMs = 68_000 - elapsed;
    await new Promise((r) => setTimeout(r, waitMs));
    const primary = providers[0];
    const res = await callOnce(
      primary,
      messages,
      { ...opts, jsonMode: opts.jsonMode === true || /api\.groq\.com|api\.cerebras\.ai/i.test(primary.baseUrl), effectiveJsonMode: opts.jsonMode === true || /api\.groq\.com|api\.cerebras\.ai/i.test(primary.baseUrl) }
    );
    if (res.ok) return { content: res.content, model: primary.model };
    lastReason = `${primary.name}: ${res.reason}`;
  }

  const rateLimited = lastReason.includes("429");
  return {
    content: null,
    error: rateLimited
      ? "all configured AI providers are rate limited right now — wait a minute and retry, or press Shift+D for offline mode"
      : lastReason,
  };
}

/** Short display label for a model id ("z-ai/glm-5.2:free" → "glm-5.2"). */
export function modelLabel(model: string): string {
  const tail = model.includes("/") ? model.split("/").pop()! : model;
  return tail.replace(/:free$/, "");
}

/**
 * Tolerant JSON extractor: strips markdown fences and code prose, then scans
 * for the first balanced JSON object/array in the string.
 */
export function extractJson<T>(raw: string): T | null {
  if (!raw) return null;
  // Some servers inline chain-of-thought in <think> blocks — drop them before
  // scanning, they can contain braces that break the balance scan.
  const s = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  let start: number;
  if (firstObj === -1 && firstArr === -1) return null;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);

  const open = s[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) {
        const candidate = s.slice(start, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
