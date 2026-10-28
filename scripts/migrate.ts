/**
 * Applies supabase/migrations/*.sql in order, once each.
 * Usage: npm run db:migrate   (reads DB_URL from .env)
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { parseDbUrl } from "../lib/db-url";

async function main(): Promise<void> {
  const raw = process.env.DB_URL;
  if (!raw) throw new Error("DB_URL is not set (add it to .env)");

  const client = new Client({ ...parseDbUrl(raw), ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query(
      "create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const { rows } = await client.query<{ name: string }>("select name from public.schema_migrations");
    const applied = new Set(rows.map((r) => r.name));

    const dir = path.join(process.cwd(), "supabase", "migrations");
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip   ${file}`);
        continue;
      }
      await client.query("begin");
      try {
        await client.query(readFileSync(path.join(dir, file), "utf8"));
        await client.query("insert into public.schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
        console.log(`apply  ${file}`);
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }
    await client.query("alter table public.schema_migrations enable row level security");
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
