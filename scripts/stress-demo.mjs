// Demo-mode stress suite: runs every seed sample through the pipeline twice,
// checks structure, determinism, concurrency, and the <2s spinner budget.
// Usage: node scripts/stress-demo.mjs [baseUrl]

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? "http://localhost:3000";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Pull the real sample texts out of lib/samples.ts (no nested backticks inside)
const samplesSrc = readFileSync(join(root, "lib", "samples.ts"), "utf8");
const ids = [...samplesSrc.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);
const texts = [...samplesSrc.matchAll(/text: `([\s\S]*?)`/g)].map((m) => m[1]);
if (ids.length !== texts.length) throw new Error("sample parse mismatch");
const samples = ids.map((id, i) => ({ id, text: texts[i] }));

const API = `${BASE}/api/pipeline`;

async function runPipeline(text) {
  const t0 = Date.now();
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, demo: true }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const body = await res.text();
  const events = body.trim().split("\n").map((l) => JSON.parse(l));
  const complete = events.find((e) => e.type === "complete");
  if (!complete) throw new Error(`no complete event; got: ${events.map((e) => e.type).join(",")}`);
  return { spec: complete.spec, ms: Date.now() - t0, events };
}

function validateSpec(spec, label) {
  const problems = [];
  if (!spec.stories.length) problems.push("0 stories");
  for (const s of spec.stories) {
    if (!s.id || !s.title || !s.asA || !s.iWant || !s.soThat) problems.push(`${s.id ?? "?"}: missing core fields`);
    if (!s.acceptanceCriteria.length) problems.push(`${s.id}: no acceptance criteria`);
    if (!s.evidence.length) problems.push(`${s.id}: no evidence`);
    if (s.evidence.some((e) => e.segmentIndex < 0)) problems.push(`${s.id}: unlinked evidence`);
    if (!(s.confidence > 0 && s.confidence <= 1)) problems.push(`${s.id}: bad confidence`);
    if (!s.confidenceBreakdown?.sourceClarity) problems.push(`${s.id}: no breakdown`);
  }
  if (!spec.validation || typeof spec.validation.score !== "number") problems.push("no validation score");
  if (!spec.exports?.markdown?.length) problems.push("no markdown export");
  if (!spec.exports?.csv?.length) problems.push("no csv export");
  try { JSON.parse(spec.exports.json); } catch { problems.push("json export does not parse"); }
  if (spec.mode !== "demo") problems.push(`mode=${spec.mode}, expected demo`);
  if (problems.length) throw new Error(`${label}: ${problems.slice(0, 5).join("; ")}`);
  return true;
}

const fingerprint = (spec) =>
  spec.stories.map((s) => `${s.id}|${s.title}|${s.priority}|${s.complexity}|${s.confidence}`).join(" ;; ");

let failures = 0;
const t = (ok, msg) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${msg}`);
  if (!ok) failures++;
};

console.log(`\n=== SpecForge demo-mode stress suite (${BASE}) ===\n`);

// 0. mode probe must report demo (no key) or glm availability
const probe = await (await fetch(API)).json();
console.log(`mode probe: ${JSON.stringify(probe)}`);

for (const s of samples) {
  console.log(`\n— sample “${s.id}” —`);
  const r1 = await runPipeline(s.text);
  t(validateSpec(r1.spec, s.id), `run 1 structure OK — ${r1.spec.stories.length} stories, score ${r1.spec.validation.score}, coverage ${Math.round(r1.spec.validation.coverage * 100)}%`);
  const r2 = await runPipeline(s.text);
  t(fingerprint(r1.spec) === fingerprint(r2.spec), `deterministic — run 2 identical (${r2.spec.stories.length} stories)`);
  const maxMs = Math.max(r1.ms, r2.ms);
  t(maxMs < 2000, `spinner budget — wall time ${r1.ms}ms / ${r2.ms}ms (max ${maxMs}ms < 2000ms)`);
  t(r1.spec.exports.markdown.includes("## User Stories"), "markdown export has stories section");
}

// forced-demo flag actually skips GLM path (works whether or not a key exists)
const forced = await runPipeline(samples[0].text);
t(forced.spec.modeNote?.length > 0, `mode note present: “${(forced.spec.modeNote ?? "").slice(0, 60)}…”`);

// warmup preflight
const w0 = Date.now();
const wres = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ warmup: true }) });
const warmOk = wres.ok && (await wres.text()).includes('"type":"complete"');
t(warmOk, `warmup preflight completes (${Date.now() - w0}ms)`);

// concurrency: 5 parallel demo runs
console.log("\n— concurrency: 5 parallel runs —");
const c0 = Date.now();
const concurrent = await Promise.all(samples.concat([samples[0]]).map((s) => runPipeline(s.text)));
const allOk = concurrent.every((r) => validateSpec(r.spec, "concurrent"));
t(allOk, `all 5 parallel runs produced valid specs in ${Date.now() - c0}ms`);
t(concurrent.every((r) => r.ms < 4000), `per-run time under load: ${concurrent.map((r) => r.ms + "ms").join(", ")}`);

console.log(`\n=== ${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"} ===\n`);
process.exit(failures === 0 ? 0 : 1);
