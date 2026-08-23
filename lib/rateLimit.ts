// ── Lightweight in-memory rate limiter for AI-costing endpoints ───────────────
// Per-instance (serverless caveat: per lambda), keyed by IP or user email.
// Deters casual abuse of the shared free-tier keys; not a hard security boundary.

const buckets = new Map<string, number[]>();

export interface LimitRule {
  max: number;
  windowMs: number;
}

const RULES: Record<string, LimitRule> = {
  extract: { max: 12, windowMs: 60 * 60 * 1000 }, // 12 extractions/hour
  chat: { max: 40, windowMs: 60 * 60 * 1000 }, // 40 questions/hour
};

export function checkRate(kind: keyof typeof RULES, key: string): { ok: boolean; retryAfterMin: number } {
  const rule = RULES[kind];
  if (!rule) return { ok: true, retryAfterMin: 0 };
  const now = Date.now();
  const bucket = (buckets.get(`${kind}:${key}`) ?? []).filter((t) => now - t < rule.windowMs);
  if (bucket.length >= rule.max) {
    const oldest = bucket[0];
    return { ok: false, retryAfterMin: Math.ceil((rule.windowMs - (now - oldest)) / 60000) };
  }
  bucket.push(now);
  buckets.set(`${kind}:${key}`, bucket);
  // opportunistic cleanup so the map can't grow unbounded
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= rule.windowMs)) buckets.delete(k);
    }
  }
  return { ok: true, retryAfterMin: 0 };
}
