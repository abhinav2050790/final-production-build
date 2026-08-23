// ── Text analysis helpers (deterministic, shared by every stage) ─────────────

export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SPEAKER_RE = /^([A-Z][A-Za-z .'-]{0,24}):\s+(.*)$/;
const BULLET_RE = /^[-*•–]\s+/;

export function stripBullet(s: string): string {
  return s.replace(BULLET_RE, "").trim();
}

export function detectSpeaker(line: string): { speaker?: string; rest: string } {
  const m = line.match(SPEAKER_RE);
  if (m && m[2].trim().length > 0) return { speaker: m[1].trim(), rest: m[2].trim() };
  return { rest: line.trim() };
}

/** Split into sentence-level segments, keeping speaker attribution. */
export function segmentText(normalized: string): { text: string; speaker?: string }[] {
  const out: { text: string; speaker?: string }[] = [];
  for (const rawLine of normalized.split("\n")) {
    const line = stripBullet(rawLine.trim());
    if (!line) continue;
    const { speaker, rest } = detectSpeaker(line);
    const pieces = rest
      .split(/(?<=[.!?])\s+(?=[A-Z0-9"'“])/g)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const piece of pieces.length ? pieces : [rest]) {
      if (piece.length < 3) continue;
      out.push({ text: piece, speaker });
    }
  }
  return out;
}

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / (sa.size + sb.size - inter);
}

export function sentenceTokens(s: string): string[] {
  return tokenize(s);
}

/** Deterministic PRNG so demo mode produces the same spec for the same input. */
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length > 3 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Remove common filler so a sentence can be turned into an "I want to …" clause. */
export function cleanPhrase(s: string): string {
  let p = stripBullet(s).trim();
  p = p.replace(/^[A-Z][A-Za-z .'-]{0,24}:\s+/, ""); // speaker prefix
  p = p.replace(
    /^(ok(ay)?|alright|yes|right|yeah|so|well|last one|small thing|big thing|quick one)[, ]+/i,
    ""
  );
  p = p.replace(
    /^(we (need to|must|should|want to|also need to|can't|cannot)|users? (need to|must|should|want to)|people (need to|must|should|want to)|please (add|make)|i (really )?(need|want)|coaches? (want|need) to)\s+/i,
    ""
  );
  p = p.replace(/^(need to|must|should|want to|have to|be able to)\s+/i, "");
  p = p.replace(/[.!?…]+$/, "");
  p = p.trim();
  if (p.length > 0 && p[0] === p[0].toLowerCase() && !/^[A-Z]{2,}/.test(p)) {
    p = p[0].toUpperCase() + p.slice(1); // keep it sentence-presentable
  }
  return p;
}

export const AMBIGUOUS_TERMS = [
  "etc",
  "maybe",
  "somehow",
  "various",
  "several",
  "fast",
  "slow",
  "easy",
  "simple",
  "user-friendly",
  "intuitive",
  "modern",
  "asap",
  "stuff",
  "things",
  "nice",
  "clean",
  "appropriate",
  "acceptable",
  "some",
  "a lot of",
  "lots of",
];

export function findAmbiguousTerms(s: string): string[] {
  const lower = ` ${s.toLowerCase()} `;
  return AMBIGUOUS_TERMS.filter((t) => lower.includes(` ${t} `) || lower.includes(` ${t},`));
}

export function hasQuantifier(s: string): boolean {
  return /\d|percent|%|under \w+ (second|minute|hour|day)|at least|up to|capped|maximum|minimum|per (day|week|month|user)|\$\d/i.test(
    s
  );
}
