# HANDOFF — SpecForge AI (read this first in a new session)

State as of: 2026-08-22 (evening). This file is the session-to-session handoff.
The README covers the product; this covers the working state.

## What this app is

Product-data extractor: spec sheets / datasheets / catalog PDFs in → organized
product dashboard out. Every product shows attribute:value specs
(`Input voltage — 230V AC`), key features, use cases; searchable, filterable,
exportable (Markdown / JSON / CSV). The original user-stories feature was
**removed completely** at the user's request — do not resurrect it.

## How to run

```bash
cd "C:\Users\shrey\OneDrive\Desktop\gem hacka"
npm install   # already done
npm run dev   # → http://localhost:3000
```

Production build verified passing (`npm run build`).

## Current AI setup (already configured in .env.local)

- Provider: **Groq** — `openai/gpt-oss-120b` via the generic `AI_*` override
  (key already in `.env.local` — do not ask the user for it again).
  Verified live 2026-08-23: ~8.5s full extraction, clean JSON.
- **It is a reasoning model**: set `reasoning_effort: "low"` (done in
  extractProducts.ts) and give `ai.ts` room for reasoning tokens.
- **Groq free tier = 8,000 TPM counted as prompt + max_tokens per request.**
  Budget is tuned to fit: doc slice 9,000 chars + maxTokens 4,500 ≈ 7,950
  worst case. Raising either will 413 ("Payload Too Large").
- JSON mode (`response_format: json_object`) auto-enables for Groq only in
  `lib/ai.ts` — it implements it properly; OpenRouter free models do not
  (they emit lazy empty objects), which is why it stays opt-in elsewhere.
- **Automatic FREE failover** (added 2026-08-23): Groq → Gemini → OpenRouter,
  wired in `lib/ai.ts providersFromEnv()`. Keys for all three are live in
  `.env.local`. Triggers after a 2nd consecutive 429 on a provider (its
  per-minute token window is spent); honors Retry-After headers. Secondary
  providers read GOOGLE_MODEL / OPENROUTER_MODEL — never AI_MODEL.
  Whatever provider succeeds gets frozen in the cache → results stay
  reproducible afterwards.
- Backup chain: same-model OpenRouter retries when `AI_ALLOW_CHAIN=1`,
  75s total budget, then built-in parsers as final fallback.
- Local Ollama installed with `gemma4:26b` pulled but NOT viable: RTX 5050
  has only 4GB VRAM → CPU-bound and far too slow for extraction.
- Shift+D toggles offline mode (deterministic parsers only).

## Extraction chain (lib/pipeline/extractProducts.ts)

1. Live AI single call → structured products (name, part#, brand, category,
   attributes[], keyFeatures[], useCases[]).
2. Fallback A: catalog-row parser (`products.ts parseCatalog`) for `--`-row data
   (e.g., the Unihack abrasives PDF → 108 products).
3. Fallback B: prose `Label: Value` parser (`products.ts parseSpecLines`) for
   spec-sheet paragraphs.

Post-processing in `runner.ts`: canonical attribute names (fixes glued
CamelCase like `InputVoltage`), dedupe specs, drop phantom products.

## Consistency layer (2026-08-23 — why results used to differ every run)

LLMs are non-deterministic and the old fallback chain silently switched models
mid-project. The fix, in `lib/ai.ts` + `lib/pipeline/extractionCache.ts`:

1. **One pinned model** — the 429 fallback chain only runs when `AI_ALLOW_CHAIN=1`.
2. **Temperature 0** everywhere (default).
3. **Frozen extraction cache** (`.specforge-cache/extractions/`) keyed by
   sha256(prompt version + full text): the same document returns the identical
   saved result in <1s. "↻ Re-extract fresh" (results header) bypasses and
   overwrites the entry; a `✔ cached` chip marks cached runs.
4. JSON mode (`response_format: json_object`) is **opt-in only** — these free
   models emit lazy empty objects (`{"products": []}`) when forced into it.
   Do not enable it for extraction.

Verified: same input ×3 → identical fingerprints; repeats ~0.7s.

## Known trade-offs / open items

- **Speed**: solved for the common case by Groq (~8-10s per extraction).
  OpenRouter free pools (backup) still fluctuate ~30s–2.5min when congested.
- **Rate limits**: Groq free ≈ 1 big extraction/min (8k TPM). Back-to-back
  different-document runs now fail over to Gemini/OpenRouter instead of
  erroring; identical repeats are instant via the frozen cache. Gemini's daily
  quota can still exhaust under heavy use (happened 2026-08-22, resets daily).
- Free OpenRouter models occasionally trip 429 under repeated back-to-back
  testing — the chain + failover + parsers absorb it; empty results explain themselves.
- Input capped at 9,000 chars for the AI path (Groq TPM budget; PDFs truncate
  to first chunk).

## Files that matter

- `lib/ai.ts` — provider priority, fallback chain, 429 budget
- `lib/pipeline/runner.ts` — orchestrator (5 stages), canonicalizer, data quality
- `lib/pipeline/extractProducts.ts` — AI extraction + fallbacks
- `components/ProductsTab.tsx`, `ProductDetailDrawer.tsx` — the dashboard
- `app/page.tsx` — single-page shell (tabs: Products / Data quality / Export)
- `scripts/stress-demo.mjs` — old demo-mode suite (references removed story
  pipeline? verify before running — it predates the product pivot)

## Working conventions established with the user

- Verify everything: production build + live run + browser walkthrough before
  claiming done.
- Plain-language UI (no terminal windows, no jargon); technical detail only in
  the audit drawer.
- Restart dev server after .env.local changes; `taskkill` any node PID holding
  port 3000 first (zombie children are common on this Windows machine).
