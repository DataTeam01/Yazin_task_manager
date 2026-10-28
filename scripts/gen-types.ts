/** Regenerates types/database.ts from the live schema (needs Docker running). */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { parseDbUrl } from "../lib/db-url";

const raw = process.env.DB_URL;
if (!raw) throw new Error("DB_URL is not set (add it to .env)");
const c = parseDbUrl(raw);
const url = `postgresql://${encodeURIComponent(c.user)}:${encodeURIComponent(c.password)}@${c.host}:${c.port}/${c.database}`;

const out = execFileSync(
  "npx",
  ["supabase", "gen", "types", "typescript", "--db-url", url, "--schema", "public"],
  { encoding: "utf8", shell: true },
);
writeFileSync("types/database.ts", out);
console.log("wrote types/database.ts");
