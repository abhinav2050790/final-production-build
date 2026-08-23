// ── Data layer — cloud persistence with graceful degradation ──────────────────
// Uses any Postgres via DATABASE_URL (Neon / Supabase / Vercel Postgres).
// When DATABASE_URL is absent the library features report "not configured"
// instead of crashing, mirroring the AI provider pattern.

import postgres from "postgres";
import type { SpecDocument } from "@/lib/types";

let client: ReturnType<typeof postgres> | null = null;
let migrated = false;

export function dbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function conn(): ReturnType<typeof postgres> {
  if (!client) {
    client = postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 20 });
  }
  return client;
}

async function ensureSchema(): Promise<ReturnType<typeof postgres>> {
  const sql = conn();
  if (!migrated) {
    await sql`
      CREATE TABLE IF NOT EXISTS extractions (
        slug TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        title TEXT NOT NULL,
        doc_type TEXT NOT NULL DEFAULT 'document',
        model TEXT,
        is_public BOOLEAN NOT NULL DEFAULT TRUE,
        spec JSONB NOT NULL,
        product_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    migrated = true;
  }
  return sql;
}

export interface LibraryRecord {
  slug: string;
  owner_email: string;
  title: string;
  doc_type: string;
  model: string | null;
  product_count: number;
  created_at: string;
}

export function makeSlug(): string {
  // unambiguous alphabet, 8 chars — plenty for a hackathon-scale namespace
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export async function saveExtraction(
  ownerEmail: string,
  spec: SpecDocument
): Promise<LibraryRecord> {
  const sql = await ensureSchema();
  const slug = makeSlug();
  const rows = await sql`
    INSERT INTO extractions (slug, owner_email, title, doc_type, model, spec, product_count)
    VALUES (${slug}, ${ownerEmail}, ${spec.title}, ${spec.input?.detectedType ?? "document"},
            ${spec.model ?? null}, ${sql.json(spec as unknown as Parameters<typeof sql.json>[0])}, ${spec.products.length})
    RETURNING slug, owner_email, title, doc_type, model, product_count, created_at`;
  return rows[0] as unknown as LibraryRecord;
}

export async function listByOwner(ownerEmail: string): Promise<LibraryRecord[]> {
  const sql = await ensureSchema();
  return (await sql`
    SELECT slug, owner_email, title, doc_type, model, product_count, created_at
    FROM extractions WHERE owner_email = ${ownerEmail}
    ORDER BY created_at DESC LIMIT 100`) as unknown as LibraryRecord[];
}

export async function getPublicSpec(slug: string): Promise<SpecDocument | null> {
  const sql = await ensureSchema();
  const rows = await sql`
    SELECT spec FROM extractions WHERE slug = ${slug} AND is_public = TRUE LIMIT 1`;
  if (!rows.length) return null;
  return (rows[0] as { spec: SpecDocument }).spec;
}

export async function deleteExtraction(slug: string, ownerEmail: string): Promise<boolean> {
  const sql = await ensureSchema();
  const rows = await sql`
    DELETE FROM extractions WHERE slug = ${slug} AND owner_email = ${ownerEmail} RETURNING slug`;
  return rows.length > 0;
}
