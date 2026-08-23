# ⚒️ SpecForge AI

**Messy PDFs in. Product data out.**

SpecForge AI reads spec sheets, datasheets and product catalogs and organizes
every product into clean pages — every attribute with its value
(`Input voltage — 230V AC`, `Range — 0-100 bar`), key features and use cases,
ready to search, filter and export.

Built with **Next.js 14 · TypeScript · Tailwind · live AI** (any
OpenAI-compatible provider) with a deterministic offline fallback.

---

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Attach a PDF (or paste
text) and hit **⚡ Forge Specification**.

### Live AI

Any OpenAI-compatible provider works — priority:
**AI_\* (generic) → GLM → Gemini → OpenRouter → NVIDIA NIM**. Current setup:
OpenRouter free models (`OPENROUTER_API_KEY` in `.env.local`). Free pools
throttle by the minute, so the client walks an automatic fallback chain on 429s
(`z-ai/glm-5.2:free` → `gemma-4-31b:free` → `nemotron-3-super-120b:free` →
`nemotron-3-nano:free`) with a 75s total budget before falling back to the
built-in parser. For truly unlimited local inference, an installed **Ollama**
works via the generic override (`AI_BASE_URL=http://localhost:11434/v1`).

**Shift+D** toggles offline fast-parse mode instantly at any time.

---

## The 5-stage pipeline

| Stage | What happens | Engine |
|-------|--------------|--------|
| 📥 **Ingest** | Normalize, segment, detect document type | deterministic |
| 🔎 **Extract** | The AI reads the document and returns structured products — name, part number, brand, every attribute:value pair, key features, use cases | live AI · parser fallback |
| 🗂️ **Organize** | Canonical attribute names (`InputVoltage` → `Input voltage`), dedupe specs, drop phantom products | deterministic |
| 🛡️ **Check** | Data quality: gaps, duplicates, attribute coverage → 0–100 score | deterministic |
| 📦 **Export** | Markdown product pages · JSON · CSV catalog | deterministic |

Every stage streams progress to the UI live (NDJSON), driving the 3D isometric
pipeline view and the plain-language activity feed. The **🧾 Audit trail** drawer
shows the full technical trace of the last run.

## The product dashboard

- **Stats strip** — products, attribute values, brands, quality score
- **Search** across names, part numbers, attribute names *and values*
- **Brand filter chips** and sorting (name / most specifications / brand)
- **Product cards** with `attribute — value` spec rows; click for the **detail
  drawer**: description, full specifications table, key features, use cases
- **Data quality tab** — completeness findings in plain language
- **Export tab** — download Markdown / JSON / CSV

PDFs are parsed server-side by a workerless extractor (`pdf-parse`) — no
pdf.js-in-Node worker crashes. Limits: 10 MB per file, 16,000 extracted chars.

## Architecture

```
app/
  page.tsx                 # single-page app (hero, studio, product dashboard)
  api/pipeline/route.ts    # GET mode probe · POST streams pipeline events
  api/ingest-pdf/route.ts  # PDF → text (workerless)
lib/
  ai.ts                    # provider client: priority, fallback chain, 429 budget
  pipeline/runner.ts       # orchestrator: ingest → extract → organize → check → export
  pipeline/extractProducts.ts  # single-call AI product extraction
  pipeline/products.ts     # deterministic row-parser fallback
  pipeline/ingest.ts / export.ts / pacing.ts
  samples.ts               # spec sheet, datasheet, catalog-row samples
components/
  ParticleHero · Pipeline3D · StageConsole · InputPanel
  ProductsTab · ProductDetailDrawer · DataQualityTab · ExportTab · AuditDrawer
```

## Notes

- Live runs take **~1–2.5 min** on free OpenRouter models (pool speed varies);
  offline mode (Shift+D) parses row catalogs in about a second.
- `prefers-reduced-motion` disables all animation.
